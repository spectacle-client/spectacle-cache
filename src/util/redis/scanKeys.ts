import {GatewayBroker} from "../../Broker.js";

export async function scanKeys(broker: GatewayBroker, pattern: string): Promise<string[]> {
    const keys: string[] = [];
    let cursor = "0";
    do {
        const [newCursor, newKeys] = await broker.cache!.scan(cursor, "MATCH", pattern);
        keys.push(...newKeys);
        cursor = newCursor;
    } while (cursor !== "0");
    return keys;
}
