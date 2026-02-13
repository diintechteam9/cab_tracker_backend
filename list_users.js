require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./src/models/User");

const listUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({}).sort({ createdAt: -1 }).limit(10);

        console.log("\n--- Recent Users/Journeys ---");
        if (users.length === 0) {
            console.log("No users found in database.");
        } else {
            users.forEach((u, i) => {
                console.log(`${i + 1}. Name: ${u.name} | Mobile: ${u.mobile} | Status: ${u.status}`);
            });
        }
        console.log("-----------------------------\n");

        process.exit(0);
    } catch (err) {
        console.error("Error:", err.message);
        process.exit(1);
    }
};

listUsers();
