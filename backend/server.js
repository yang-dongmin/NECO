const express = require("express");
const cors = require("cors");

require("./database/initDB");
require("dotenv").config();


const authRoutes =
require("./routes/authRoutes");

const app = express();

app.use(cors());

app.use(express.json());

app.use(
    "/api/auth",
    authRoutes
);

app.get("/", (req, res) => {
    res.send("NECO API SERVER");
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`server running on ${PORT}`);
});