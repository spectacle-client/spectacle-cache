import {Amqp as AmqpBroker, Broker, Redis as RedisBroker} from "@spectacles/brokers";
import {readFileSync} from "fs";
import Redis, {Cluster, Result} from "ioredis";
import * as Util from "util";
import {Deduplicator} from "@spectacle-client/dedupe.ts";
import {CacheNameEvents, GatewayEvents} from "./constants/CacheNameEvents.js";
import {handlers} from "./handlers/handlers.js";
import {CacheNames, Config, validateConfig} from "./util/validateConfig.js";

export interface EntityConfig {
    prefix: string,
    ttl: number,
}

declare module "ioredis" {
    interface RedisCommander<Context> {
        getFull(key: string): Result<string, Context>;
    }
}

export class GatewayBroker {
    private broker: Broker | null = null;
    public cache: Redis | Cluster | null = null;
    public gatewayEvents: GatewayEvents[] = [];
    public readonly config: Config;
    public readonly entityConfigMap = new Map<string, EntityConfig>();
    public deduplicator: Deduplicator | null = null;

    public constructor(configPath: string) {
        const jsonFile = readFileSync(configPath, "utf8");
        this.config = validateConfig(JSON.parse(jsonFile));

        if (typeof this.config.logging === "boolean" && !this.config.logging) {
            console.log = () => {};
        }
    }

    public async connectBroker() {
        if (this.config.broker.type === "redis") {
            if (this.config.broker.urls.length > 1) {
                const cluster = new Cluster(this.config.broker.urls, {lazyConnect: true});
                await cluster.connect();
                this.broker = new RedisBroker(this.config.broker.group || "cache", cluster);
            } else {
                const redis = new Redis(this.config.broker.urls[0], {lazyConnect: true});
                await redis.connect();
                this.broker = new RedisBroker(this.config.broker.group || "cache", redis);
            }
        } else if (this.config.broker.type === "amqp") {
            const amqp = new AmqpBroker(this.config.broker.group || "cache");
            await amqp.connect(this.config.broker.urls[0]);
            this.broker = amqp;
        }
    }

    public async connectCache() {
        if (this.config.cache.urls.length > 1) {
            const cluster = new Cluster(this.config.cache.urls, {lazyConnect: true});
            await cluster.connect();
            this.cache = cluster;
        } else {
            const redis = new Redis(this.config.cache.urls[0], {lazyConnect: true});
            await redis.connect();
            this.cache = redis;
        }

        this.cache.defineCommand("getFull", {
            numberOfKeys: 1,
            lua: readFileSync("node_modules/@spectacle-client/dedupe.ts/scripts/getfull.lua", "utf8"),
        })
    }

    private calculateEvents() {
        const tempGatewayEvents: GatewayEvents[] = [];
        const tempEntities: CacheNames[] = [];
        this.entityConfigMap.clear();

        for (const cacheName of Object.values(CacheNames)) {
            if (this.config.entities[cacheName]) {
                if (typeof this.config.entities[cacheName].enabled === "boolean" && !this.config.entities[cacheName].enabled)
                    continue;

                tempEntities.push(cacheName);

                let prefix: string = cacheName;
                if (this.config.entities[cacheName].prefix) {
                    prefix = this.config.entities[cacheName].prefix;
                } else {
                    if (this.config.default.prefixCase === "lower") {
                        prefix = prefix.toLowerCase();
                    } else if (this.config.default.prefixCase === "upper") {
                        prefix = prefix.toUpperCase();
                    } else if (this.config.default.prefixCase === "capital") {
                        prefix = prefix[0].toUpperCase() + prefix.slice(1).toLowerCase();
                    }
                }

                this.entityConfigMap.set(cacheName, {
                    prefix: prefix,
                    ttl: this.config.entities[cacheName].ttl ?? this.config.default.ttl,
                });

                tempGatewayEvents.push(...CacheNameEvents.get(cacheName)!);
            } else {
                let prefix: string = cacheName;
                if (this.config.default.prefixCase === "lower") {
                    prefix = prefix.toLowerCase();
                } else if (this.config.default.prefixCase === "upper") {
                    prefix = prefix.toUpperCase();
                } else if (this.config.default.prefixCase === "capital") {
                    prefix = prefix[0].toUpperCase() + prefix.slice(1).toLowerCase();
                }
                this.entityConfigMap.set(cacheName, {
                    prefix: prefix,
                    ttl: this.config.default.ttl,
                });

                tempGatewayEvents.push(...CacheNameEvents.get(cacheName)!);
            }
        }

        this.gatewayEvents = Array.from(new Set(tempGatewayEvents));
        this.deduplicator = new Deduplicator(tempEntities);

        console.log(`Cache configuration:\n  ${Util.inspect(this.entityConfigMap, {depth: 1}).replace(/Map\(\d*\)\s{/, "").replace(/}$/, "").trim()}\n`);
    }

    public subscribe() {
        if (!this.broker)
            throw new Error("Broker not connected");

        this.calculateEvents();

        for (const event of this.gatewayEvents)
        {
            this.broker.on(event, (data, { ack }) => {
                const handler = handlers[event]
                    ? handlers[event]!.bind(null, this)
                    : handlers.default.bind(null, this, event);

                ack();
                handler(data);
            });
        }

        this.broker.subscribe(this.gatewayEvents);
        console.log(`Subscribed to ${this.gatewayEvents.length} events`);
        console.log(`Starting normal operation...\n`);
    }
}
