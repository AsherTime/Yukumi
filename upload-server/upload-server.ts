// upload-server.ts
import express from "express";
import multer from "multer";
import sharp from "sharp";
import ImageKit from "imagekit";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const upload = multer();

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
});

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { quality, width, height, folder } = req.body;

    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const processed = await sharp(req.file.buffer)
      .resize(parseInt(width) || 1920, parseInt(height) || 1080, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: parseInt(quality) || 80 })
      .toBuffer();

    const filename = `${uuidv4()}.webp`;

    const result = await imagekit.upload({
      file: processed,
      fileName: filename,
      folder: `/uploads/${folder}`,
    });

    res.json({ url: result.url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Upload failed" });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Upload server running on port ${port}`);
});
