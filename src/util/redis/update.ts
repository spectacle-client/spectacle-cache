import {GatewayBroker} from "../../Broker.js";
import {CacheNames} from "../validateConfig.js";
import {set} from "./set.js";

export async function update(broker: GatewayBroker, entity: CacheNames, key: string, data: {[key: string]: any}, cascade = false)  {
    const oldData = await broker.cache!.get(key);
    const newData = JSON.stringify({...JSON.parse(oldData || "{}"), ...data});
    await set(broker, entity, key, newData, {cascade, update: true});
}
