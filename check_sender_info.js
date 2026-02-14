require("dotenv").config();
const axios = require("axios");

const checkInfo = async () => {
    const id = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const token = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!id || !token) {
        console.error("Missing ID or Token in .env");
        return;
    }

    try {
        // Query Meta API for phone number details
        const url = `https://graph.facebook.com/v19.0/${id}?fields=display_phone_number,verified_name,quality_rating`;
        const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const output = `
--- WhatsApp Sender Details ---
📞 Display Phone Number: ${response.data.display_phone_number}
ABC Verified Name: ${response.data.verified_name}
⭐ Quality Rating: ${response.data.quality_rating}
-------------------------------
`;
        console.log(output);
        const fs = require('fs');
        fs.writeFileSync('sender_info_utf8.txt', output, 'utf8');

    } catch (error) {
        console.error("❌ Error fetching info:", error.response?.data || error.message);
    }
};

checkInfo();
