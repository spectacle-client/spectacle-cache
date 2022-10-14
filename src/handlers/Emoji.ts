import {GatewayGuildEmojisUpdateDispatchData} from "discord-api-types/v10";
import {GatewayBroker} from "../Broker.js";
import {set} from "../util/redis/index.js";
import {CacheNames} from "../util/validateConfig.js";

const entity = CacheNames.Emoji;

export async function GuildEmojisUpdate(broker: GatewayBroker, data: string) {
    const parsed = JSON.parse(data) as GatewayGuildEmojisUpdateDispatchData;

    for (const emoji of parsed.emojis) {
        if (!emoji.id) continue;
        const key = `${entity}:${emoji.id}`;
        await set(broker, entity, key, JSON.stringify(emoji));
    }
}
