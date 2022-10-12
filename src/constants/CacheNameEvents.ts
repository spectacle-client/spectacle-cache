import {GatewayDispatchEvents} from "discord-api-types/v10";
import {CacheNames} from "../util/validateConfig.js";

export enum MissingGatewayDispatchEvents {
    AutoModerationRuleCreate = "AUTO_MODERATION_RULE_CREATE",
    AutoModerationRuleUpdate = "AUTO_MODERATION_RULE_UPDATE",
    AutoModerationRuleDelete = "AUTO_MODERATION_RULE_DELETE",
}

export type GatewayEvents = GatewayDispatchEvents | MissingGatewayDispatchEvents;

export const CacheNameEvents = new Map<CacheNames, GatewayEvents[]>([
    [CacheNames.AutoModRule, [
        MissingGatewayDispatchEvents.AutoModerationRuleCreate,
        MissingGatewayDispatchEvents.AutoModerationRuleUpdate,
        MissingGatewayDispatchEvents.AutoModerationRuleDelete,
        GatewayDispatchEvents.GuildDelete,
    ]],
    [CacheNames.Channel, [
        GatewayDispatchEvents.ChannelCreate,
        GatewayDispatchEvents.ChannelUpdate,
        GatewayDispatchEvents.ChannelDelete,
        GatewayDispatchEvents.GuildDelete,
    ]],
    [CacheNames.Guild, [
        GatewayDispatchEvents.GuildCreate,
        GatewayDispatchEvents.GuildUpdate,
        GatewayDispatchEvents.GuildDelete,
    ]],
    [CacheNames.Emoji, [
        GatewayDispatchEvents.GuildEmojisUpdate,
        GatewayDispatchEvents.GuildCreate,
        GatewayDispatchEvents.GuildUpdate,
        GatewayDispatchEvents.GuildDelete,
    ]],
    [CacheNames.Sticker, [
        GatewayDispatchEvents.GuildStickersUpdate,
        GatewayDispatchEvents.GuildCreate,
        GatewayDispatchEvents.GuildUpdate,
        GatewayDispatchEvents.GuildDelete,
    ]],
    [CacheNames.Member, [
        GatewayDispatchEvents.GuildMemberAdd,
        GatewayDispatchEvents.GuildMemberUpdate,
        GatewayDispatchEvents.GuildMemberRemove,
        GatewayDispatchEvents.GuildMembersChunk,
        GatewayDispatchEvents.GuildCreate,
        GatewayDispatchEvents.MessageReactionAdd,
        GatewayDispatchEvents.TypingStart,
        GatewayDispatchEvents.VoiceStateUpdate,
        GatewayDispatchEvents.GuildDelete,
    ]],
    [CacheNames.Role, [
        GatewayDispatchEvents.GuildRoleCreate,
        GatewayDispatchEvents.GuildRoleUpdate,
        GatewayDispatchEvents.GuildRoleDelete,
        GatewayDispatchEvents.GuildCreate,
        GatewayDispatchEvents.GuildUpdate,
        GatewayDispatchEvents.GuildDelete,
    ]],
    [CacheNames.Event, [
        GatewayDispatchEvents.GuildScheduledEventCreate,
        GatewayDispatchEvents.GuildScheduledEventUpdate,
        GatewayDispatchEvents.GuildScheduledEventDelete,
        GatewayDispatchEvents.GuildDelete,
    ]],
    [CacheNames.Integration, [
        GatewayDispatchEvents.IntegrationCreate,
        GatewayDispatchEvents.IntegrationUpdate,
        GatewayDispatchEvents.IntegrationDelete,
        GatewayDispatchEvents.GuildDelete,
    ]],
    [CacheNames.Invite, [
        GatewayDispatchEvents.InviteCreate,
        GatewayDispatchEvents.InviteDelete,
        GatewayDispatchEvents.GuildDelete,
        GatewayDispatchEvents.ChannelDelete,
    ]],
    [CacheNames.Message, [
        GatewayDispatchEvents.MessageCreate,
        GatewayDispatchEvents.MessageUpdate,
        GatewayDispatchEvents.MessageDelete,
        GatewayDispatchEvents.MessageDeleteBulk,
        GatewayDispatchEvents.GuildDelete,
        GatewayDispatchEvents.ChannelDelete,
    ]],
    [CacheNames.Reaction, [
        GatewayDispatchEvents.MessageReactionAdd,
        GatewayDispatchEvents.MessageReactionRemove,
        GatewayDispatchEvents.MessageReactionRemoveAll,
        GatewayDispatchEvents.MessageReactionRemoveEmoji,
        GatewayDispatchEvents.GuildDelete,
        GatewayDispatchEvents.ChannelDelete,
    ]],
    [CacheNames.Stage, [
        GatewayDispatchEvents.StageInstanceCreate,
        GatewayDispatchEvents.StageInstanceUpdate,
        GatewayDispatchEvents.StageInstanceDelete,
        GatewayDispatchEvents.GuildDelete,
        GatewayDispatchEvents.ChannelDelete,
    ]],
    [CacheNames.VoiceState, [
        GatewayDispatchEvents.VoiceStateUpdate,
        GatewayDispatchEvents.GuildDelete,
        GatewayDispatchEvents.ChannelDelete,
    ]],
    [CacheNames.Presence, [
        GatewayDispatchEvents.PresenceUpdate,
        GatewayDispatchEvents.GuildDelete,
    ]],
    [CacheNames.User, [
        GatewayDispatchEvents.Ready,
        GatewayDispatchEvents.ThreadListSync,
        GatewayDispatchEvents.ThreadMembersUpdate,
        GatewayDispatchEvents.GuildCreate,
        GatewayDispatchEvents.GuildBanAdd,
        GatewayDispatchEvents.GuildBanRemove,
        GatewayDispatchEvents.GuildMemberAdd,
        GatewayDispatchEvents.GuildMemberRemove,
        GatewayDispatchEvents.GuildMemberUpdate,
        GatewayDispatchEvents.GuildMembersChunk,
        GatewayDispatchEvents.GuildScheduledEventCreate,
        GatewayDispatchEvents.GuildScheduledEventUpdate,
        GatewayDispatchEvents.GuildScheduledEventDelete,
        GatewayDispatchEvents.InviteCreate,
        GatewayDispatchEvents.MessageCreate,
        GatewayDispatchEvents.MessageUpdate,
        GatewayDispatchEvents.MessageReactionAdd,
        GatewayDispatchEvents.PresenceUpdate,
        GatewayDispatchEvents.TypingStart,
        GatewayDispatchEvents.UserUpdate,
        GatewayDispatchEvents.VoiceStateUpdate,
    ]],
]);
