import {
    GatewayGuildScheduledEventCreateDispatchData,
    GatewayGuildScheduledEventDeleteDispatchData,
    GatewayGuildScheduledEventUpdateDispatchData
} from "discord-api-types/v10";
import {GatewayBroker} from "../Broker.js";
import {del, set, update} from "../util/redis/index.js";
import {CacheNames} from "../util/validateConfig.js";

const entity = CacheNames.Event;

export async function GuildEventCreate(broker: GatewayBroker, data: string) {
    const parsed = JSON.parse(data) as GatewayGuildScheduledEventCreateDispatchData;
    const key = `${entity}:${parsed.guild_id}:${parsed.id}`;
    await set(broker, entity, key, data);

    await GuildEventCascade(broker, parsed);
}

export async function GuildEventUpdate(broker: GatewayBroker, data: string) {
    const parsed = JSON.parse(data) as GatewayGuildScheduledEventUpdateDispatchData;
    const key = `${entity}:${parsed.guild_id}:${parsed.id}`;
    await update(broker, entity, key, parsed);

    await GuildEventCascade(broker, parsed);
}

export async function GuildEventDelete(broker: GatewayBroker, data: string) {
    const parsed = JSON.parse(data) as GatewayGuildScheduledEventDeleteDispatchData;
    const key = `${entity}:${parsed.guild_id}:${parsed.id}`;
    await del(broker, entity, key);

    await GuildEventCascade(broker, parsed);
}

export async function GuildEventCascade(broker: GatewayBroker, data: GatewayGuildScheduledEventCreateDispatchData | GatewayGuildScheduledEventUpdateDispatchData | GatewayGuildScheduledEventDeleteDispatchData) {
    if ("creator" in data && data.creator) {
        const key = `${CacheNames.User}:${data.creator.id}`;
        await update(broker, CacheNames.User, key, data.creator);
    }
}
