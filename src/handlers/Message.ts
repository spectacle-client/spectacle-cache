import {
    GatewayMessageCreateDispatchData,
    GatewayMessageDeleteBulkDispatchData,
    GatewayMessageDeleteDispatchData,
    GatewayMessageUpdateDispatchData
} from "discord-api-types/v10";
import {GatewayBroker} from "../Broker.js";
import {del, scanKeys, set, update} from "../util/redis/index.js";
import {CacheNames} from "../util/validateConfig.js";

const entity = CacheNames.Message;

export async function MessageCreate(broker: GatewayBroker, data: string) {
    const parsed = JSON.parse(data) as GatewayMessageCreateDispatchData;
    const key = `${entity}:${parsed.guild_id ?? "dm"}:${parsed.channel_id}:${parsed.id}`;
    await set(broker, entity, key, data);

    await MessageCreateUpdateCascade(broker, parsed);

    const channelKey = `${CacheNames.Channel}:${parsed.guild_id ?? "dm"}:${parsed.channel_id}`;
    await update(broker, CacheNames.Channel, channelKey, {last_message_id: parsed.id}, true);
}

export async function MessageUpdate(broker: GatewayBroker, data: string) {
    const parsed = JSON.parse(data) as GatewayMessageUpdateDispatchData;
    const key = `${entity}:${parsed.guild_id ?? "dm"}:${parsed.channel_id}:${parsed.id}`;
    await update(broker, entity, key, parsed);

    await MessageCreateUpdateCascade(broker, parsed);
}

export async function MessageDelete(broker: GatewayBroker, data: string) {
    const parsed = JSON.parse(data) as GatewayMessageDeleteDispatchData;
    const key = `${entity}:${parsed.guild_id ?? "dm"}:${parsed.channel_id}:${parsed.id}`;
    await del(broker, key);

    const reactionKeys = await scanKeys(broker, `${CacheNames.Reaction}:${parsed.guild_id ?? "dm"}:${parsed.channel_id}:${parsed.id}:*`);

    if (reactionKeys.length > 0)
        await del(broker, reactionKeys, {cascade: true, originKey: key});
}

export async function MessageDeleteBulk(broker: GatewayBroker, data: string) {
    const parsed = JSON.parse(data) as GatewayMessageDeleteBulkDispatchData;
    const keys = parsed.ids.map(id => `${entity}:${parsed.guild_id ?? "dm"}:${parsed.channel_id}:${id}`);
    await del(broker, keys, {originKey: `${entity}:${parsed.guild_id ?? "dm"}:${parsed.channel_id}`});

    for (const messageKey of keys) {
        const reactionKeys = await scanKeys(broker, `${CacheNames.Reaction}:${parsed.guild_id ?? "dm"}:${parsed.channel_id}:${messageKey.split(":")[3]}:*`);

        if (reactionKeys.length > 0)
            await del(broker, reactionKeys, {cascade: true, originKey: messageKey});
    }
}

export async function MessageCreateUpdateCascade(broker: GatewayBroker, data: GatewayMessageCreateDispatchData | GatewayMessageUpdateDispatchData) {
    if (!data.webhook_id && data.author) {
        const userKey = `${CacheNames.User}:${data.author.id}`;
        await update(broker, CacheNames.User, userKey, data.author);
    }

    if (data.member && data.author) {
        const memberKey = `${CacheNames.Member}:${data.guild_id}:${data.author.id}`;
        await update(broker, CacheNames.Member, memberKey, data.member);
    }

    if (data.mentions) {
        for (const user of data.mentions) {
            const userKey = `${CacheNames.User}:${user.id}`;
            await update(broker, CacheNames.User, userKey, user);
        }
    }

    if (data.mention_roles) {
        for (const role of data.mention_roles) {
            const roleKey = `${CacheNames.Role}:${data.guild_id}:${role}`;
            await update(broker, CacheNames.Role, roleKey, {mentionable: true});
        }
    }

    if (data.mention_channels) {
        for (const channel of data.mention_channels) {
            const channelKey = `${CacheNames.Channel}:${data.guild_id}:${channel.id}`;
            await update(broker, CacheNames.Channel, channelKey, {mentionable: true});
        }
    }

    if (data.referenced_message) {
        const messageKey = `${CacheNames.Message}:${data.guild_id ?? "dm"}:${data.referenced_message.channel_id}:${data.referenced_message.id}`;
        await update(broker, CacheNames.Message, messageKey, data.referenced_message);
    }

    if (data.thread) {
        const threadKey = `${CacheNames.Channel}:${data.guild_id}:${data.thread.id}`;
        await update(broker, CacheNames.Channel, threadKey, data.thread);
    }

    if (data.stickers) {
        for (const sticker of data.stickers) {
            const stickerKey = `${CacheNames.Sticker}:${sticker.id}`;
            await update(broker, CacheNames.Sticker, stickerKey, sticker);
        }
    }
}
