import {
    GatewayChannelCreateDispatchData,
    GatewayChannelDeleteDispatchData,
    GatewayChannelUpdateDispatchData,
    GatewayThreadListSyncDispatchData
} from "discord-api-types/v10";
import {GatewayBroker} from "../Broker.js";
import {del, scanKeys, set, update} from "../util/redis/index.js";
import {CacheNames} from "../util/validateConfig.js";

const entity = CacheNames.Channel;

export async function ChannelCreate(broker: GatewayBroker, data: string) {
    const parsed = JSON.parse(data) as GatewayChannelCreateDispatchData & {guild_id?: string};
    const key = `${entity}:${parsed.guild_id ?? "dm"}:${parsed.id}`;
    await set(broker, entity, key, data);

    await ChannelCreateUpdateCascade(broker, parsed);
}

export async function ChannelUpdate(broker: GatewayBroker, data: string) {
    const parsed = JSON.parse(data) as GatewayChannelUpdateDispatchData & {guild_id?: string};
    const key = `${entity}:${parsed.guild_id ?? "dm"}:${parsed.id}`;
    await update(broker, entity, key, parsed);

    await ChannelCreateUpdateCascade(broker, parsed);
}

export async function ChannelDelete(broker: GatewayBroker, data: string) {
    const parsed = JSON.parse(data) as GatewayChannelDeleteDispatchData & {guild_id?: string};
    const key = `${entity}:${parsed.guild_id ?? "dm"}:${parsed.id}`;
    await del(broker, entity, key);

    const messageKeys = await scanKeys(broker, `${CacheNames.Message}:${parsed.guild_id ?? "dm"}:${parsed.id}:*`);

    for (const messageKey of messageKeys) {
        const reactionKeys = await scanKeys(broker, `${CacheNames.Reaction}:${parsed.guild_id ?? "dm"}:${parsed.id}:${messageKey.split(":")[3]}:*`);

        if (reactionKeys.length > 0)
            await del(broker, CacheNames.Reaction, reactionKeys, {cascade: true, originKey: messageKey});
    }

    if (messageKeys.length > 0)
        await del(broker, CacheNames.Message, messageKeys, {cascade: true, originKey: key});
}

export async function ThreadListSync(broker: GatewayBroker, data: any) {
    const parsed = JSON.parse(data) as GatewayThreadListSyncDispatchData;

    for (const thread of parsed.threads) {
        await ChannelCreateUpdateCascade(broker, thread);

        const channelKey = `${entity}:${parsed.guild_id}:${thread.id}`;
        await update(broker, entity, channelKey, thread);
    }
}

export async function ChannelCreateUpdateCascade(broker: GatewayBroker, data: GatewayChannelCreateDispatchData | GatewayChannelUpdateDispatchData) {
    if ("recipients" in data && data.recipients) {
        for (const recipient of data.recipients) {
            const userKey = `${CacheNames.User}:${recipient.id}`;
            await update(broker, CacheNames.User, userKey,recipient, true);
        }
    }
}
