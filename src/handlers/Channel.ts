import {
    GatewayChannelCreateDispatchData,
    GatewayChannelDeleteDispatchData,
    GatewayChannelUpdateDispatchData
} from "discord-api-types/v10";
import {GatewayThreadListSyncDispatchData} from "discord-api-types/v10.js";
import {GatewayBroker} from "../Broker.js";
import {scanKeys} from "../util/redis/scanKeys.js";
import {update} from "../util/redis/update.js";
import {CacheNames} from "../util/validateConfig.js";

const entity = CacheNames.Channel;

export async function ChannelCreate(broker: GatewayBroker, data: any) {
    const parsed = JSON.parse(data) as GatewayChannelCreateDispatchData & {guild_id?: string};
    const key = `${entity}:${parsed.guild_id ?? "dm"}:${parsed.id}`;
    const ttl = broker.entityConfigMap.get(entity)!.ttl;

    if (ttl !== -1) await broker.cache!.set(key, data, "EX", ttl);
    else await broker.cache!.set(key, data);

    console.log(`Cached ${key} (ttl: ${ttl})`);

    await ChannelCreateUpdateCascade(broker, parsed);
}

export async function ChannelUpdate(broker: GatewayBroker, data: any) {
    const parsed = JSON.parse(data) as GatewayChannelUpdateDispatchData & {guild_id?: string};
    const key = `${entity}:${parsed.guild_id ?? "dm"}:${parsed.id}`;
    const ttl = broker.entityConfigMap.get(entity)!.ttl;

    await update(broker.cache!, key, parsed, ttl);

    console.log(`Updated ${key} (ttl: ${ttl})`);

    await ChannelCreateUpdateCascade(broker, parsed);
}

export async function ChannelDelete(broker: GatewayBroker, data: any) {
    const parsed = JSON.parse(data) as GatewayChannelDeleteDispatchData & {guild_id?: string};
    const key = `${entity}:${parsed.guild_id ?? "dm"}:${parsed.id}`;

    await broker.cache!.del(key);
    console.log(`Deleted ${key}`);

    const messageKeys = await scanKeys(broker, `${CacheNames.Message}:${parsed.guild_id ?? "dm"}:${parsed.id}:*`);

    for (const messageKey of messageKeys) {
        const messageId = messageKey.split(":")[3];
        const reactionKeys = await broker.cache!.keys(`${CacheNames.Reaction}:${parsed.guild_id ?? "dm"}:${parsed.id}:${messageId}:*`);

        if (reactionKeys.length > 0) {
            await broker.cache!.del(reactionKeys);
            console.log(`[Cascade] Deleted ${reactionKeys.length} messages from ${messageKey}`);
        }
    }

    if (messageKeys.length > 0) {
        await broker.cache!.del(messageKeys);
        console.log(`[Cascade] Deleted ${messageKeys.length} messages from ${key}`);
    }
}

export async function ThreadListSync(broker: GatewayBroker, data: any) {
    const parsed = JSON.parse(data) as GatewayThreadListSyncDispatchData;

    for (const thread of parsed.threads) {
        const channelKey = `${entity}:${parsed.guild_id}:${thread.id}`;
        await update(broker.cache!, channelKey, thread, broker.entityConfigMap.get(entity)!.ttl);
        console.log(`Updated ${channelKey} (ttl: ${broker.entityConfigMap.get(entity)!.ttl})`);
    }
}


export async function ChannelCreateUpdateCascade(broker: GatewayBroker, data: GatewayChannelCreateDispatchData | GatewayChannelUpdateDispatchData) {
    if ("recipients" in data && data.recipients) {
        for (const recipient of data.recipients) {
            const userKey = `${CacheNames.User}:${recipient.id}`;
            await update(broker.cache!, userKey, recipient, broker.entityConfigMap.get(CacheNames.User)!.ttl);
            console.log(`[Cascade] Cached ${CacheNames.User}:${recipient.id} (ttl: ${broker.entityConfigMap.get(CacheNames.User)!.ttl})`);
        }
    }
}
