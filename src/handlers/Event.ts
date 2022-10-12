import {
    GatewayGuildScheduledEventCreateDispatchData,
    GatewayGuildScheduledEventDeleteDispatchData,
    GatewayGuildScheduledEventUpdateDispatchData
} from "discord-api-types/v10";
import {GatewayBroker} from "../Broker.js";
import {update} from "../util/redis/update.js";
import {CacheNames} from "../util/validateConfig.js";

const entity = CacheNames.Event;

export async function GuildEventCreate(broker: GatewayBroker, data: any) {
    const parsed = JSON.parse(data) as GatewayGuildScheduledEventCreateDispatchData;
    const key = `${entity}:${parsed.guild_id}:${parsed.id}`;
    const ttl = broker.entityConfigMap.get(entity)!.ttl;

    if (ttl !== -1) await broker.cache!.set(key, data, "EX", ttl);
    else await broker.cache!.set(key, data);

    console.log(`Cached ${key} (ttl: ${ttl})`);

    await GuildEventCreateUpdateCascade(broker, parsed);
}

export async function GuildEventUpdate(broker: GatewayBroker, data: any) {
    const parsed = JSON.parse(data) as GatewayGuildScheduledEventUpdateDispatchData;
    const key = `${entity}:${parsed.guild_id}:${parsed.id}`;
    const ttl = broker.entityConfigMap.get(entity)!.ttl;

    await update(broker.cache!, key, parsed, ttl);

    console.log(`Updated ${key} (ttl: ${ttl})`);

    await GuildEventCreateUpdateCascade(broker, parsed);
}

export async function GuildEventDelete(broker: GatewayBroker, data: any) {
    const parsed = JSON.parse(data) as GatewayGuildScheduledEventDeleteDispatchData;
    const key = `${entity}:${parsed.guild_id}:${parsed.id}`;

    await broker.cache!.del(key);
    console.log(`Deleted ${key}`);
}

export async function GuildEventCreateUpdateCascade(broker: GatewayBroker, data: GatewayGuildScheduledEventCreateDispatchData | GatewayGuildScheduledEventUpdateDispatchData) {
    if ("creator" in data && data.creator) {
        const key = `${CacheNames.User}:${data.creator.id}`;
        await update(broker.cache!, key, data.creator, broker.entityConfigMap.get(CacheNames.User)!.ttl);
        console.log(`[Cascade] Updated ${key} (ttl: ${broker.entityConfigMap.get(CacheNames.User)!.ttl})`);
    }
}
