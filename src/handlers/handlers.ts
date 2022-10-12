import {GatewayBroker} from "../Broker.js";
import {GatewayEvents} from "../constants/CacheNameEvents.js";
import {AutoModRuleCreate, AutoModRuleDelete, AutoModRuleUpdate} from "./AutoModRule.js";
import {ChannelCreate, ChannelDelete, ChannelUpdate} from "./Channel.js";
import {GuildEmojisUpdate} from "./Emoji.js";
import {GuildEventCreate, GuildEventDelete, GuildEventUpdate} from "./Event.js";
import {GuildCreate, GuildDelete, GuildUpdate} from "./Guild.js";
import {IntegrationCreate, IntegrationDelete, IntegrationUpdate} from "./Integration.js";
import {InviteCreate, InviteDelete} from "./Invite.js";
import {GuildMemberAdd, GuildMemberRemove, GuildMembersChunk, GuildMemberUpdate} from "./Member.js";
import {MessageCreate, MessageDelete, MessageDeleteBulk, MessageUpdate} from "./Message.js";
import {PresenceUpdate} from "./Presence.js";
import {MessageReactionAdd, MessageReactionRemove, MessageReactionRemoveAll, MessageReactionRemoveEmoji} from "./Reaction.js";
import {GuildRoleCreate, GuildRoleDelete, GuildRoleUpdate} from "./Role.js";
import {StageInstanceCreate, StageInstanceDelete, StageInstanceUpdate} from "./Stage.js";
import {GuildStickersUpdate} from "./Sticker.js";
import {VoiceStateUpdate} from "./VoiceState.js";

export type handler = (broker: GatewayBroker, data: any) => Promise<void>;
export type defaultHandler = (broker: GatewayBroker, event: string, data: any) => Promise<void>;

export const handlers: Partial<Record<GatewayEvents, handler>> & {default: defaultHandler} = {
    GUILD_CREATE: GuildCreate,
    GUILD_UPDATE: GuildUpdate,
    GUILD_DELETE: GuildDelete,
    CHANNEL_CREATE: ChannelCreate,
    CHANNEL_UPDATE: ChannelUpdate,
    CHANNEL_DELETE: ChannelDelete,
    MESSAGE_CREATE: MessageCreate,
    MESSAGE_UPDATE: MessageUpdate,
    MESSAGE_DELETE: MessageDelete,
    MESSAGE_DELETE_BULK: MessageDeleteBulk,
    AUTO_MODERATION_RULE_CREATE: AutoModRuleCreate,
    AUTO_MODERATION_RULE_UPDATE: AutoModRuleUpdate,
    AUTO_MODERATION_RULE_DELETE: AutoModRuleDelete,
    GUILD_EMOJIS_UPDATE: GuildEmojisUpdate,
    GUILD_STICKERS_UPDATE: GuildStickersUpdate,
    GUILD_MEMBER_ADD: GuildMemberAdd,
    GUILD_MEMBER_UPDATE: GuildMemberUpdate,
    GUILD_MEMBER_REMOVE: GuildMemberRemove,
    GUILD_MEMBERS_CHUNK: GuildMembersChunk,
    GUILD_ROLE_CREATE: GuildRoleCreate,
    GUILD_ROLE_UPDATE: GuildRoleUpdate,
    GUILD_ROLE_DELETE: GuildRoleDelete,
    GUILD_SCHEDULED_EVENT_CREATE: GuildEventCreate,
    GUILD_SCHEDULED_EVENT_UPDATE: GuildEventUpdate,
    GUILD_SCHEDULED_EVENT_DELETE: GuildEventDelete,
    INTEGRATION_CREATE: IntegrationCreate,
    INTEGRATION_UPDATE: IntegrationUpdate,
    INTEGRATION_DELETE: IntegrationDelete,
    INVITE_CREATE: InviteCreate,
    INVITE_DELETE: InviteDelete,
    MESSAGE_REACTION_ADD: MessageReactionAdd,
    MESSAGE_REACTION_REMOVE: MessageReactionRemove,
    MESSAGE_REACTION_REMOVE_EMOJI: MessageReactionRemoveEmoji,
    MESSAGE_REACTION_REMOVE_ALL: MessageReactionRemoveAll,
    STAGE_INSTANCE_CREATE: StageInstanceCreate,
    STAGE_INSTANCE_UPDATE: StageInstanceUpdate,
    STAGE_INSTANCE_DELETE: StageInstanceDelete,
    VOICE_SERVER_UPDATE: VoiceStateUpdate,
    PRESENCE_UPDATE: PresenceUpdate,
    default: async (_: GatewayBroker, event: string) => {
        console.log(`Received unsupported event from gateway: ${event}`);
    }
}
