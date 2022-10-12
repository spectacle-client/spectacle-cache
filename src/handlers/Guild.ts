import {GatewayGuildCreateDispatchData, GatewayGuildUpdateDispatchData, GatewayGuildDeleteDispatchData} from "discord-api-types/v10";
import {GatewayBroker} from "../Broker.js";
import {update} from "../util/redis/update.js";
import {CacheNames} from "../util/validateConfig.js";

const entity = CacheNames.Guild;

export async function GuildCreate(broker: GatewayBroker, data: any) {
    const parsed = JSON.parse(data) as GatewayGuildCreateDispatchData;
    const key = `${entity}:${parsed.id}`;
    const ttl = broker.entityConfigMap.get(entity)!.ttl;

    if (ttl !== -1) await broker.cache!.set(key, data, "EX", ttl);
    else await broker.cache!.set(key, data);

    console.log(`Cached ${key} (ttl: ${ttl})`);

    await GuildCreateUpdateCascade(broker, parsed);
}

export async function GuildUpdate(broker: GatewayBroker, data: any) {
    const parsed = JSON.parse(data) as GatewayGuildUpdateDispatchData;
    const key = `${entity}:${parsed.id}`;
    const ttl = broker.entityConfigMap.get(entity)!.ttl;

    await update(broker.cache!, key, parsed, ttl);

    console.log(`Updated ${key} (ttl: ${ttl})`);

    await GuildCreateUpdateCascade(broker, parsed);
}

export async function GuildDelete(broker: GatewayBroker, data: any) {
    const parsed = JSON.parse(data) as GatewayGuildDeleteDispatchData;
    const key = `${entity}:${parsed.id}`;

    await broker.cache!.del(key);
    console.log(`Deleted ${key}`);

    const channelKeys = await broker.cache!.keys(`${CacheNames.Channel}:${parsed.id}:*`);
    for (const channelKey of channelKeys) {
        const channelId = channelKey.split(":")[2];
        const messageKeys = await broker.cache!.keys(`${CacheNames.Message}:${parsed.id}:${channelId}:*`);

        for (const messageKey of messageKeys) {
            const messageId = messageKey.split(":")[3];
            const reactionKeys = await broker.cache!.keys(`${CacheNames.Reaction}:${parsed.id}:${channelId}:${messageId}:*`);

            if (reactionKeys.length > 0) {
                await broker.cache!.del(reactionKeys);
                console.log(`[Cascade] Deleted ${reactionKeys.length} messages from ${messageKey}`);
            }
        }

        if (messageKeys.length > 0) {
            await broker.cache!.del(messageKeys);
            console.log(`[Cascade] Deleted ${messageKeys.length} messages from ${channelKey}`);
        }

        const voiceStateKeys = await broker.cache!.keys(`${CacheNames.VoiceState}:${parsed.id}:${channelId}:*`);
        if (voiceStateKeys.length > 0) {
            await broker.cache!.del(voiceStateKeys);
            console.log(`[Cascade] Deleted ${voiceStateKeys.length} voice states from ${channelKey}`);
        }
    }

    if (channelKeys.length > 0) {
        await broker.cache!.del(channelKeys);
        console.log(`[Cascade] Deleted ${channelKeys.length} channels from ${key}`);
    }

    const autoModRuleKeys = await broker.cache!.keys(`${CacheNames.AutoModRule}:${parsed.id}:*`);
    if (autoModRuleKeys.length > 0) {
        await broker.cache!.del(autoModRuleKeys);
        console.log(`[Cascade] Deleted ${autoModRuleKeys.length} automod rules from ${key}`);
    }

    const emojiKeys = await broker.cache!.keys(`${CacheNames.Emoji}:${parsed.id}:*`);
    if (emojiKeys.length > 0) {
        await broker.cache!.del(emojiKeys);
        console.log(`[Cascade] Deleted ${emojiKeys.length} emojis from ${key}`);
    }

    const stickerKeys = await broker.cache!.keys(`${CacheNames.Sticker}:${parsed.id}:*`);
    if (stickerKeys.length > 0) {
        await broker.cache!.del(stickerKeys);
        console.log(`[Cascade] Deleted ${stickerKeys.length} stickers from ${key}`);
    }

    const memberKeys = await broker.cache!.keys(`${CacheNames.Member}:${parsed.id}:*`);
    if (memberKeys.length > 0) {
        await broker.cache!.del(memberKeys);
        console.log(`[Cascade] Deleted ${memberKeys.length} members from ${key}`);
    }

    const roleKeys = await broker.cache!.keys(`${CacheNames.Role}:${parsed.id}:*`);
    if (roleKeys.length > 0) {
        await broker.cache!.del(roleKeys);
        console.log(`[Cascade] Deleted ${roleKeys.length} roles from ${key}`);
    }

    const eventKeys = await broker.cache!.keys(`${CacheNames.Event}:${parsed.id}:*`);
    if (eventKeys.length > 0) {
        await broker.cache!.del(eventKeys);
        console.log(`[Cascade] Deleted ${eventKeys.length} events from ${key}`);
    }

    const integrationKeys = await broker.cache!.keys(`${CacheNames.Integration}:${parsed.id}:*`);
    if (integrationKeys.length > 0) {
        await broker.cache!.del(integrationKeys);
        console.log(`[Cascade] Deleted ${integrationKeys.length} integrations from ${key}`);
    }

    const inviteKeys = await broker.cache!.keys(`${CacheNames.Invite}:${parsed.id}:*`);
    if (inviteKeys.length > 0) {
        await broker.cache!.del(inviteKeys);
        console.log(`[Cascade] Deleted ${inviteKeys.length} invites from ${key}`);
    }

    const stageKeys = await broker.cache!.keys(`${CacheNames.Stage}:${parsed.id}:*`);
    if (stageKeys.length > 0) {
        await broker.cache!.del(stageKeys);
        console.log(`[Cascade] Deleted ${stageKeys.length} stage instances from ${key}`);
    }

    const presenceKeys = await broker.cache!.keys(`${CacheNames.Presence}:${parsed.id}:*`);
    if (presenceKeys.length > 0) {
        await broker.cache!.del(presenceKeys);
        console.log(`[Cascade] Deleted ${presenceKeys.length} presences from ${key}`);
    }
}

