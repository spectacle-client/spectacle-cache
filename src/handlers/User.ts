import {
    GatewayGuildBanAddDispatchData,
    GatewayReadyDispatchData,
    GatewayTypingStartDispatchData,
    GatewayUserUpdateDispatchData
} from "discord-api-types/v10";
import {GatewayBroker} from "../Broker.js";
import {update} from "../util/redis/index.js";
import {CacheNames} from "../util/validateConfig.js";

const entity = CacheNames.User;

export async function Ready(broker: GatewayBroker, data: any) {
    const parsed = JSON.parse(data) as GatewayReadyDispatchData;
    const key = `${entity}:${parsed.user.id}`;
    await update(broker, entity, key, parsed.user);
}

export async function GuildBanAdd(broker: GatewayBroker, data: any) {
    const parsed = JSON.parse(data) as GatewayGuildBanAddDispatchData;
    const key = `${entity}:${parsed.user.id}`;
    await update(broker, entity, key, parsed.user);
}

export async function GuildBanRemove(broker: GatewayBroker, data: any) {
    const parsed = JSON.parse(data) as GatewayGuildBanAddDispatchData;
    const key = `${entity}:${parsed.user.id}`;
    await update(broker, entity, key, parsed.user);
}

export async function TypingStart(broker: GatewayBroker, data: any) {
    const parsed = JSON.parse(data) as GatewayTypingStartDispatchData;

    if ("member" in parsed && parsed.member) {
        if (parsed.guild_id) {
            const memberKey = `${CacheNames.Member}:${parsed.guild_id}:${parsed.member.user!.id}`;
            await update(broker, CacheNames.Member, memberKey, parsed.member);
        }

        const userKey = `${CacheNames.User}:${parsed.member.user!.id}`;
        await update(broker, CacheNames.User, userKey, parsed.member.user!);
    }
}

export async function UserUpdate(broker: GatewayBroker, data: any) {
    const parsed = JSON.parse(data) as GatewayUserUpdateDispatchData;
    const key = `${entity}:${parsed.id}`;
    await update(broker, entity, key, parsed);
}
