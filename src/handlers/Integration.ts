import {GatewayIntegrationCreateDispatchData, GatewayIntegrationUpdateDispatchData} from "discord-api-types/v10";
import { CacheNames } from "util/validateConfig";
import {GatewayBroker} from "../Broker.js";
import {update} from "../util/redis/update.js";

const entity = CacheNames.Integration;

export async function IntegrationCreate(broker: GatewayBroker, data: any) {
    const parsed = JSON.parse(data) as GatewayIntegrationCreateDispatchData;
    const key = `${entity}:${parsed.guild_id}:${parsed.id}`;
    const ttl = broker.entityConfigMap.get(entity)!.ttl;

    if (ttl !== -1) await broker.cache!.set(key, data, "EX", ttl);
    else await broker.cache!.set(key, data);

    console.log(`Cached ${key} (ttl: ${ttl})`);

    await IntegrationCreateUpdateCascade(broker, parsed);
}

export async function IntegrationUpdate(broker: GatewayBroker, data: any) {
    const parsed = JSON.parse(data) as GatewayIntegrationUpdateDispatchData;
    const key = `${entity}:${parsed.guild_id}:${parsed.id}`;
    const ttl = broker.entityConfigMap.get(entity)!.ttl;

    await update(broker.cache!, key, parsed, ttl);

    console.log(`Updated ${key} (ttl: ${ttl})`);

    await IntegrationCreateUpdateCascade(broker, parsed);
}

export async function IntegrationDelete(broker: GatewayBroker, data: any) {
    const parsed = JSON.parse(data) as GatewayIntegrationUpdateDispatchData;
    const key = `${entity}:${parsed.guild_id}:${parsed.id}`;

    await broker.cache!.del(key);
    console.log(`Deleted ${key}`);
}

export async function IntegrationCreateUpdateCascade(broker: GatewayBroker, data: GatewayIntegrationCreateDispatchData | GatewayIntegrationUpdateDispatchData) {
    if ("user" in data && data.user) {
        const userKey = `${CacheNames.User}:${data.user.id}`;
        await update(broker.cache!, userKey, data.user, broker.entityConfigMap.get(CacheNames.User)!.ttl);
        console.log(`[Cascade] Updated ${userKey} (ttl: ${broker.entityConfigMap.get(CacheNames.User)!.ttl})`);
    }
}
