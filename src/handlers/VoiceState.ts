import {GatewayVoiceStateUpdateDispatchData} from "discord-api-types/v10";
import { CacheNames } from "../util/validateConfig.js";
import {GatewayBroker} from "../Broker.js";
import {update} from "../util/redis/update.js";

const entity = CacheNames.VoiceState;

export async function VoiceStateUpdate(broker: GatewayBroker, data: any) {
    const parsed = JSON.parse(data) as GatewayVoiceStateUpdateDispatchData;
    const key = `${entity}:${parsed.guild_id}:${parsed.user_id}`;
    const ttl = broker.entityConfigMap.get(entity)!.ttl;

    await update(broker.cache!, key, parsed, ttl);

    console.log(`Updated ${key} (ttl: ${ttl})`);

    if ("member" in parsed && parsed.member) {
        const memberKey = `${CacheNames.Member}:${parsed.guild_id}:${parsed.user_id}`;
        await update(broker.cache!, memberKey, parsed.member, broker.entityConfigMap.get(CacheNames.Member)!.ttl);
        console.log(`[Cascade] Updated ${memberKey} (ttl: ${broker.entityConfigMap.get(CacheNames.Member)!.ttl})`);

        const userKey = `${CacheNames.User}:${parsed.user_id}`;
        await update(broker.cache!, userKey, parsed.member.user, broker.entityConfigMap.get(CacheNames.User)!.ttl);
        console.log(`[Cascade] Updated ${userKey} (ttl: ${broker.entityConfigMap.get(CacheNames.User)!.ttl})`);
    }
}
