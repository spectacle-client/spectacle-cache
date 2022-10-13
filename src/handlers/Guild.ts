import {
    GatewayGuildCreateDispatchData,
    GatewayGuildDeleteDispatchData,
    GatewayGuildUpdateDispatchData
} from "discord-api-types/v10";
import {GatewayBroker} from "../Broker.js";
import {del, set, update} from "../util/redis/index.js";
import {CacheNames} from "../util/validateConfig.js";

const entity = CacheNames.Guild;

export async function GuildCreate(broker: GatewayBroker, data: string) {
    const parsed = JSON.parse(data) as GatewayGuildCreateDispatchData;
    const key = `${entity}:${parsed.id}`;
    await set(broker, entity, key, data);

    await GuildCreateUpdateCascade(broker, parsed);
}

export async function GuildUpdate(broker: GatewayBroker, data: string) {
    const parsed = JSON.parse(data) as GatewayGuildUpdateDispatchData;
    const key = `${entity}:${parsed.id}`;
    await update(broker, entity, key, parsed);

    await GuildCreateUpdateCascade(broker, parsed);
}

export async function GuildDelete(broker: GatewayBroker, data: string) {
    const parsed = JSON.parse(data) as GatewayGuildDeleteDispatchData;
    const key = `${entity}:${parsed.id}`;
    await del(broker, key);

    const channelKeys = await broker.cache!.keys(`${CacheNames.Channel}:${parsed.id}:*`);
    for (const channelKey of channelKeys) {
        const channelId = channelKey.split(":")[2];
        const messageKeys = await broker.cache!.keys(`${CacheNames.Message}:${parsed.id}:${channelId}:*`);

        for (const messageKey of messageKeys) {
            const reactionKeys = await broker.cache!.keys(`${CacheNames.Reaction}:${parsed.id}:${channelId}:${messageKey.split(":")[3]}:*`);

            if (reactionKeys.length > 0)
                await del(broker, reactionKeys, {cascade: true, originKey: messageKey});
        }

        if (messageKeys.length > 0)
            await del(broker, messageKeys, {cascade: true, originKey: channelKey});

        const voiceStateKeys = await broker.cache!.keys(`${CacheNames.VoiceState}:${parsed.id}:${channelId}:*`);
        if (voiceStateKeys.length > 0)
            await del(broker, voiceStateKeys, {cascade: true, originKey: channelKey});
    }

    if (channelKeys.length > 0)
        await del(broker, channelKeys, {cascade: true, originKey: key});

    const autoModRuleKeys = await broker.cache!.keys(`${CacheNames.AutoModRule}:${parsed.id}:*`);
    if (autoModRuleKeys.length > 0)
        await del(broker, autoModRuleKeys, {cascade: true, originKey: key});

    const emojiKeys = await broker.cache!.keys(`${CacheNames.Emoji}:${parsed.id}:*`);
    if (emojiKeys.length > 0)
        await del(broker, emojiKeys, {cascade: true, originKey: key});

    const stickerKeys = await broker.cache!.keys(`${CacheNames.Sticker}:${parsed.id}:*`);
    if (stickerKeys.length > 0)
        await del(broker, stickerKeys, {cascade: true, originKey: key});

    const memberKeys = await broker.cache!.keys(`${CacheNames.Member}:${parsed.id}:*`);
    if (memberKeys.length > 0)
        await del(broker, memberKeys, {cascade: true, originKey: key});

    const roleKeys = await broker.cache!.keys(`${CacheNames.Role}:${parsed.id}:*`);
    if (roleKeys.length > 0)
        await del(broker, roleKeys, {cascade: true, originKey: key});

    const eventKeys = await broker.cache!.keys(`${CacheNames.Event}:${parsed.id}:*`);
    if (eventKeys.length > 0)
        await del(broker, eventKeys, {cascade: true, originKey: key});

    const integrationKeys = await broker.cache!.keys(`${CacheNames.Integration}:${parsed.id}:*`);
    if (integrationKeys.length > 0)
        await del(broker, integrationKeys, {cascade: true, originKey: key});

    const inviteKeys = await broker.cache!.keys(`${CacheNames.Invite}:${parsed.id}:*`);
    if (inviteKeys.length > 0)
        await del(broker, inviteKeys, {cascade: true, originKey: key});

    const stageKeys = await broker.cache!.keys(`${CacheNames.Stage}:${parsed.id}:*`);
    if (stageKeys.length > 0)
        await del(broker, stageKeys, {cascade: true, originKey: key});

    const presenceKeys = await broker.cache!.keys(`${CacheNames.Presence}:${parsed.id}:*`);
    if (presenceKeys.length > 0)
        await del(broker, presenceKeys, {cascade: true, originKey: key});
}

