import {fork} from "child_process";

const workerCount = parseInt(process.env.WORKER_COUNT || '4');
const workerFile = "dist/worker.js";

for (let i = 0; i < workerCount; i++) {
  fork(workerFile);
  console.log(`Spawned worker ${i}`);
}
