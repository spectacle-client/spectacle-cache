import {GatewayGuildRoleCreateDispatchData} from "discord-api-types/v10";
import {GatewayBroker} from "../Broker.js";
import {update} from "../util/redis/update.js";
import {CacheNames} from "../util/validateConfig.js";

const entity = CacheNames.Role;

export async function GuildRoleCreate(broker: GatewayBroker, data: any) {
    const parsed = JSON.parse(data) as GatewayGuildRoleCreateDispatchData;
    const key = `${entity}:${parsed.guild_id}:${parsed.role.id}`;
    const ttl = broker.entityConfigMap.get(entity)!.ttl;

    if (ttl !== -1) await broker.cache!.set(key, data, "EX", ttl);
    else await broker.cache!.set(key, data);

    console.log(`Cached ${key} (ttl: ${ttl})`);
}

export async function GuildRoleUpdate(broker: GatewayBroker, data: any) {
    const parsed = JSON.parse(data) as GatewayGuildRoleCreateDispatchData;
    const key = `${entity}:${parsed.guild_id}:${parsed.role.id}`;
    const ttl = broker.entityConfigMap.get(entity)!.ttl;

    await update(broker.cache!, key, parsed.role, ttl);

    console.log(`Updated ${key} (ttl: ${ttl})`);
}

export async function GuildRoleDelete(broker: GatewayBroker, data: any) {
    const parsed = JSON.parse(data) as GatewayGuildRoleCreateDispatchData;
    const key = `${entity}:${parsed.guild_id}:${parsed.role.id}`;

    await broker.cache!.del(key);
    console.log(`Deleted ${key}`);
}
