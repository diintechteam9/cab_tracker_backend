const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const http = require("http");
const { Server } = require("socket.io");
const app = require("./src/app");
const connectDB = require("./src/config/db");
const socketHandler = require("./src/socket");
const { initKafka, startConsumer } = require("./src/services/kafka.service");

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const startServer = async () => {
  try {
    await connectDB();

    // Initialize Kafka and Consumer (Only if enabled)
    if (process.env.ENABLE_KAFKA === "true") {
      await initKafka();
      await startConsumer(io);
    } else {
      console.log("ℹ️ Kafka is disabled in .env, running in direct mode.");
    }

    socketHandler(io);

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () =>
      console.log(`🚀 Backend running on http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

startServer();
