const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: "pdf/",
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const pdfUploader = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const supportedDocuments = /pdf/;
    const extension = path.extname(file.originalname);

    if (supportedDocuments.test(extension)) {
      cb(null, true);
    } else {
      cb(new Error("Must be a pdf file"));
    }
  },
  limits: {
    fileSize: 5000000,
  },
});

module.exports = pdfUploader;