export async function GuildCreateUpdateCascade(broker: GatewayBroker, data: GatewayGuildCreateDispatchData | GatewayGuildUpdateDispatchData) {
    if ("voice_states" in data && data.voice_states) {
        for (const voiceState of data.voice_states) {
            if (!voiceState.channel_id) continue;
            const voiceStateKey = `${CacheNames.VoiceState}:${data.id}:${voiceState.channel_id}:${voiceState.user_id}`;
            await update(broker, CacheNames.VoiceState, voiceStateKey, voiceState);
        }
    }

    if ("members" in data && data.members) {
        for (const member of data.members) {
            const memberKey = `${CacheNames.Member}:${data.id}:${member.user!.id}`;
            await update(broker, CacheNames.Member, memberKey, member);

            const userKey = `${CacheNames.User}:${member.user!.id}`;
            await update(broker, CacheNames.User, userKey, member.user!);
        }
    }

    if ("channels" in data && data.channels) {
        for (const channel of data.channels) {
            const channelKey = `${CacheNames.Channel}:${data.id}:${channel.id}`;
            await update(broker, CacheNames.Channel, channelKey, channel);
        }
    }

    if ("threads" in data && data.threads) {
        for (const thread of data.threads) {
            const threadKey = `${CacheNames.Channel}:${data.id}:${thread.id}`;
            await update(broker, CacheNames.Channel, threadKey, thread);
        }
    }

    if ("presences" in data && data.presences) {
        for (const presence of data.presences) {
            const presenceKey = `${CacheNames.Presence}:${data.id}:${presence.user.id}`;
            await update(broker, CacheNames.Presence, presenceKey, presence);
        }
    }

    if ("stage_instances" in data && data.stage_instances) {
        for (const stage of data.stage_instances) {
            const stageKey = `${CacheNames.Stage}:${data.id}:${stage.id}`;
            await update(broker, CacheNames.Stage, stageKey, stage);
        }
    }

    if ("guild_scheduled_events" in data && data.guild_scheduled_events) {
        for (const event of data.guild_scheduled_events) {
            const eventKey = `${CacheNames.Event}:${data.id}:${event.id}`;
            await update(broker, CacheNames.Event, eventKey, event);
        }
    }

    if ("roles" in data && data.roles) {
        for (const role of data.roles) {
            const roleKey = `${CacheNames.Role}:${data.id}:${role.id}`;
            await update(broker, CacheNames.Role, roleKey, role);
        }
    }

    if ("emojis" in data && data.emojis) {
        for (const emoji of data.emojis) {
            if (!emoji.id) continue;
            const emojiKey = `${CacheNames.Emoji}:${data.id}:${emoji.id}`;
            await update(broker, CacheNames.Emoji, emojiKey, emoji);
        }
    }

    if ("stickers" in data && data.stickers) {
        for (const sticker of data.stickers) {
            const stickerKey = `${CacheNames.Sticker}:${data.id}:${sticker.id}`;
            await update(broker, CacheNames.Sticker, stickerKey, sticker);
        }
    }
}
