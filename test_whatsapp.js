require("dotenv").config();
const sendWhatsAppMessage = require("./src/services/whatsapp.service");

const testMessage = async () => {
    const mobile = "917970906978"; // Your verified number
    const link = "http://localhost:5173/track?token=test-token&role=driver";

    // Testing 'journey_details_driver' (4 Variables)
    // {{1}}=DriverName, {{2}}=ClientName, {{3}}=ClientMobile, {{4}}=Link
    const templateName = "journey_details_driver";
    const params = [
        "Ramesh Kumar",   // {{1}} Driver Name
        "Anand",          // {{2}} Client Name
        "7970906978",     // {{3}} Client Mobile
        link              // {{4}} Tracking Link
    ];

    console.log(`Sending test message to ${mobile} using template '${templateName}'...`);
    await sendWhatsAppMessage(mobile, templateName, params);
    console.log("Check your WhatsApp now.");
};

testMessage();
