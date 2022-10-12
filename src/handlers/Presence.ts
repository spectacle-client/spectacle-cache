import {GatewayPresenceUpdateDispatchData} from "discord-api-types/v10";
import {GatewayBroker} from "../Broker.js";
import {update} from "../util/redis/update.js";
import {CacheNames} from "../util/validateConfig.js";

const entity = CacheNames.Presence;

export async function PresenceUpdate(broker: GatewayBroker, data: any) {
    const parsed = JSON.parse(data) as GatewayPresenceUpdateDispatchData;
    const key = `${entity}:${parsed.guild_id}:${parsed.user.id}`;
    const ttl = broker.entityConfigMap.get(entity)!.ttl;

    await update(broker.cache!, key, parsed, ttl);

    console.log(`Updated ${key} (ttl: ${ttl})`);

    const userKey = `${CacheNames.User}:${parsed.user.id}`;
    await update(broker.cache!, userKey, parsed.user, broker.entityConfigMap.get(CacheNames.User)!.ttl);
    console.log(`[Cascade] Updated ${userKey} (ttl: ${broker.entityConfigMap.get(CacheNames.User)!.ttl})`);
}
