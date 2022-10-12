import {GatewayGuildEmojisUpdateDispatchData} from "discord-api-types/v10";
import {GatewayBroker} from "../Broker.js";
import {CacheNames} from "../util/validateConfig.js";

const entity = CacheNames.Emoji;

export async function GuildEmojisUpdate(broker: GatewayBroker, data: any) {
    const parsed = JSON.parse(data) as GatewayGuildEmojisUpdateDispatchData;
    const ttl = broker.entityConfigMap.get(entity)!.ttl;

    for (const emoji of parsed.emojis) {
        if (!emoji.id) continue;
        const key = `${entity}:${parsed.guild_id}:${emoji.id}`;

        if (ttl !== -1) await broker.cache!.set(key, JSON.stringify(emoji), "EX", ttl);
        else await broker.cache!.set(key, JSON.stringify(emoji));

        console.log(`Cached ${key} (ttl: ${ttl})`);
    }
}
