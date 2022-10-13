import {GatewayPresenceUpdateDispatchData} from "discord-api-types/v10";
import {GatewayBroker} from "../Broker.js";
import {update} from "../util/redis/index.js";
import {CacheNames} from "../util/validateConfig.js";

const entity = CacheNames.Presence;

export async function PresenceUpdate(broker: GatewayBroker, data: string) {
    const parsed = JSON.parse(data) as GatewayPresenceUpdateDispatchData;
    const key = `${entity}:${parsed.guild_id}:${parsed.user.id}`;
    await update(broker, entity, key, parsed);

    const userKey = `${CacheNames.User}:${parsed.user.id}`;
    await update(broker, CacheNames.User, userKey, parsed.user);
}
