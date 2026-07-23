const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { Storage } = require("@google-cloud/storage");

const bucketName = process.env.GCS_BUCKET_NAME;
let storageClient;
if (bucketName) {
  const storageOptions = {};
  if (process.env.GCS_KEY_FILE) {
    storageOptions.keyFilename = process.env.GCS_KEY_FILE;
  }
  storageClient = new Storage(storageOptions);
}

const memoryStorage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const multerInstance = multer({
  storage: memoryStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const uploadSingle = (fieldName) => {
  const single = multerInstance.single(fieldName);

  return (req, res, next) => {
    single(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      if (!req.file) {
        return next();
      }

      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(req.file.originalname);
      const filename = `${req.file.fieldname}-${uniqueSuffix}${ext}`;

      if (bucketName) {
        try {
          const bucket = storageClient.bucket(bucketName);
          const blob = bucket.file(filename);
          const blobStream = blob.createWriteStream({
            resumable: false,
            metadata: {
              contentType: req.file.mimetype,
            },
          });

          blobStream.on("error", (streamErr) => {
            console.error("GCS upload error:", streamErr);
            return res.status(500).json({ message: "Failed to upload file to Cloud Storage" });
          });

          blobStream.on("finish", () => {
            req.file.filename = `https://storage.googleapis.com/${bucketName}/${filename}`;
            next();
          });

          blobStream.end(req.file.buffer);
        } catch (gcsErr) {
          console.error("GCS setup error:", gcsErr);
          return res.status(500).json({ message: "Failed to initialize Cloud Storage upload" });
        }
      } else {
        // Local fallback: write buffer to disk
        const localDir = path.join(__dirname, "../uploads");
        if (!fs.existsSync(localDir)) {
          fs.mkdirSync(localDir, { recursive: true });
        }

        const localPath = path.join(localDir, filename);
        fs.writeFile(localPath, req.file.buffer, (writeErr) => {
          if (writeErr) {
            console.error("Local write error:", writeErr);
            return res.status(500).json({ message: "Failed to save file locally" });
          }
          req.file.filename = filename;
          next();
        });
      }
    });
  };
};

module.exports = {
  single: uploadSingle,
};
