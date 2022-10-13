import {
    GatewayMessageReactionAddDispatchData,
    GatewayMessageReactionRemoveAllDispatchData,
    GatewayMessageReactionRemoveDispatchData,
    GatewayMessageReactionRemoveEmojiDispatchData
} from "discord-api-types/v10";
import {GatewayBroker} from "../Broker.js";
import {del, scanKeys, set, update} from "../util/redis/index.js";
import {CacheNames} from "../util/validateConfig.js";

const entity = CacheNames.Reaction;

export async function MessageReactionAdd(broker: GatewayBroker, data: string) {
    const parsed = JSON.parse(data) as GatewayMessageReactionAddDispatchData;
    const key = `${entity}:${parsed.guild_id}:${parsed.channel_id}:${parsed.message_id}:${parsed.emoji.id ?? parsed.emoji.name}`;

    const oldData = JSON.parse(await broker.cache!.get(key) || '[]');
    const newData = [...oldData, parsed.user_id];

    await set(broker, entity, key, JSON.stringify(newData), {update: true});

    if ("member" in parsed && parsed.member) {
        const memberKey = `${CacheNames.Member}:${parsed.guild_id}:${parsed.user_id}`;
        await update(broker, CacheNames.Member, memberKey, parsed.member);

        const userKey = `${CacheNames.User}:${parsed.user_id}`;
        await update(broker, CacheNames.User, userKey, parsed.member.user!);
    }
}

export async function MessageReactionRemove(broker: GatewayBroker, data: string) {
    const parsed = JSON.parse(data) as GatewayMessageReactionRemoveDispatchData;
    const key = `${entity}:${parsed.guild_id}:${parsed.channel_id}:${parsed.message_id}:${parsed.emoji.id ?? parsed.emoji.name}`;

    const oldData = JSON.parse(await broker.cache!.get(key) || '[]');
    const newData = oldData.filter((id: string) => id !== parsed.user_id);

    if (newData.length === 0) {
        await del(broker, entity, key);
    } else {
        await set(broker, entity, key, JSON.stringify(newData), {update: true});
    }
}

export async function MessageReactionRemoveAll(broker: GatewayBroker, data: string) {
    const parsed = JSON.parse(data) as GatewayMessageReactionRemoveAllDispatchData;
    const pattern = `${entity}:${parsed.guild_id}:${parsed.channel_id}:${parsed.message_id}:*`;
    const keys = await scanKeys(broker, pattern);

    if (keys.length > 0)
        await del(broker, entity, keys, {originKey: pattern});
}

export async function MessageReactionRemoveEmoji(broker: GatewayBroker, data: string) {
    const parsed = JSON.parse(data) as GatewayMessageReactionRemoveEmojiDispatchData;
    const key = `${entity}:${parsed.guild_id}:${parsed.channel_id}:${parsed.message_id}:${parsed.emoji.id ?? parsed.emoji.name}`;
    await del(broker, entity, key);
}
