import {
    GatewayMessageReactionAddDispatchData,
    GatewayMessageReactionRemoveAllDispatchData,
    GatewayMessageReactionRemoveDispatchData,
    GatewayMessageReactionRemoveEmojiDispatchData
} from "discord-api-types/v10";
import {GatewayBroker} from "../Broker.js";
import {scanKeys} from "../util/redis/scanKeys.js";
import {update} from "../util/redis/update.js";
import {CacheNames} from "../util/validateConfig.js";

const entity = CacheNames.Reaction;

export async function MessageReactionAdd(broker: GatewayBroker, data: any) {
    const parsed = JSON.parse(data) as GatewayMessageReactionAddDispatchData;
    const key = `${entity}:${parsed.guild_id}:${parsed.channel_id}:${parsed.message_id}:${parsed.emoji.id ?? parsed.emoji.name}`;
    const ttl = broker.entityConfigMap.get(entity)!.ttl;

    const oldData = JSON.parse(await broker.cache!.get(key) || '[]');
    const newData = [...oldData, parsed.user_id];

    if (ttl !== -1) await broker.cache!.set(key, JSON.stringify(newData), "EX", ttl);
    else await broker.cache!.set(key, JSON.stringify(newData));

    console.log(`Updated ${key} (ttl: ${ttl})`);

    if ("member" in parsed && parsed.member) {
        const memberKey = `${CacheNames.Member}:${parsed.guild_id}:${parsed.user_id}`;
        await update(broker.cache!, memberKey, parsed.member, broker.entityConfigMap.get(CacheNames.Member)!.ttl);
        console.log(`[Cascade] Updated ${memberKey} (ttl: ${broker.entityConfigMap.get(CacheNames.Member)!.ttl})`);

        const userKey = `${CacheNames.User}:${parsed.user_id}`;
        await update(broker.cache!, userKey, parsed.member.user, broker.entityConfigMap.get(CacheNames.User)!.ttl);
        console.log(`[Cascade] Updated ${userKey} (ttl: ${broker.entityConfigMap.get(CacheNames.User)!.ttl})`);
    }
}

export async function MessageReactionRemove(broker: GatewayBroker, data: any) {
    const parsed = JSON.parse(data) as GatewayMessageReactionRemoveDispatchData;
    const key = `${entity}:${parsed.guild_id}:${parsed.channel_id}:${parsed.message_id}:${parsed.emoji.id ?? parsed.emoji.name}`;
    const ttl = broker.entityConfigMap.get(entity)!.ttl;

    const oldData = JSON.parse(await broker.cache!.get(key) || '[]');
    const newData = oldData.filter((id: string) => id !== parsed.user_id);

    if (newData.length === 0) {
        await broker.cache!.del(key);
        console.log(`Deleted ${key}`);
    } else {
        if (ttl !== -1) await broker.cache!.set(key, JSON.stringify(newData), "EX", ttl);
        else await broker.cache!.set(key, JSON.stringify(newData));

        console.log(`Updated ${key} (ttl: ${broker.entityConfigMap.get(entity)!.ttl})`);
    }
}

export async function MessageReactionRemoveAll(broker: GatewayBroker, data: any) {
    const parsed = JSON.parse(data) as GatewayMessageReactionRemoveAllDispatchData;
    const pattern = `${entity}:${parsed.guild_id}:${parsed.channel_id}:${parsed.message_id}:*`;
    const keys = await scanKeys(broker, pattern);

    if (keys.length > 0) {
        await broker.cache!.del(keys);
        console.log(`Deleted ${keys.length} keys from ${pattern}`);
    }
}

export async function MessageReactionRemoveEmoji(broker: GatewayBroker, data: any) {
    const parsed = JSON.parse(data) as GatewayMessageReactionRemoveEmojiDispatchData;
    const key = `${entity}:${parsed.guild_id}:${parsed.channel_id}:${parsed.message_id}:${parsed.emoji.id ?? parsed.emoji.name}`;

    await broker.cache!.del(key);

    console.log(`Deleted ${key}`);
}
