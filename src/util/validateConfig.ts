export enum CacheNames {
    AutoModRule = "automodrule",
    Channel = "channel",
    Guild = "guild",
    Emoji = "emoji",
    Sticker = "sticker",
    Member = "member",
    Role = "role",
    Event = "event",
    Integration = "integration",
    Invite = "invite",
    Message = "message",
    Reaction = "reaction",
    Stage = "stage",
    VoiceState = "voicestate",
    Presence = "presence",
    User = "user",
}

export interface Config {
    broker: {
        type: "redis" | "amqp",
        urls: string[],
        group: string,
    },
    cache: {
        urls: string[],
    },
    entities: {
        [K in CacheNames]: {
            prefix: string,
            ttl?: number,
            enabled?: boolean,
        }
    },
    default: {
        prefixCase: "lower" | "upper" | "capital",
        ttl: number,
    }
}

export function validateConfig(config: any): Config {
    if (!config) {
        throw new Error("No config provided");
    } else if (!config.broker) {
        throw new Error("No broker config provided");
    } else if (!config.broker.type) {
        throw new Error("No broker type provided");
    } else if (config.broker.type !== "redis" && config.broker.type !== "amqp") {
        throw new Error("Invalid broker type");
    } else if (!config.broker.urls?.length) {
        throw new Error("No broker urls provided");
    } else if (config.broker.urls.some((x: any) => typeof x !== "string")) {
        throw new Error("Invalid broker url");
    } else if(config.broker.group && !(typeof config.broker.group === "string")) {
        throw new Error("Invalid broker group provided");
    } else if (!config.cache) {
        throw new Error("No cache config provided");
    } else if (!config.cache.urls?.length) {
        throw new Error("No cache urls provided");
    } else if(config.cache.urls.some((x: any) => typeof x !== "string")) {
        throw new Error("Invalid cache url");
    }

    if (config.default) {
        for (const key of Object.keys(config.default)) {
            if (key !== "prefixCase" && key !== "ttl" && key !== "key_path" && key !== "id_only") {
                throw new Error(`Invalid default events config provided: ${key}`);
            }
        }

        if (config.default.prefixCase) {
            if (config.default.prefixCase !== "lower" && config.default.prefixCase !== "upper" && config.default.prefixCase !== "capital")
                throw new Error(`Invalid default prefixCase provided: ${config.default.prefixCase}`);
        } else {
            config.default.prefixCase = "lower";
        }

        if (config.default.ttl) {
            if (typeof config.default.ttl !== "number")
                throw new Error(`Invalid default ttl provided: ${config.default.ttl}`);
        } else {
            config.default.ttl = 0;
        }
    } else {
        config.default = {
            prefixCase: "lower",
            ttl: 86400,
        };
    }

    if (config.entities) {
        if (typeof config.entities !== "object") {
            throw new Error(`Invalid events config provided: ${config.entities}`);
        }

        for (const [name, entity] of Object.entries(config.entities) as [string, any][]) {
            if (!Object.values(CacheNames).includes(name as CacheNames)) {
                throw new Error(`Invalid entity name provided: ${name}`);
            }

            for (const key of Object.keys(entity)) {
                if (key !== "prefixCase" && key !== "ttl" && key !== "key_path" && key !== "id_only" && key !== "enabled") {
                    throw new Error(`Invalid entity config provided: ${key}`);
                }
            }

            if (entity.prefix && typeof entity.prefix !== "string") {
                throw new Error(`Invalid entity prefix case provided for ${name}: ${entity.prefixCase}`);
            }

            if (entity.ttl && typeof entity.ttl !== "number") {
                throw new Error(`Invalid entity ttl provided for ${name}: ${entity.ttl}`);
            }

            if (entity.enabled && typeof entity.enabled !== "boolean") {
                throw new Error(`Invalid entity enabled provided for ${name}: ${entity.enabled}`);
            }
        }
    }

    return config as Config;
}
