import {
    GatewayGuildBanAddDispatchData,
    GatewayReadyDispatchData,
    GatewayTypingStartDispatchData, GatewayUserUpdateDispatchData
} from "discord-api-types/v10";
import {GatewayBroker} from "../Broker.js";
import {update} from "../util/redis/update.js";
import {CacheNames} from "../util/validateConfig.js";

const entity = CacheNames.User;

export async function Ready(broker: GatewayBroker, data: any) {
    const parsed = JSON.parse(data) as GatewayReadyDispatchData;
    const key = `${entity}:${parsed.user.id}`;
    const ttl = broker.entityConfigMap.get(entity)!.ttl;

    await update(broker.cache!, key, parsed.user, ttl);

    console.log(`Updated ${key} (ttl: ${ttl})`);
}

export async function GuildBanAdd(broker: GatewayBroker, data: any) {
    const parsed = JSON.parse(data) as GatewayGuildBanAddDispatchData;
    const key = `${entity}:${parsed.user.id}`;
    const ttl = broker.entityConfigMap.get(entity)!.ttl;

    await update(broker.cache!, key, parsed.user, ttl);

    console.log(`Updated ${key} (ttl: ${ttl})`);
}

export async function GuildBanRemove(broker: GatewayBroker, data: any) {
    const parsed = JSON.parse(data) as GatewayGuildBanAddDispatchData;
    const key = `${entity}:${parsed.user.id}`;
    const ttl = broker.entityConfigMap.get(entity)!.ttl;

    await update(broker.cache!, key, parsed.user, ttl);

    console.log(`Updated ${key} (ttl: ${ttl})`);
}

export async function TypingStart(broker: GatewayBroker, data: any) {
    const parsed = JSON.parse(data) as GatewayTypingStartDispatchData;

    if ("member" in parsed && parsed.member) {
        if (parsed.guild_id) {
            const memberKey = `${CacheNames.Member}:${parsed.guild_id}:${parsed.member.user!.id}`;
            await update(broker.cache!, memberKey, parsed.member, broker.entityConfigMap.get(CacheNames.Member)!.ttl);
            console.log(`Updated ${memberKey} (ttl: ${broker.entityConfigMap.get(CacheNames.Member)!.ttl})`);
        }

        const userKey = `${CacheNames.User}:${parsed.member.user!.id}`;
        await update(broker.cache!, userKey, parsed.member.user, broker.entityConfigMap.get(CacheNames.User)!.ttl);
        console.log(`[Cascade] Updated ${userKey} (ttl: ${broker.entityConfigMap.get(CacheNames.User)!.ttl})`);
    }
}

export async function UserUpdate(broker: GatewayBroker, data: any) {
    const parsed = JSON.parse(data) as GatewayUserUpdateDispatchData;
    const key = `${entity}:${parsed.id}`;
    const ttl = broker.entityConfigMap.get(entity)!.ttl;

    await update(broker.cache!, key, parsed, ttl);

    console.log(`Updated ${key} (ttl: ${ttl})`);
}
