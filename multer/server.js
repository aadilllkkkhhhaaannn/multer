require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const app = require("./app");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const PORT = process.env.PORT || 5000;

// 📁 Create upload folders if not exist
const imageDir = path.join(__dirname, "uploads");
const pdfDir = path.join(__dirname, "uploads/pdf");

if (!fs.existsSync(imageDir)) fs.mkdirSync(imageDir, { recursive: true });
if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });

// ✅ Serve static files
app.use(express.static(path.join(__dirname, "multer/public")));
app.use(express.static("uploads")); // for images
app.use("/pdf", express.static(pdfDir)); // for PDFs

// ✅ Connect to DB
connectDB();

// ✅ Multer configs
const imageUpload = multer({ dest: "uploads/" });
const pdfUpload = multer({
  dest: "uploads/pdf",
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files allowed"), false);
    }
  },
});

const imageDB = [];

// ✅ Image Upload Route
app.post("/image", imageUpload.single("image"), (req, res) => {
  console.log(req.body);
  const oldPath = path.join(__dirname, "uploads", req.file.filename);
  const newPath = path.join(__dirname, "uploads", req.body.fullname);

  fs.rename(oldPath, newPath, (err) => {
    if (err) throw err;
    imageDB.push(req.body.fullname);
    console.log(req.file);
    res.send(`<img src='/${req.body.fullname}' />`);
  });
});

// ✅ PDF Upload Route
app.post("/upload-pdf", pdfUpload.single("pdfFile"), (req, res) => {
  if (!req.file) return res.status(400).send("No PDF uploaded.");
  console.log(req.file);
  const oldPath = path.join(__dirname, "uploads/pdf", req.file.filename);
  const newPath = path.join(__dirname, "uploads/pdf", req.file.originalname);

  fs.rename(oldPath, newPath, (err) => {
    if (err) throw err;
    res.send(
      `<p>PDF Uploaded: <a href="/pdf/${req.file.originalname}" target="_blank">${req.file.originalname}</a></p>`
    );
  });
});

// ✅ Get all uploaded images
app.get("/images", (req, res) => {
  let html = "";
  imageDB.forEach((img) => {
    html += `<img width='200' src='/${img}' /><br/>`;
  });
  res.send(html);
});

// ✅ get all uploaded pdfs

// ✅ Route to list all PDFs
app.get("/all-pdfs", (req, res) => {
  const pdfDir = path.join(__dirname, "uploads/pdf");

  fs.readdir(pdfDir, (err, files) => {
    if (err) {
      return res.status(500).send("Unable to read PDF folder");
    }

    let html = "<h2>Uploaded PDFs:</h2>";
    files.forEach((file) => {
      html += `<p><a href="/pdf/${file}" target="_blank">${file}</a></p>`;
    });

    res.send(html);
  });
});

// ✅ Auth route
app.use("/api/auth/user", require("./Routes/authRoute"));

// ✅ Multer route
app.get("/multer-api", (req, res) => {
  res.json({
    msg: "API is running...",
  });
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
