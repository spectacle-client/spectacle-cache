import {GatewayIntegrationCreateDispatchData, GatewayIntegrationUpdateDispatchData} from "discord-api-types/v10";
import {GatewayBroker} from "../Broker.js";
import {del, set, update} from "../util/redis/index.js";
import {CacheNames} from "../util/validateConfig.js";

const entity = CacheNames.Integration;

export async function IntegrationCreate(broker: GatewayBroker, data: string) {
    const parsed = JSON.parse(data) as GatewayIntegrationCreateDispatchData;
    const key = `${entity}:${parsed.guild_id}:${parsed.id}`;
    await set(broker, entity, key, data);

    await IntegrationCreateUpdateCascade(broker, parsed);
}

export async function IntegrationUpdate(broker: GatewayBroker, data: string) {
    const parsed = JSON.parse(data) as GatewayIntegrationUpdateDispatchData;
    const key = `${entity}:${parsed.guild_id}:${parsed.id}`;
    await update(broker, entity, key, parsed);

    await IntegrationCreateUpdateCascade(broker, parsed);
}

export async function IntegrationDelete(broker: GatewayBroker, data: string) {
    const parsed = JSON.parse(data) as GatewayIntegrationUpdateDispatchData;
    const key = `${entity}:${parsed.guild_id}:${parsed.id}`;
    await del(broker, key);
}

export async function IntegrationCreateUpdateCascade(broker: GatewayBroker, data: GatewayIntegrationCreateDispatchData | GatewayIntegrationUpdateDispatchData) {
    if ("user" in data && data.user) {
        const userKey = `${CacheNames.User}:${data.user.id}`;
        await update(broker, CacheNames.User, userKey, data.user);
    }
}
