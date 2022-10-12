import {
    GatewayGuildMemberAddDispatchData,
    GatewayGuildMemberRemoveDispatchData, GatewayGuildMembersChunkDispatchData,
    GatewayGuildMemberUpdateDispatchData
} from "discord-api-types/v10";
import { CacheNames } from "util/validateConfig";
import {GatewayBroker} from "../Broker.js";
import {update} from "../util/redis/update.js";

const entity = CacheNames.Member;

export async function GuildMemberAdd(broker: GatewayBroker, data: any) {
    const parsed = JSON.parse(data) as GatewayGuildMemberAddDispatchData;
    const key = `${entity}:${parsed.guild_id}:${parsed.user!.id}`;
    const ttl = broker.entityConfigMap.get(entity)!.ttl;

    if (ttl !== -1) await broker.cache!.set(key, data, "EX", ttl);
    else await broker.cache!.set(key, data);

    console.log(`Cached ${key} (ttl: ${ttl})`);

    await GuildMemberAddUpdateCascade(broker, data);

    const userKey = `${CacheNames.User}:${parsed.user!.id}`;
    const userTtl = broker.entityConfigMap.get(CacheNames.User)!.ttl;

    await update(broker.cache!, userKey, parsed.user, userTtl);

    console.log(`Updated ${userKey} (ttl: ${userTtl})`);
}

export async function GuildMemberUpdate(broker: GatewayBroker, data: any) {
    const parsed = JSON.parse(data) as GatewayGuildMemberUpdateDispatchData;
    const key = `${entity}:${parsed.guild_id}:${parsed.user.id}`;
    const ttl = broker.entityConfigMap.get(entity)!.ttl;

    await update(broker.cache!, key, parsed, ttl);

    console.log(`Updated ${key} (ttl: ${ttl})`);

    await GuildMemberAddUpdateCascade(broker, data);

    const userKey = `${CacheNames.User}:${parsed.user!.id}`;
    const userTtl = broker.entityConfigMap.get(CacheNames.User)!.ttl;

    await update(broker.cache!, userKey, parsed.user, userTtl);

    console.log(`Updated ${userKey} (ttl: ${userTtl})`);
}

export async function GuildMemberRemove(broker: GatewayBroker, data: any) {
    const parsed = JSON.parse(data) as GatewayGuildMemberRemoveDispatchData;
    const key = `${entity}:${parsed.guild_id}:${parsed.user.id}`;

    await broker.cache!.del(key);
    console.log(`Deleted ${key}`);
}

export async function GuildMembersChunk(broker: GatewayBroker, data: any) {
    const parsed = JSON.parse(data) as GatewayGuildMembersChunkDispatchData;

    for (const member of parsed.members) {
        const key = `${entity}:${parsed.guild_id}:${member.user!.id}`;
        const ttl = broker.entityConfigMap.get(entity)!.ttl;

        if (ttl !== -1) await broker.cache!.set(key, JSON.stringify(member), "EX", ttl);
        else await broker.cache!.set(key, JSON.stringify(member));

        console.log(`Cached ${key} (ttl: ${ttl})`);

        const userKey = `${CacheNames.User}:${member.user!.id}`;
        const userTtl = broker.entityConfigMap.get(CacheNames.User)!.ttl;
        await update(broker.cache!, userKey, member.user, userTtl);
        console.log(`Updated ${userKey} (ttl: ${userTtl})`);
    }

    if ("presences" in parsed) {
        for (const presence of parsed.presences) {
            const key = `${CacheNames.Presence}:${parsed.guild_id}:${presence.user!.id}`;
            await update(broker.cache!, key, presence, broker.entityConfigMap.get(CacheNames.Presence)!.ttl);
            console.log(`[Cascade] Updated ${key} (ttl: ${broker.entityConfigMap.get(CacheNames.Presence)!.ttl})`);
        }
    }
}

export async function GuildMemberAddUpdateCascade(broker: GatewayBroker, data: GatewayGuildMemberAddDispatchData) {
    if (data.user) {
        const userKey = `${CacheNames.User}:${data.user.id}`;
        await update(broker.cache!, userKey, data.user, broker.entityConfigMap.get(CacheNames.User)!.ttl);
        console.log(`[Cascade] Updated ${userKey} (ttl: ${broker.entityConfigMap.get(CacheNames.User)!.ttl})`);
    }
}
