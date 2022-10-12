import {GatewayInviteCreateDispatchData} from "discord-api-types/v10";
import {GatewayBroker} from "../Broker.js";
import {update} from "../util/redis/update.js";
import {CacheNames} from "../util/validateConfig.js";

const entity = CacheNames.Invite;

export async function InviteCreate(broker: GatewayBroker, data: any) {
    const parsed = JSON.parse(data) as GatewayInviteCreateDispatchData;
    const key = `${entity}:${parsed.guild_id}:${parsed.code}`;
    const ttl = broker.entityConfigMap.get(entity)!.ttl;

    if (ttl !== -1) await broker.cache!.set(key, data, "EX", ttl);
    else await broker.cache!.set(key, data);

    console.log(`Cached ${key} (ttl: ${ttl})`);

    if ("inviter" in parsed && parsed.inviter) {
        const userKey = `${CacheNames.User}:${parsed.inviter.id}`;
        await update(broker.cache!, userKey, parsed.inviter, broker.entityConfigMap.get(CacheNames.User)!.ttl);
        console.log(`[Cascade] Updated ${userKey} (ttl: ${broker.entityConfigMap.get(CacheNames.User)!.ttl})`);
    }

    if ("target_user" in parsed && parsed.target_user) {
        const userKey = `${CacheNames.User}:${parsed.target_user.id}`;
        await update(broker.cache!, userKey, parsed.target_user, broker.entityConfigMap.get(CacheNames.User)!.ttl);
        console.log(`[Cascade] Updated ${userKey} (ttl: ${broker.entityConfigMap.get(CacheNames.User)!.ttl})`);
    }
}

export async function InviteDelete(broker: GatewayBroker, data: any) {
    const parsed = JSON.parse(data) as GatewayInviteCreateDispatchData;
    const key = `${entity}:${parsed.guild_id}:${parsed.code}`;

    await broker.cache!.del(key);
    console.log(`Deleted ${key}`);
}
