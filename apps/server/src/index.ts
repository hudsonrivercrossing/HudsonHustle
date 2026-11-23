import { createServerApp } from "./app.js";

const { app, env, close } = await createServerApp();
await app.listen({ port: env.port, host: "0.0.0.0" });

if (env.corsOrigin.trim() === "") {
  app.log.warn("CORS_ORIGIN is empty: no browser origin can reach this server. Set it to the web app's origin.");
}

// The platform sends SIGTERM on every deploy. Finish cleanly instead of being killed mid-write.
let shuttingDown = false;
for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.on(signal, () => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    app.log.info({ signal }, "Shutting down");
    close()
      .then(() => process.exit(0))
      .catch((error: unknown) => {
        app.log.error({ err: error }, "Shutdown failed");
        process.exit(1);
      });
  });
}
