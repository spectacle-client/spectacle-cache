import {
    GatewayGuildCreateDispatchData,
    GatewayGuildDeleteDispatchData,
    GatewayGuildUpdateDispatchData
} from "discord-api-types/v10";
import {GatewayBroker} from "../Broker.js";
import {del, scanKeys, set, update} from "../util/redis/index.js";
import {CacheNames} from "../util/validateConfig.js";

const entity = CacheNames.Guild;

export async function GuildCreate(broker: GatewayBroker, data: string) {
    const parsed = JSON.parse(data) as GatewayGuildCreateDispatchData;
    const key = `${entity}:${parsed.id}`;
    await set(broker, entity, key, data);

    await GuildCascade(broker, parsed);
}

export async function GuildUpdate(broker: GatewayBroker, data: string) {
    const parsed = JSON.parse(data) as GatewayGuildUpdateDispatchData;
    const key = `${entity}:${parsed.id}`;
    await update(broker, entity, key, parsed);

    await GuildCascade(broker, parsed);
}

export async function GuildDelete(broker: GatewayBroker, data: string) {
    const parsed = JSON.parse(data) as GatewayGuildDeleteDispatchData;
    const key = `${entity}:${parsed.id}`;
    await del(broker, entity, key);

    const channelKeys = await scanKeys(broker, `${CacheNames.Channel}:${parsed.id}:*`);
    for (const channelKey of channelKeys) {
        const channelId = channelKey.split(":")[2];
        const messageKeys = await scanKeys(broker, `${CacheNames.Message}:${parsed.id}:${channelId}:*`);

        for (const messageKey of messageKeys) {
            const reactionKeys = await scanKeys(broker, `${CacheNames.Reaction}:${parsed.id}:${channelId}:${messageKey.split(":")[3]}:*`);

            if (reactionKeys.length > 0)
                await del(broker, CacheNames.Reaction, reactionKeys, {cascade: true, originKey: messageKey});
        }

        if (messageKeys.length > 0)
            await del(broker, CacheNames.Message, messageKeys, {cascade: true, originKey: channelKey});

        const voiceStateKeys = await scanKeys(broker, `${CacheNames.VoiceState}:${parsed.id}:${channelId}:*`);
        if (voiceStateKeys.length > 0)
            await del(broker, CacheNames.VoiceState, voiceStateKeys, {cascade: true, originKey: channelKey});
    }

    if (channelKeys.length > 0)
        await del(broker, CacheNames.Channel, channelKeys, {cascade: true, originKey: key});

    const autoModRuleKeys = await scanKeys(broker, `${CacheNames.AutoModRule}:${parsed.id}:*`);
    if (autoModRuleKeys.length > 0)
        await del(broker, CacheNames.AutoModRule, autoModRuleKeys, {cascade: true, originKey: key});

    const emojiKeys = await scanKeys(broker, `${CacheNames.Emoji}:${parsed.id}:*`);
    if (emojiKeys.length > 0)
        await del(broker, CacheNames.Emoji, emojiKeys, {cascade: true, originKey: key});

    const stickerKeys = await scanKeys(broker, `${CacheNames.Sticker}:${parsed.id}:*`);
    if (stickerKeys.length > 0)
        await del(broker, CacheNames.Sticker, stickerKeys, {cascade: true, originKey: key});

    const memberKeys = await scanKeys(broker, `${CacheNames.Member}:${parsed.id}:*`);
    if (memberKeys.length > 0)
        await del(broker, CacheNames.Member, memberKeys, {cascade: true, originKey: key});

    const roleKeys = await scanKeys(broker, `${CacheNames.Role}:${parsed.id}:*`);
    if (roleKeys.length > 0)
        await del(broker, CacheNames.Role, roleKeys, {cascade: true, originKey: key});

    const eventKeys = await scanKeys(broker, `${CacheNames.Event}:${parsed.id}:*`);
    if (eventKeys.length > 0)
        await del(broker, CacheNames.Event, eventKeys, {cascade: true, originKey: key});

    const integrationKeys = await scanKeys(broker, `${CacheNames.Integration}:${parsed.id}:*`);
    if (integrationKeys.length > 0)
        await del(broker, CacheNames.Integration, integrationKeys, {cascade: true, originKey: key});

    const inviteKeys = await scanKeys(broker, `${CacheNames.Invite}:${parsed.id}:*`);
    if (inviteKeys.length > 0)
        await del(broker, CacheNames.Invite, inviteKeys, {cascade: true, originKey: key});

    const stageKeys = await scanKeys(broker, `${CacheNames.Stage}:${parsed.id}:*`);
    if (stageKeys.length > 0)
        await del(broker, CacheNames.Stage, stageKeys, {cascade: true, originKey: key});

    const presenceKeys = await scanKeys(broker, `${CacheNames.Presence}:${parsed.id}:*`);
    if (presenceKeys.length > 0)
        await del(broker, CacheNames.Presence, presenceKeys, {cascade: true, originKey: key});
}

export async function GuildCascade(broker: GatewayBroker, data: GatewayGuildCreateDispatchData | GatewayGuildUpdateDispatchData) {
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
