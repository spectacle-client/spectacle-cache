import {GatewayBroker} from "../../Broker.js";

export async function del(broker: GatewayBroker, key: string | string[], options: {cascade?: boolean, originKey?: string} = {}) {
    if (Array.isArray(key)) {
        await broker.cache!.del(key);
        console.log(`${options.cascade ? "[Cascade] " : ""}Deleted ${key.length} keys${options.originKey ? ` from ${options.originKey}` : ""}`);
    } else {
        await broker.cache!.del(key);
        console.log(`${options.cascade ? "[Cascade] " : ""}Deleted ${key}${options.originKey ? ` from ${options.originKey}` : ""}`);
    }
}
