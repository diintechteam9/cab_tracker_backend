const { Kafka, Partitioners } = require("kafkajs");

const kafka = new Kafka({
    clientId: "gps-tracker",
    brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
});

const producer = kafka.producer({
    createPartitioner: Partitioners.LegacyPartitioner
});
const consumer = kafka.consumer({ groupId: "gps-group" });

let isKafkaConnected = false;

const initKafka = async () => {
    if (process.env.ENABLE_KAFKA !== "true") {
        isKafkaConnected = false;
        return false;
    }
    try {
        await producer.connect();
        console.log("✅ Kafka Producer Connected");
        await consumer.connect();
        console.log("✅ Kafka Consumer Connected");
        isKafkaConnected = true;
        return true;
    } catch (err) {
        console.warn("⚠️ Kafka enabled but connection failed, falling back to direct mode.");
        isKafkaConnected = false;
        return false;
    }
};

const produceLocation = async (data) => {
    if (!isKafkaConnected) return false;
    try {
        await producer.send({
            topic: "location-updates",
            messages: [{ value: JSON.stringify(data) }],
        });
        return true;
    } catch (err) {
        console.error("❌ Kafka Produce Error:", err.message);
        return false;
    }
};

const startConsumer = async (io) => {
    if (!isKafkaConnected || process.env.ENABLE_KAFKA !== "true") return;
    const { saveLocation } = require("../controllers/admin.controller");

    try {
        await consumer.subscribe({ topic: "location-updates", fromBeginning: false });

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                const data = JSON.parse(message.value.toString());
                await saveLocation(data, io);
            },
        });
    } catch (err) {
        console.error("❌ Kafka Consumer Error:", err.message);
    }
};

const getKafkaStatus = () => isKafkaConnected;

module.exports = { initKafka, produceLocation, startConsumer, getKafkaStatus };
