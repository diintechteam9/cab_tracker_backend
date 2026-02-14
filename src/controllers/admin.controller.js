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

    // 1. Send Message to Driver (Template: journey_details_driver - 4 Variables)
    // {{1}}=DriverName, {{2}}=ClientName, {{3}}=ClientMobile, {{4}}=Link
    if (driverMobile) {
      console.log(`[DEBUG] Attempting to send Driver MSG to: ${driverMobile}`);
      console.log(`[DEBUG] Driver Params:`, [driverName, name, mobile, driverLink]);

      await sendWhatsAppMessage(
        driverMobile,
        process.env.WHATSAPP_DRIVER_TEMPLATE || "journey_details_driver",
        [
          driverName || "Driver",
          name || "Client",
          mobile || "N/A",
          driverLink
        ]
      ).catch(err => console.error(`[ERROR] Driver Msg Failed:`, err.message));
    } else {
      console.warn("[WARN] No driverMobile provided, skipping driver message.");
    }

    // 2. Send Message to Client (Template: journey_status - 5 Variables)
    // {{1}}=ClientName, {{2}}=DriverName, {{3}}=Vehicle, {{4}}=DriverMobile, {{5}}=Link
    console.log(`[DEBUG] Attempting to send Passenger MSG to: ${mobile}`);
    console.log(`[DEBUG] Passenger Params:`, [name, driverName, vehicleNumber, driverMobile, passengerLink]);

    await sendWhatsAppMessage(
      mobile,
      process.env.WHATSAPP_PASSENGER_TEMPLATE || "journey_status",
      [
        name || "Valued Customer",
        driverName || "Your Driver",
        vehicleNumber || "Allocated Vehicle",
        driverMobile || "N/A",
        passengerLink
      ]
    ).catch(err => console.error(`[ERROR] Passenger Msg Failed:`, err.message));

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
