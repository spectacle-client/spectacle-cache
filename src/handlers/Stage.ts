import {GatewayStageInstanceCreateDispatchData} from "discord-api-types/v10";
import {GatewayBroker} from "../Broker.js";
import {del, set, update} from "../util/redis/index.js";
import {CacheNames} from "../util/validateConfig.js";

const entity = CacheNames.Stage;

export async function StageInstanceCreate(broker: GatewayBroker, data: any) {
    const parsed = JSON.parse(data) as GatewayStageInstanceCreateDispatchData;
    const key = `${entity}:${parsed.guild_id}:${parsed.id}`;
    await set(broker, entity, key, data);
}

export async function StageInstanceUpdate(broker: GatewayBroker, data: any) {
    const parsed = JSON.parse(data) as GatewayStageInstanceCreateDispatchData;
    const key = `${entity}:${parsed.guild_id}:${parsed.id}`;
    await update(broker, entity, key, parsed);
}

export async function StageInstanceDelete(broker: GatewayBroker, data: any) {
    const parsed = JSON.parse(data) as GatewayStageInstanceCreateDispatchData;
    const key = `${entity}:${parsed.guild_id}:${parsed.id}`;
    await del(broker, entity, key);
}
