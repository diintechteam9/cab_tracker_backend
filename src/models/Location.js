const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    token: { type: String, index: true },
    lat: Number,
    lng: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Location", locationSchema);
