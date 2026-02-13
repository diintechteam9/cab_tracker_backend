const { v4: uuid } = require("uuid");
const User = require("../models/User");
const Location = require("../models/Location");
const sendWhatsAppMessage = require("../services/whatsapp.service");

exports.createTracking = async (req, res) => {
  try {
    const {
      name, mobile,
      sourceLat, sourceLng, sourceAddress,
      destLat, destLng, destAddress,
      driverName, driverMobile, vehicleNumber
    } = req.body;

    const token = uuid();

    const user = await User.create({
      name,
      mobile,
      token,
      source: { lat: sourceLat, lng: sourceLng },
      sourceAddress,
      destination: { lat: destLat, lng: destLng },
      destAddress,
      driverName,
      driverMobile,
      vehicleNumber,
      status: "ACTIVE"
    });

    // Use environment variable for domain in production
    const domain = process.env.FRONTEND_URL || "http://localhost:5173";
    const driverLink = `${domain}/track?token=${token}&role=driver`;
    const passengerLink = `${domain}/track?token=${token}&role=passenger`;

    // 1. Send Message to Driver (Contains Client Info)
    if (driverMobile) {
      // Logic: Driver receives Client's Name and Mobile
      await sendWhatsAppMessage(
        driverMobile,
        process.env.WHATSAPP_DRIVER_TEMPLATE || "grettings",
        [`Client: ${name}, Mob: ${mobile}`, driverLink]
      );
    }

    // 2. Send Message to Client (Contains Driver & Vehicle Info)
    await sendWhatsAppMessage(
      mobile,
      process.env.WHATSAPP_PASSENGER_TEMPLATE || "grettings",
      [`Driver: ${driverName}, Vehicle: ${vehicleNumber}`, passengerLink]
    );

    res.json({ success: true, user, link: passengerLink });
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

  // 3. Emit to Admin panel and specific trip room immediately
  io.to("ADMIN").to(token).emit("location-update", {
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
