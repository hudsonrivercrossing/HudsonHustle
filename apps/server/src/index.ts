import { createServerApp } from "./app.js";

const { app, env } = await createServerApp();
await app.listen({ port: env.port, host: "0.0.0.0" });
