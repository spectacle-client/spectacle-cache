import Redis, {Cluster} from "ioredis";

export async function update(cache: Redis | Cluster, key: string, data: any, ttl: number)  {
    const oldData = await cache.get(key);
    const newData = JSON.stringify({...JSON.parse(oldData || "{}"), ...data});

    if (ttl !== -1) await cache.set(key, newData, "EX", ttl);
    else await cache.set(key, newData);
}
