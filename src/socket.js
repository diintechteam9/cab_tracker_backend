const { produceLocation, getKafkaStatus } = require("./services/kafka.service");
const { saveLocation } = require("./controllers/admin.controller");

module.exports = (io) => {
  io.on("connection", (socket) => {
    socket.on("join-admin", () => socket.join("ADMIN"));

    socket.on("send-location", async (data) => {
      // Try Kafka first for scalability
      const produced = await produceLocation(data);

      // Fallback to direct DB save if Kafka is down
      if (!produced) {
        await saveLocation(data, io);
      }
    });
  });
};
