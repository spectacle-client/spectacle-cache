import {GatewayBroker} from "../../Broker.js";
import {CacheNames} from "../validateConfig.js";
import {deduplicate} from "@spectacle-client/dedupe.ts";
// @ts-ignore
import {compress} from 'cppzst';

export async function set(broker: GatewayBroker, entity: CacheNames, key: string, data: string, options: {cascade?: boolean, update?: boolean} = {}) {
    const config = broker.entityConfigMap.get(entity);
    if (!config) return;

    const deduplicated = JSON.stringify(deduplicate(entity, JSON.parse(data)));
    const dict = broker.dictMap.get(entity);
    const compressOptions = dict ? {dict, compressionLevel: 1} : {compressionLevel: 1};
    const compressed = await compress(Buffer.from(deduplicated), compressOptions);

    if (config.ttl === -1) {
        await broker.cache!.set(key, compressed);
        console.log(`${options.cascade ? "[Cascade] " : ""}${options.update ? "Updated" : "Cached"} ${key}`);
    } else {
        await broker.cache!.set(key, compressed, "EX", config.ttl);
        console.log(`${options.cascade ? "[Cascade] " : ""}${options.update ? "Updated" : "Cached"} ${key} (ttl: ${config.ttl})`);
    }
}
