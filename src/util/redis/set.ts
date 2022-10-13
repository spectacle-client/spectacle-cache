import {GatewayBroker} from "../../Broker.js";
import {CacheNames} from "../validateConfig.js";

export async function set(broker: GatewayBroker, entity: CacheNames, key: string, data: string, options: {cascade?: boolean, update?: boolean} = {}) {
    const config = broker.entityConfigMap.get(entity);

    if (!config) return;

    if (config.ttl === -1) {
        await broker.cache!.set(key, data);
        console.log(`${options.cascade ? "[Cascade] " : ""}${options.update ? "Updated" : "Cached"} ${key}`);
    } else {
        await broker.cache!.set(key, data, "EX", config.ttl);
        console.log(`${options.cascade ? "[Cascade] " : ""}${options.update ? "Updated" : "Cached"} ${key} (ttl: ${config.ttl})`);
    }
}
