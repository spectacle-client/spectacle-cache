import {GatewayBroker} from "../Broker.js";
import {update} from "../util/redis/update.js";
import {CacheNames} from "../util/validateConfig.js";

export async function GenericCreate(entity: CacheNames, keyPath: ([string, string] | [string])[], broker: GatewayBroker, data: any) {
    const parsed = JSON.parse(data);

    let key = `${entity}`;
    for (const [path, substitute] of keyPath) {
        key += `:${parsed[path] ?? substitute}`;
    }
    const ttl = broker.entityConfigMap.get(entity)!.ttl;

    if (ttl !== -1) await broker.cache!.set(key, data, "EX", ttl);
    else await broker.cache!.set(key, data);

    console.log(`Cached ${key} (ttl: ${ttl})`);
}

export async function GenericUpdate(entity: CacheNames, keyPath: ([string, string] | [string])[], broker: GatewayBroker, data: any) {
    const parsed = JSON.parse(data);

    let key = `${entity}`;
    for (const [path, substitute] of keyPath) {
        key += `:${parsed[path] ?? substitute}`;
    }
    const ttl = broker.entityConfigMap.get(entity)!.ttl;

    await update(broker.cache!, key, parsed, ttl);

    console.log(`Updated ${key} (ttl: ${ttl})`);
}

export async function GenericDelete(entity: CacheNames, keyPath: ([string, string] | [string])[], broker: GatewayBroker, data: any) {
    const parsed = JSON.parse(data);

    let key = `${entity}`;
    for (const [path, substitute] of keyPath) {
        key += `:${parsed[path] ?? substitute}`;
    }

    await broker.cache!.del(key);
    console.log(`Deleted ${key}`);
}
