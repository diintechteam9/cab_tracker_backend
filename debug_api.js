const axios = require("axios");
const fs = require("fs");
require("dotenv").config();

const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

const test = async () => {
    const mobile = "917970906978";
    const link = "http://test.com";
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: "whatsapp",
                to: mobile,
                type: "template",
                template: {
                    name: "grettings",
                    language: { code: "en" },
                    components: [{ type: "body", parameters: [{ type: "text", text: link }] }]
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${ACCESS_TOKEN}`,
                    "Content-Type": "application/json"
                }
            }
        );
        fs.writeFileSync("api_res.json", JSON.stringify(response.data, null, 2));
    } catch (error) {
        fs.writeFileSync("api_res.json", JSON.stringify(error.response?.data || error.message, null, 2));
    }
};
test();
