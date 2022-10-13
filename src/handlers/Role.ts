import {GatewayGuildRoleCreateDispatchData} from "discord-api-types/v10";
import {GatewayBroker} from "../Broker.js";
import {del, set, update} from "../util/redis/index.js";
import {CacheNames} from "../util/validateConfig.js";

const entity = CacheNames.Role;

export async function GuildRoleCreate(broker: GatewayBroker, data: string) {
    const parsed = JSON.parse(data) as GatewayGuildRoleCreateDispatchData;
    const key = `${entity}:${parsed.guild_id}:${parsed.role.id}`;
    await set(broker, entity, key, data);
}

export async function GuildRoleUpdate(broker: GatewayBroker, data: string) {
    const parsed = JSON.parse(data) as GatewayGuildRoleCreateDispatchData;
    const key = `${entity}:${parsed.guild_id}:${parsed.role.id}`;
    await update(broker, entity, key, parsed.role);
}

export async function GuildRoleDelete(broker: GatewayBroker, data: string) {
    const parsed = JSON.parse(data) as GatewayGuildRoleCreateDispatchData;
    const key = `${entity}:${parsed.guild_id}:${parsed.role.id}`;
    await del(broker, entity, key);
}