export async function GuildCreateUpdateCascade(broker: GatewayBroker, data: GatewayGuildCreateDispatchData | GatewayGuildUpdateDispatchData) {
    if ("voice_states" in data && data.voice_states) {
        for (const voiceState of data.voice_states) {
            if (!voiceState.channel_id) continue;
            const voiceStateKey = `${CacheNames.VoiceState}:${data.id}:${voiceState.channel_id}:${voiceState.user_id}`;
            await update(broker.cache!, voiceStateKey, voiceState, broker.entityConfigMap.get(CacheNames.VoiceState)!.ttl);
            console.log(`[Cascade] Updated ${voiceStateKey} (ttl: ${broker.entityConfigMap.get(CacheNames.VoiceState)!.ttl})`);
        }
    }

    if ("members" in data && data.members) {
        for (const member of data.members) {
            const memberKey = `${CacheNames.Member}:${data.id}:${member.user!.id}`;
            await update(broker.cache!, memberKey, member, broker.entityConfigMap.get(CacheNames.Member)!.ttl);
            console.log(`[Cascade] Updated ${memberKey} (ttl: ${broker.entityConfigMap.get(CacheNames.Member)!.ttl})`);
        }
    }

    if ("channels" in data && data.channels) {
        for (const channel of data.channels) {
            const channelKey = `${CacheNames.Channel}:${data.id}:${channel.id}`;
            await update(broker.cache!, channelKey, channel, broker.entityConfigMap.get(CacheNames.Channel)!.ttl);
            console.log(`[Cascade] Updated ${channelKey} (ttl: ${broker.entityConfigMap.get(CacheNames.Channel)!.ttl})`);
        }
    }

    if ("threads" in data && data.threads) {
        for (const thread of data.threads) {
            const threadKey = `${CacheNames.Channel}:${data.id}:${thread.id}`;
            await update(broker.cache!, threadKey, thread, broker.entityConfigMap.get(CacheNames.Channel)!.ttl);
            console.log(`[Cascade] Updated ${threadKey} (ttl: ${broker.entityConfigMap.get(CacheNames.Channel)!.ttl})`);
        }
    }

    if ("presences" in data && data.presences) {
        for (const presence of data.presences) {
            const presenceKey = `${CacheNames.Presence}:${data.id}:${presence.user!.id}`;
            await update(broker.cache!, presenceKey, presence, broker.entityConfigMap.get(CacheNames.Presence)!.ttl);
            console.log(`[Cascade] Updated ${presenceKey} (ttl: ${broker.entityConfigMap.get(CacheNames.Presence)!.ttl})`);
        }
    }

    if ("stage_instances" in data && data.stage_instances) {
        for (const stage of data.stage_instances) {
            const stageKey = `${CacheNames.Stage}:${data.id}:${stage.id}`;
            await update(broker.cache!, stageKey, stage, broker.entityConfigMap.get(CacheNames.Stage)!.ttl);
            console.log(`[Cascade] Updated ${stageKey} (ttl: ${broker.entityConfigMap.get(CacheNames.Stage)!.ttl})`);
        }
    }

    if ("guild_scheduled_events" in data && data.guild_scheduled_events) {
        for (const event of data.guild_scheduled_events) {
            const eventKey = `${CacheNames.Event}:${data.id}:${event.id}`;
            await update(broker.cache!, eventKey, event, broker.entityConfigMap.get(CacheNames.Event)!.ttl);
            console.log(`[Cascade] Updated ${eventKey} (ttl: ${broker.entityConfigMap.get(CacheNames.Event)!.ttl})`);
        }
    }

    if ("roles" in data && data.roles) {
        for (const role of data.roles) {
            const roleKey = `${CacheNames.Role}:${data.id}:${role.id}`;
            await update(broker.cache!, roleKey, role, broker.entityConfigMap.get(CacheNames.Role)!.ttl);
            console.log(`[Cascade] Updated ${roleKey} (ttl: ${broker.entityConfigMap.get(CacheNames.Role)!.ttl})`);
        }
    }

    if ("emojis" in data && data.emojis) {
        for (const emoji of data.emojis) {
            if (!emoji.id) continue;
            const emojiKey = `${CacheNames.Emoji}:${data.id}:${emoji.id}`;
            await update(broker.cache!, emojiKey, emoji, broker.entityConfigMap.get(CacheNames.Emoji)!.ttl);
            console.log(`[Cascade] Updated ${emojiKey} (ttl: ${broker.entityConfigMap.get(CacheNames.Emoji)!.ttl})`);
        }
    }

    if ("stickers" in data && data.stickers) {
        for (const sticker of data.stickers) {
            const stickerKey = `${CacheNames.Sticker}:${data.id}:${sticker.id}`;
            await update(broker.cache!, stickerKey, sticker, broker.entityConfigMap.get(CacheNames.Sticker)!.ttl);
            console.log(`[Cascade] Updated ${stickerKey} (ttl: ${broker.entityConfigMap.get(CacheNames.Sticker)!.ttl})`);
        }
    }
}
