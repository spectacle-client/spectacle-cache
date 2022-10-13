import {GatewayInviteCreateDispatchData} from "discord-api-types/v10";
import {GatewayBroker} from "../Broker.js";
import {del, set, update} from "../util/redis/index.js";
import {CacheNames} from "../util/validateConfig.js";

const entity = CacheNames.Invite;

export async function InviteCreate(broker: GatewayBroker, data: string) {
    const parsed = JSON.parse(data) as GatewayInviteCreateDispatchData;
    const key = `${entity}:${parsed.guild_id}:${parsed.code}`;
    await set(broker, entity, key, data);

    if ("inviter" in parsed && parsed.inviter) {
        const userKey = `${CacheNames.User}:${parsed.inviter.id}`;
        await update(broker, CacheNames.User, userKey, parsed.inviter);
    }

    if ("target_user" in parsed && parsed.target_user) {
        const userKey = `${CacheNames.User}:${parsed.target_user.id}`;
        await update(broker, CacheNames.User, userKey, parsed.target_user);
    }
}

export async function InviteDelete(broker: GatewayBroker, data: string) {
    const parsed = JSON.parse(data) as GatewayInviteCreateDispatchData;
    const key = `${entity}:${parsed.guild_id}:${parsed.code}`;
    await del(broker, key);
}
