const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const session = require("express-session");
const multer = require("multer");
const path = require("path");

const app = express();
app.use(cors());
app.use(session({
  secret: "worldbestlogisticsecret",
  resave: false,
  saveUninitialized: true
}));
app.use(bodyParser.json());
app.use(express.static("public"));

let packages = [];
let messages = [];

// multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

/* ================= ADMIN ADD PACKAGE ================= */

app.post("/admin/add-package", upload.single("proofImage"), (req, res) => {
  if (!req.session.admin) return res.status(401).json({ error: "Unauthorized" });

  const newPackage = {
    trackingCode: req.body.trackingCode,
    sender: req.body.sender,
    senderLocation: req.body.senderLocation,
    receiver: req.body.receiver,
    receiverLocation: req.body.receiverLocation,
    weight: req.body.weight,
    status: req.body.status,
    location: req.body.location,
    lat: parseFloat(req.body.lat),
    lng: parseFloat(req.body.lng),
    receiverLat: parseFloat(req.body.receiverLat),
    receiverLng: parseFloat(req.body.receiverLng),
    proofImage: "/uploads/" + req.file.filename,
    active: true
  };

  packages.push(newPackage);
  res.json({ message: "Package added successfully" });
});

/* ================= TRACK PACKAGE ================= */

app.post("/track", (req, res) => {
  const pkg = packages.find(p => p.trackingCode === req.body.code);

  if (!pkg) return res.json({ error: "Tracking not found." });
  if (!pkg.active) return res.json({ error: "Tracking is currently paused by admin." });

  res.json(pkg);
});

/* ================= TOGGLE TRACKING ================= */

app.post("/admin/toggle", (req, res) => {
  if (!req.session.admin) return res.status(401).json({ error: "Unauthorized" });
  const pkg = packages.find(p => p.trackingCode === req.body.code);
  if (pkg) {
    pkg.active = !pkg.active;
    res.json({ message: "Tracking status updated." });
  } else {
    res.json({ error: "Package not found." });
  }
});

/* ================= CUSTOMER MESSAGE ================= */

app.post("/message", (req, res) => {
  messages.push({
    id: messages.length,
    name: req.body.name,
    message: req.body.message,
    reply: ""
  });

  res.json({ message: "Message sent successfully." });
});

/* ================= ADMIN LOGIN ================= */

app.post("/admin/login", (req, res) => {
  const { username, password } = req.body;

  if (username === "admin" && password === "12345") {
    req.session.admin = true;
    res.json({ success: true });
  } else {
    res.json({ success: false, message: "Invalid credentials" });
  }
});

/* ================= ADMIN VIEW MESSAGES ================= */

app.get("/admin/messages", (req, res) => {
  if (!req.session.admin) return res.status(401).json({ error: "Unauthorized" });
  res.json(messages);
});

/* ================= ADMIN REPLY ================= */

app.post("/admin/reply", (req, res) => {
  if (!req.session.admin) return res.status(401).json({ error: "Unauthorized" });
  const msg = messages.find(m => m.id === req.body.id);
  if (msg) {
    msg.reply = req.body.reply;
    res.json({ message: "Reply sent successfully." });
  } else {
    res.json({ error: "Message not found." });
  }
});

/* ================= GET CUSTOMER MESSAGES ================= */

app.get("/messages", (req, res) => {
  res.json(messages);
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));