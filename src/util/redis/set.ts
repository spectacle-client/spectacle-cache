import {GatewayBroker} from "../../Broker.js";
import {CacheNames} from "../validateConfig.js";

export async function set(broker: GatewayBroker, entity: CacheNames, key: string, data: string, options: {cascade?: boolean, update?: boolean} = {}) {
    const config = broker.entityConfigMap.get(entity);
    if (!config) return;

    const deduplicated = JSON.stringify(broker.deduplicator!.deduplicate(entity, JSON.parse(data)));

    if (config.ttl === -1) {
        await broker.cache!.set(key, deduplicated);
        console.log(`${options.cascade ? "[Cascade] " : ""}${options.update ? "Updated" : "Cached"} ${key}`);
    } else {
        await broker.cache!.set(key, deduplicated, "EX", config.ttl);
        console.log(`${options.cascade ? "[Cascade] " : ""}${options.update ? "Updated" : "Cached"} ${key} (ttl: ${config.ttl})`);
    }
}
