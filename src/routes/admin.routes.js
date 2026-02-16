const router = require("express").Router();
const c = require("../controllers/admin.controller");

router.post("/create", c.createTracking);
router.post("/verify-otp", c.verifyOTP);
router.get("/users", c.getUsers);
router.get("/trip/:token", c.getTripDetails); // For Dashboard OTP
router.get("/history/:token", c.getHistory);
router.put("/complete/:id", c.completeTrip);

module.exports = router;
