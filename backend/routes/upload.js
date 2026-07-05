const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const upload = require("../middleware/upload");
const cloudinary = require("../config/cloudinary");
const User = require("../models/User");

// Multer middleware — parses multipart and uploads to Cloudinary
const cpUpload = upload.fields([
    { name: "song", maxCount: 1 },
    { name: "image", maxCount: 1 },
]);

router.post(
    "/",
    (req, res, next) => {
        console.log("Upload route: incoming upload request");
        cpUpload(req, res, (err) => {
            if (err) {
                console.error("Upload route: multer error:", err.message || err);
                return res.status(400).json({
                    success: false,
                    message: err.message || "Upload failed",
                });
            }
            console.log("Upload route: multer OK — files received");
            next();
        });
    },
    async (req, res) => {
        try {
            const songFile = req.files?.song?.[0];
            const imageFile = req.files?.image?.[0];

            console.log("Upload route: songFile =", songFile?.path || "none");
            console.log("Upload route: imageFile =", imageFile?.path || "none");

            if (!songFile && !imageFile) {
                return res.status(400).json({
                    success: false,
                    message: "No file provided. Upload a song and/or image.",
                });
            }

            const songUrl = songFile && songFile.path ? songFile.path : "";
            const imageUrl = imageFile && imageFile.path ? imageFile.path : "";

            console.log("Upload route: Cloudinary songUrl =", songUrl);
            console.log("Upload route: Cloudinary imageUrl =", imageUrl);

            return res.json({
                success: true,
                songUrl,
                imageUrl,
            });
        } catch (err) {
            console.error("Upload route error:", err.message || err);
            return res.status(500).json({
                success: false,
                message: err.message || "Upload failed",
            });
        }
    }
);

// Upload a local file from a Windows path to Cloudinary
router.post("/from-path", async (req, res) => {
    try {
        const { adminEmail, filePath } = req.body;
        console.log("Upload from-path request:", { adminEmail, filePath });

        if (!adminEmail || !filePath) {
            return res.status(400).json({ success: false, message: "Admin email and file path are required" });
        }

        const admin = await User.findOne({ email: adminEmail, adminStatus: { $in: ["approved", "leader"] } });
        if (!admin) {
            return res.status(403).json({ success: false, message: "Only approved admins can upload files" });
        }

        if (!fs.existsSync(filePath)) {
            console.log("Upload from-path: file not found at", filePath);
            return res.status(404).json({ success: false, message: "File not found at the given path" });
        }

        const ext = path.extname(filePath).toLowerCase();
        const imageExts = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
        const isImage = imageExts.includes(ext);

        console.log("Upload from-path: uploading to Cloudinary...");
        const result = await cloudinary.uploader.upload(filePath, {
            folder: isImage ? "music-images" : "music-songs",
            resource_type: isImage ? "image" : "video",
        });

        console.log("Upload from-path: Cloudinary result:", result.secure_url);
        res.json({
            success: true,
            url: result.secure_url,
            isImage,
        });
    } catch (err) {
        console.error("Upload from-path error:", err.message || err);
        res.status(500).json({ success: false, message: err.message || "Upload failed" });
    }
});

module.exports = router;
