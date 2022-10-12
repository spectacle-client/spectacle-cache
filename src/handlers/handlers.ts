import {GatewayBroker} from "../Broker.js";
import {GatewayEvents} from "../constants/CacheNameEvents.js";
import {CacheNames} from "../util/validateConfig.js";
import {AutoModRuleCreate, AutoModRuleDelete, AutoModRuleUpdate} from "./AutoModRule.js";
import {ChannelCreate, ChannelDelete, ChannelUpdate} from "./Channel.js";
import {GuildEmojisUpdate} from "./Emoji.js";
import {GuildCreate, GuildDelete, GuildUpdate} from "./Guild.js";
import {MessageCreate, MessageDelete, MessageDeleteBulk, MessageUpdate} from "./Message.js";
import {GuildStickersUpdate} from "./Sticker.js";

export type handler = (broker: GatewayBroker, data: any) => Promise<void>;
export type genericHandler = (entity: CacheNames, keyPath: ([string, string]|[string])[]) => Promise<void>;
export type defaultHandler = (broker: GatewayBroker, event: string, data: any) => Promise<void>;

export const handlers: Partial<Record<GatewayEvents, handler | genericHandler>> & {default: defaultHandler} = {
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
    default: async (_: GatewayBroker, event: string) => {
        console.log(`Received unsupported event from gateway: ${event}`);
    }
}
