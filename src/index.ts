import {Amqp as AmqpBroker, Broker, Redis as RedisBroker} from '@spectacles/brokers';
import Redis, {Cluster} from "ioredis";
import {readFile} from "fs/promises";
import * as Util from "util";
import {CacheNameEvents, GatewayEvents} from "./constants/CacheNameEvents.js";
import {CacheNames, validateConfig} from "./util/validateConfig.js";

const jsonFile = await readFile("./config.json", "utf8");
const parsedConfig = validateConfig(JSON.parse(jsonFile));

let broker: Broker | null = null;

if (parsedConfig.broker.type === "redis") {
    if (parsedConfig.broker.urls.length > 1) {
        const cluster = new Cluster(parsedConfig.broker.urls, {lazyConnect: true});
        await cluster.connect();
        broker = new RedisBroker(parsedConfig.broker.group || "cache", cluster);
    } else {
        const redis = new Redis(parsedConfig.broker.urls[0], {lazyConnect: true});
        await redis.connect();
        broker = new RedisBroker(parsedConfig.broker.group || "cache", redis);
    }
} else if (parsedConfig.broker.type === "amqp") {
    const amqp = new AmqpBroker(parsedConfig.broker.group || "cache");
    await amqp.connect(parsedConfig.broker.urls[0]);
    broker = amqp;
}

broker!.on("error", console.error);

export interface EventConfig {
    prefix: string,
    ttl: number,
}

const eventMap = new Map<string, EventConfig>();
const subscribeTo: GatewayEvents[] = [];

for (const cacheName of Object.values(CacheNames)) {
    if (parsedConfig.entities[cacheName]) {
        if (typeof parsedConfig.entities[cacheName].enabled === "boolean" && !parsedConfig.entities[cacheName].enabled)
            continue;

        let prefix: string = cacheName;
        if (parsedConfig.entities[cacheName].prefix) {
            prefix = parsedConfig.entities[cacheName].prefix;
        } else {
            if (parsedConfig.default.prefixCase === "lower") {
                prefix = prefix.toLowerCase();
            } else if (parsedConfig.default.prefixCase === "upper") {
                prefix = prefix.toUpperCase();
            } else if (parsedConfig.default.prefixCase === "capital") {
                prefix = prefix[0].toUpperCase() + prefix.slice(1).toLowerCase();
            }
        }

        eventMap.set(cacheName, {
            prefix: prefix,
            ttl: parsedConfig.entities[cacheName].ttl ?? parsedConfig.default.ttl,
        });

        subscribeTo.push(...CacheNameEvents.get(cacheName)!);
    } else {
        let prefix: string = cacheName;
        if (parsedConfig.default.prefixCase === "lower") {
            prefix = prefix.toLowerCase();
        } else if (parsedConfig.default.prefixCase === "upper") {
            prefix = prefix.toUpperCase();
        } else if (parsedConfig.default.prefixCase === "capital") {
            prefix = prefix[0].toUpperCase() + prefix.slice(1).toLowerCase();
        }
        eventMap.set(cacheName, {
            prefix: prefix,
            ttl: parsedConfig.default.ttl,
        });

        subscribeTo.push(...CacheNameEvents.get(cacheName)!);
    }
}

const eventSet = Array.from(new Set(subscribeTo));

console.log(Util.inspect(eventMap));
console.log(`Subscribing to ${eventSet.length} events:\n${eventSet.join(", ")}`);
