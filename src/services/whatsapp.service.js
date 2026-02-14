const axios = require("axios");

const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

const sendWhatsAppMessage = async (mobile, templateName, parameters = []) => {
  try {
    // Automatically add 91 if it's a 10-digit Indian number
    let formattedMobile = mobile.replace(/\D/g, ""); // Remove non-numeric chars
    if (formattedMobile.length === 10) {
      formattedMobile = "91" + formattedMobile;
    }

    const response = await axios.post(
      `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: formattedMobile,
        type: "template",
        template: {
          name: templateName,
          language: {
            code: "en"
          },
          components: [
            {
              type: "body",
              parameters: parameters.map(p => ({
                type: "text",
                text: p
              }))
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
    const errorResponse = error.response?.data || error.message;
    console.error("❌ WhatsApp error:", JSON.stringify(errorResponse, null, 2));

    // Specific handling for Expired Token (Code 190)
    if (errorResponse?.error?.code === 190) {
      console.error("\n🚨 ALERT: Your WhatsApp Access Token has EXPIRED!");
      console.error("👉 Please follow the steps in 'WHATSAPP_TOKEN_GUIDE.md' to generate a PERMANENT token.");
      console.error("   Then update 'WHATSAPP_ACCESS_TOKEN' in your .env file.\n");
    }
  }
};

module.exports = sendWhatsAppMessage;
