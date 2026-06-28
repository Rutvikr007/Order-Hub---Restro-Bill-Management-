import dotenv from "dotenv";
dotenv.config();

import http from "http";
import { createApp } from "./app";
import { checkDbConnection } from "./config/db";
import { initSocket } from "./sockets";

const PORT = Number(process.env.PORT ?? 4000);

async function main() {
  await checkDbConnection();
  console.log("PostgreSQL connection established.");

  const app = createApp();
  const httpServer = http.createServer(app);

  initSocket(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`OMS backend listening on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
