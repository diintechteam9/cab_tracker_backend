const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/admin", require("./routes/admin.routes"));

module.exports = app;
