import { createApp } from "./app.js";
import { getEnv } from "./config/env.js";

const env = getEnv();
const app = createApp();

app.listen(env.port, () => {
  console.log(`Family Meal Planner API listening on port ${env.port}`);
});
