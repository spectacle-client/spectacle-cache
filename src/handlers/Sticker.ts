import {GatewayGuildStickersUpdateDispatchData} from "discord-api-types/v10";
import {GatewayBroker} from "../Broker.js";
import {set} from "../util/redis/index.js";
import {CacheNames} from "../util/validateConfig.js";

const entity = CacheNames.Sticker;

export async function GuildStickersUpdate(broker: GatewayBroker, data: string) {
    const parsed = JSON.parse(data) as GatewayGuildStickersUpdateDispatchData;

    for (const sticker of parsed.stickers) {
        const key = `${entity}:${parsed.guild_id}:${sticker.id}`;
        await set(broker, entity, key, data);
    }
}
