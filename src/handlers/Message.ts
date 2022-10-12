import {
    GatewayMessageCreateDispatchData, GatewayMessageDeleteBulkDispatchData,
    GatewayMessageDeleteDispatchData,
    GatewayMessageUpdateDispatchData
} from "discord-api-types/v10";
import {GatewayBroker} from "../Broker.js";
import {scanKeys} from "../util/redis/scanKeys.js";
import {update} from "../util/redis/update.js";
import {CacheNames} from "../util/validateConfig.js";

const entity = CacheNames.Message;

export async function MessageCreate(broker: GatewayBroker, data: any) {
    const parsed = JSON.parse(data) as GatewayMessageCreateDispatchData;
    const key = `${entity}:${parsed.guild_id ?? "dm"}:${parsed.channel_id}:${parsed.id}`;
    const ttl = broker.entityConfigMap.get(entity)!.ttl;

    if (ttl !== -1) await broker.cache!.set(key, data, "EX", ttl);
    else await broker.cache!.set(key, data);

    console.log(`Cached ${key} (ttl: ${ttl})`);

    await MessageCreateUpdateCascade(broker, parsed);

    const channelKey = `${CacheNames.Channel}:${parsed.guild_id ?? "dm"}:${parsed.channel_id}`;
    await update(broker.cache!, channelKey, {last_message_id: parsed.id}, broker.entityConfigMap.get(CacheNames.Channel)!.ttl);
    console.log(`[Cascade] Updated ${channelKey} (ttl: ${broker.entityConfigMap.get(CacheNames.Channel)!.ttl})`);
}

export async function MessageUpdate(broker: GatewayBroker, data: any) {
    const parsed = JSON.parse(data) as GatewayMessageUpdateDispatchData;
    const key = `${entity}:${parsed.guild_id ?? "dm"}:${parsed.channel_id}:${parsed.id}`;
    const ttl = broker.entityConfigMap.get(entity)!.ttl;

    await update(broker.cache!, key, parsed, ttl);

    console.log(`Updated ${key} (ttl: ${ttl})`);

    await MessageCreateUpdateCascade(broker, parsed);
}

export async function MessageDelete(broker: GatewayBroker, data: any) {
    const parsed = JSON.parse(data) as GatewayMessageDeleteDispatchData;
    const key = `${entity}:${parsed.guild_id ?? "dm"}:${parsed.channel_id}:${parsed.id}`;

    await broker.cache!.del(key);
    console.log(`Deleted ${key}`);

    const reactionKeys = await scanKeys(broker, `${CacheNames.Reaction}:${parsed.guild_id ?? "dm"}:${parsed.channel_id}:${parsed.id}:*`);

    if (reactionKeys.length > 0) {
        await broker.cache!.del(reactionKeys);
        console.log(`[Cascade] Deleted ${reactionKeys.length} messages from ${key}`);
    }
}

export async function MessageDeleteBulk(broker: GatewayBroker, data: any) {
    const parsed = JSON.parse(data) as GatewayMessageDeleteBulkDispatchData;
    const keys = parsed.ids.map(id => `${entity}:${parsed.guild_id ?? "dm"}:${parsed.channel_id}:${id}`);

    await broker.cache!.del(keys);
    console.log(`Deleted ${keys.length} messages in bulk`);

    for (const messageKey of keys) {
        const messageId = messageKey.split(":")[3];
        const reactionKeys = await broker.cache!.keys(`${CacheNames.Reaction}:${parsed.guild_id ?? "dm"}:${parsed.channel_id}:${messageId}:*`);

        if (reactionKeys.length > 0) {
            await broker.cache!.del(reactionKeys);
            console.log(`[Cascade] Deleted ${reactionKeys.length} messages from ${messageKey}`);
        }
    }
}

