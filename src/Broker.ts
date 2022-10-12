import {Amqp as AmqpBroker, Broker, Redis as RedisBroker} from "@spectacles/brokers";
import {readFileSync} from "fs";
import Redis, {Cluster} from "ioredis";
import * as Util from "util";
import {CacheNameEvents, GatewayEvents} from "./constants/CacheNameEvents.js";
import {handlers} from "./handlers/handlers.js";
import {CacheNames, Config, validateConfig} from "./util/validateConfig.js";

export interface EntityConfig {
    prefix: string,
    ttl: number,
}

export class GatewayBroker {
    private broker: Broker | null = null;
    public cache: Redis | Cluster | null = null;
    public gatewayEvents: GatewayEvents[] = [];
    public readonly config: Config;
    public readonly entityConfigMap = new Map<string, EntityConfig>();

    public constructor(configPath: string) {
        const jsonFile = readFileSync(configPath, "utf8");
        this.config = validateConfig(JSON.parse(jsonFile));
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
    }

    private calculateEvents() {
        const tempGatewayEvents: GatewayEvents[] = [];
        this.entityConfigMap.clear();

        for (const cacheName of Object.values(CacheNames)) {
            if (this.config.entities[cacheName]) {
                if (typeof this.config.entities[cacheName].enabled === "boolean" && !this.config.entities[cacheName].enabled)
                    continue;

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

        console.log(`Cache configuration:\n  ${Util.inspect(this.entityConfigMap, {depth: 1}).replace(/Map\(\d*\)\s{/, "").replace(/}$/, "").trim()}\n`);
    }

    public subscribe() {
        if (!this.broker)
            throw new Error("Broker not connected");

        this.calculateEvents();

        for (const event of this.gatewayEvents)
            this.broker.on(event, handlers[event]
                // @ts-ignore
            ? handlers[event]!.bind(null, this)
            : handlers.default.bind(null, this, event));

        this.broker.subscribe(this.gatewayEvents);
        console.log(`Subscribed to ${this.gatewayEvents.length} events`);
        console.log(`Starting normal operation...\n`);
    }
}
