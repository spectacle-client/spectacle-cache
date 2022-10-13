import {GatewayBroker} from "../../Broker.js";
import {CacheNames} from "../validateConfig.js";

export async function del(broker: GatewayBroker, entity: CacheNames, key: string | string[], options: {cascade?: boolean, originKey?: string} = {}) {
    if (!broker.entityConfigMap.get(entity)) return;

    if (Array.isArray(key)) {
        await broker.cache!.del(key);
        console.log(`${options.cascade ? "[Cascade] " : ""}Deleted ${key.length} keys${options.originKey ? ` from ${options.originKey}` : ""}`);
    } else {
        await broker.cache!.del(key);
        console.log(`${options.cascade ? "[Cascade] " : ""}Deleted ${key}${options.originKey ? ` from ${options.originKey}` : ""}`);
    }
}
