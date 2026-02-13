const axios = require("axios");

const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

const sendWhatsAppMessage = async (mobile, link) => {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: mobile, // example: "919876543210"
        type: "template",
        template: {
          name: "grettings", // ✅ EXACT template name (no space)
          language: {
            code: "en" // ✅ same as Meta dashboard
          },
          components: [
            {
              type: "body",
              parameters: [
                {
                  type: "text",
                  text: link // {{1}}
                }
              ]
            }
          ]
        }
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("✅ WhatsApp message sent successfully");
    console.log(response.data);
  } catch (error) {
    console.error(
      "❌ WhatsApp error",
      error.response?.data || error.message
    );
  }
};

module.exports = sendWhatsAppMessage;
