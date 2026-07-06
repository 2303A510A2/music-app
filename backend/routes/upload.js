const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const { Readable } = require("stream");

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

const cpUpload = memoryUpload.fields([
  { name: "song", maxCount: 1 },
  { name: "image", maxCount: 1 },
]);

function uploadBuffer(buffer, folder, resourceType) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
}

router.post("/", (req, res, next) => {
  cpUpload(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "Upload failed",
      });
    }
    next();
  });
}, async (req, res) => {
  try {
    const songFile = req.files?.song?.[0];
    const imageFile = req.files?.image?.[0];

    if (!songFile && !imageFile) {
      return res.status(400).json({
        success: false,
        message: "No file provided. Upload a song and/or image.",
      });
    }

    let songUrl = "";
    let imageUrl = "";

    if (songFile) {
      const result = await uploadBuffer(songFile.buffer, "music-songs", "video");
      songUrl = result.secure_url;
    }

    if (imageFile) {
      const result = await uploadBuffer(imageFile.buffer, "music-images", "image");
      imageUrl = result.secure_url;
    }

    return res.json({ success: true, songUrl, imageUrl });
  } catch (err) {
    console.error("Upload route error:", err.message || err);
    return res.status(500).json({
      success: false,
      message: err.message || "Upload failed",
    });
  }
});

module.exports = router;
