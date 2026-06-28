import fs from "fs";
import multer from "multer";
import path from "path";

// Images are saved on local disk under backend/public/uploads and served
// back out via express.static("/uploads", ...) in app.ts. The DB only
// stores the relative path (e.g. "/uploads/1719999-burger.png").
export const UPLOADS_DIR = path.join(__dirname, "..", "..", "public", "uploads");

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

function createUploadMiddleware(fieldName: string) {
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const safeBase = path
        .basename(file.originalname, ext)
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .slice(0, 40);
      cb(null, `${Date.now()}-${safeBase}${ext}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (_req, file, cb) => {
      if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("Only PNG, JPEG, WEBP, or GIF images are allowed."));
      }
    },
  }).single(fieldName);
}

const ALLOWED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"]);

export const uploadFoodImage = createUploadMiddleware("image");
export const uploadInvoiceQrImage = createUploadMiddleware("qr_image");

export function toImagePath(file: Express.Multer.File | undefined): string | undefined {
  return file ? `/uploads/${file.filename}` : undefined;
}
