const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();

const productsRoutes = require("./routes/products");

const app = express();

// middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// routes
app.get("/", (req, res) => {
  res.send("API running. Try /health or /api/products");
});

app.get("/health", (req, res) => {
  res.json({ ok: true, message: "API merge" });
});

app.use("/api/products", productsRoutes);


app.use((req, res) => {
  res.status(404).json({ message: "Not Found" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Server error" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server pornit pe http://localhost:${PORT}`);
});
