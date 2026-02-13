require("dotenv").config();
const sendWhatsAppMessage = require("./src/services/whatsapp.service");

const testMessage = async () => {
    const mobile = "917970906978"; // Manually adding 91
    const link = "http://localhost:5173/track?token=test-token";

    console.log(`Sending test message to ${mobile}...`);
    await sendWhatsAppMessage(mobile, link);
    console.log("Check your WhatsApp now.");
};

testMessage();
