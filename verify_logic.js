require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./src/models/User");
const adminController = require("./src/controllers/admin.controller");

// Mocking res object
const res = {
    json: (data) => {
        console.log("Response JSON:", JSON.stringify(data, null, 2));
    },
    status: (code) => ({
        json: (data) => console.log(`Response ${code}:`, data)
    })
};

const verifyImplementation = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");

        const mockReq = {
            body: {
                name: "Test Passenger",
                mobile: "9999999999",
                sourceLat: 28.6139,
                sourceLng: 77.2090,
                destLat: 19.0760,
                destLng: 72.8777,
                driverName: "Test Driver",
                driverMobile: "8888888888",
                vehicleNumber: "TEST-007"
            }
        };

        console.log("Calling createTracking...");
        await adminController.createTracking(mockReq, res);

        const savedUser = await User.findOne({ mobile: "9999999999" }).sort({ createdAt: -1 });
        if (savedUser && savedUser.driverName === "Test Driver") {
            console.log("✅ Database verification SUCCESS: Driver details saved.");
        } else {
            console.log("❌ Database verification FAILED.");
        }

        process.exit(0);
    } catch (err) {
        console.error("Verification Error:", err);
        process.exit(1);
    }
};

verifyImplementation();
