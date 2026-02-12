const axios = require("axios");

const PHONE_NUMBER_ID = "790783224112773";
const ACCESS_TOKEN = "EAAPQNJxvtoUBPNypMjlWt2ShbI29bhUN9J9yPKbu0ZBPiXdBdKlv8PeOzYa0iKne1YR27G0VJjlZBkDQIZA7ZBQEZCZC4nfEqENFv9fyQkB0ZCs2EdkeZCaoJLoxzl3MbEVukk2y7UQgt3Tl7psZBWZBsSKRrPZCIxO4ZAQCPDvwxZBnYe2CbUDaStcW212O9xbZBmzooVtAZDZD"; // env me rakhna best hai

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
