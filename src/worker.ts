import {GatewayBroker} from "./Broker.js";

const broker = new GatewayBroker("./config.json");

await broker.connectBroker();
await broker.connectCache();

broker.subscribe()
