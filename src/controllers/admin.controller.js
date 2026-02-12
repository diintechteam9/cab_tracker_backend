const { v4: uuid } = require("uuid");
const User = require("../models/User");
const Location = require("../models/Location");
const sendWhatsAppMessage = require("../services/whatsapp.service");

exports.createTracking = async (req, res) => {
  try {
    const { name, mobile, sourceLat, sourceLng, destLat, destLng } = req.body;
    const token = uuid();

    const user = await User.create({
      name,
      mobile,
      token,
      source: { lat: sourceLat, lng: sourceLng },
      destination: { lat: destLat, lng: destLng },
      status: "ACTIVE"
    });

    // Use environment variable for domain in production
    const domain = process.env.FRONTEND_URL || "http://localhost:5173";
    const link = `${domain}/track?token=${token}`;

    await sendWhatsAppMessage(mobile, link);

    res.json({ success: true, user, link });
  } catch (error) {
    console.error("Error creating tracking:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// In-memory buffer for high-volume updates (Direct Mode only)
let updateBuffer = {};
let locationBuffer = []; // To batch insert location history
const FLUSH_INTERVAL = 5000; // 5 seconds
const LOCATION_BATCH_INTERVAL = 10000; // 10 seconds

// Flush User profile buffer (Speed, Status)
setInterval(async () => {
  const tokens = Object.keys(updateBuffer);
  if (tokens.length === 0) return;

  for (const token of tokens) {
    const data = updateBuffer[token];
    await User.findOneAndUpdate(
      { token },
      {
        speed: data.speed,
        gpsStatus: data.gpsStatus,
        lastSeen: data.lastSeen
      }
    ).catch(e => console.error("Buffer User update error:", e.message));

    delete updateBuffer[token];
  }
}, FLUSH_INTERVAL);

// Flush Location traces buffer (History)
setInterval(async () => {
  if (locationBuffer.length === 0) return;

  const batch = [...locationBuffer];
  locationBuffer = [];

  // Batch insert into MongoDB (Much faster than individual inserts)
  await Location.insertMany(batch).catch(e => console.error("Batch Location error:", e.message));
}, LOCATION_BATCH_INTERVAL);

exports.saveLocation = async (data, io) => {
  const { token, lat, lng, speed, gpsStatus } = data;

  // 1. Buffering User Info
  updateBuffer[token] = {
    speed: speed || 0,
    gpsStatus: gpsStatus || "ON",
    lastSeen: new Date()
  };

  // 2. Buffering Location Trace
  // In a real 50k scenario, we might only save every 2nd or 3rd coordinate
  locationBuffer.push({ token, lat, lng });

  // 3. Emit to Admin panel immediately
  io.to("ADMIN").emit("location-update", {
    ...data,
    lastSeen: updateBuffer[token].lastSeen
  });
};

exports.getUsers = async (_, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getHistory = async (req, res) => {
  res.json(await Location.find({ token: req.params.token }));
};

exports.completeTrip = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: "COMPLETED" },
      { new: true }
    );
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
