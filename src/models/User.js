const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: String,
    mobile: String,
    token: { type: String, index: true, unique: true },
    source: { lat: Number, lng: Number },
    sourceAddress: String,
    destination: { lat: Number, lng: Number },
    destAddress: String,
    driverName: String,
    driverMobile: String,
    vehicleNumber: String,
    otp: { type: String }, // 4-digit OTP for ride start
    status: { type: String, default: "PENDING", enum: ["PENDING", "STARTED", "COMPLETED"] },
    startTime: Date,
    endTime: Date,
    startLocation: { lat: Number, lng: Number }, // Actual location when ride starts
    endLocation: { lat: Number, lng: Number },   // Actual location when ride ends
    speed: { type: Number, default: 0 },
    gpsStatus: { type: String, default: "ON" },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
