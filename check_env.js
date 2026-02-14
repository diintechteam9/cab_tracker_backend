require("dotenv").config();
console.log("CWD:", process.cwd());
console.log("MONGODB_URI:", process.env.MONGODB_URI ? "Found" : "Not Found");
console.log("PORT:", process.env.PORT);
console.log("WHATSAPP_ACCESS_TOKEN:", process.env.WHATSAPP_ACCESS_TOKEN ? "Found" : "Not Found");
