import {GatewayBroker} from "../../Broker.js";
import {CacheNames} from "../validateConfig.js";
import {set} from "./set.js";
// @ts-ignore
import {decompress} from 'cppzst';

export async function update(broker: GatewayBroker, entity: CacheNames, key: string, data: {[key: string]: any}, cascade = false)  {
    const dict = broker.dictMap.get(entity);
    const decompressOptions = dict ? {dict} : {};
    const compressed = await broker.cache!.getBuffer(key);

    let oldData
    if (compressed) {
        try {
            oldData = await decompress(compressed, decompressOptions);
        } catch (err: any) {
            console.warn(`Failed to decompress ${key}! (Content: ${compressed})`);
            console.warn(err);
        }
    } else {
        oldData = "{}";
    }

    const newData = JSON.stringify({...JSON.parse(oldData), ...data});
    if (oldData === newData) return;
    await set(broker, entity, key, newData, {cascade, update: true});
}
