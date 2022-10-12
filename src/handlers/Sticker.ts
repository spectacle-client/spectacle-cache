import {GatewayGuildStickersUpdateDispatchData} from "discord-api-types/v10";
import {GatewayBroker} from "../Broker.js";
import {CacheNames} from "../util/validateConfig.js";

const entity = CacheNames.Sticker;

export async function GuildStickersUpdate(broker: GatewayBroker, data: any) {
    const parsed = JSON.parse(data) as GatewayGuildStickersUpdateDispatchData;
    const ttl = broker.entityConfigMap.get(entity)!.ttl;

    for (const sticker of parsed.stickers) {
        const key = `${entity}:${parsed.guild_id}:${sticker.id}`;

        if (ttl !== -1) await broker.cache!.set(key, JSON.stringify(sticker), "EX", ttl);
        else await broker.cache!.set(key, JSON.stringify(sticker));

        console.log(`Cached ${key} (ttl: ${ttl})`);
    }
}
