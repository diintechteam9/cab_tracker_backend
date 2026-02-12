const router = require("express").Router();
const c = require("../controllers/admin.controller");

router.post("/create", c.createTracking);
router.get("/users", c.getUsers);
router.get("/history/:token", c.getHistory);
router.put("/complete/:id", c.completeTrip);

module.exports = router;