export async function MessageCreateUpdateCascade(broker: GatewayBroker, data: GatewayMessageCreateDispatchData | GatewayMessageUpdateDispatchData) {
    if (!data.webhook_id && data.author && broker.entityConfigMap.get(CacheNames.User)) {
        const userKey = `${CacheNames.User}:${data.author.id}`;
        await update(broker.cache!, userKey, data.author, broker.entityConfigMap.get(CacheNames.User)!.ttl);
        console.log(`[Cascade] Updated ${userKey} (ttl: ${broker.entityConfigMap.get(CacheNames.User)!.ttl})`);
    }

    if (data.member && data.author && broker.entityConfigMap.get(CacheNames.Member)) {
        const memberKey = `${CacheNames.Member}:${data.guild_id}:${data.author.id}`;
        await update(broker.cache!, memberKey, data.member, broker.entityConfigMap.get(CacheNames.Member)!.ttl);
        console.log(`[Cascade] Updated ${memberKey} (ttl: ${broker.entityConfigMap.get(CacheNames.Member)!.ttl})`);
    }

    if (data.mentions && broker.entityConfigMap.get(CacheNames.User)) {
        for (const user of data.mentions) {
            const userKey = `${CacheNames.User}:${user.id}`;
            await update(broker.cache!, userKey, user, broker.entityConfigMap.get(CacheNames.User)!.ttl);
            console.log(`[Cascade] Updated ${userKey} (ttl: ${broker.entityConfigMap.get(CacheNames.User)!.ttl})`);
        }
    }

    if (data.mention_roles && broker.entityConfigMap.get(CacheNames.Role)) {
        for (const role of data.mention_roles) {
            const roleKey = `${CacheNames.Role}:${data.guild_id}:${role}`;
            await update(broker.cache!, roleKey, role, broker.entityConfigMap.get(CacheNames.Role)!.ttl);
            console.log(`[Cascade] Updated ${roleKey} (ttl: ${broker.entityConfigMap.get(CacheNames.Role)!.ttl})`);
        }
    }

    if (data.mention_channels && broker.entityConfigMap.get(CacheNames.Channel)) {
        for (const channel of data.mention_channels) {
            const channelKey = `${CacheNames.Channel}:${data.guild_id}:${channel.id}`;
            await update(broker.cache!, channelKey, channel, broker.entityConfigMap.get(CacheNames.Channel)!.ttl);
            console.log(`[Cascade] Updated ${channelKey} (ttl: ${broker.entityConfigMap.get(CacheNames.Channel)!.ttl})`);
        }
    }

    if (data.referenced_message && broker.entityConfigMap.get(CacheNames.Message)) {
        const messageKey = `${CacheNames.Message}:${data.guild_id ?? "dm"}:${data.referenced_message.channel_id}:${data.referenced_message.id}`;
        await update(broker.cache!, messageKey, data.referenced_message, broker.entityConfigMap.get(CacheNames.Message)!.ttl);
        console.log(`[Cascade] Updated ${messageKey} (ttl: ${broker.entityConfigMap.get(CacheNames.Message)!.ttl})`);
    }

    if (data.thread && broker.entityConfigMap.get(CacheNames.Channel)) {
        const threadKey = `${CacheNames.Channel}:${data.guild_id}:${data.thread.id}`;
        await update(broker.cache!, threadKey, data.thread, broker.entityConfigMap.get(CacheNames.Channel)!.ttl);
        console.log(`[Cascade] Updated ${threadKey} (ttl: ${broker.entityConfigMap.get(CacheNames.Channel)!.ttl})`);
    }

    if (data.stickers && broker.entityConfigMap.get(CacheNames.Sticker)) {
        for (const sticker of data.stickers) {
            const stickerKey = `${CacheNames.Sticker}:${sticker.id}`;
            await update(broker.cache!, stickerKey, sticker, broker.entityConfigMap.get(CacheNames.Sticker)!.ttl);
            console.log(`[Cascade] Updated ${stickerKey} (ttl: ${broker.entityConfigMap.get(CacheNames.Sticker)!.ttl})`);
        }
    }
}
