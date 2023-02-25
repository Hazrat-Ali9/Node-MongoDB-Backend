const { google } = require("googleapis");
const fs = require("fs");

exports.authenticateGoogle = () => {
  const auth = new google.auth.GoogleAuth({
    keyFile: `${__dirname}/../jobs-portal-saminravi99-42d2fb0d6571.json`,
    scopes: "https://www.googleapis.com/auth/drive",
  });
  return auth;
};

exports.uploadToGoogleDrive = async (file, auth) => {
  const fileMetadata = {
    name: file.originalname,
    parents: [`${process.env.GOOGLE_DRIVE_FOLDER_ID}`], // Change it according to your desired parent folder id
  };

  const media = {
    mimeType: file.mimetype,
    body: fs.createReadStream(file.path),
  };

  const driveService = google.drive({ version: "v3", auth });

  const response = await driveService.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: "id",
  });
  return response;
};

exports.deleteFile = (filePath) => {
  fs.unlink(filePath, (err) => {
    if (err) {
      console.log(err);
    }
    console.log("file deleted");
  });
};

// 1_nWc3f3sMIsmne1nnqEwdjMk6s_QUR_c
// 1_nWc3f3sMIsmne1nnqEwdjMk6s_QUR_c
// resume.data.id
// https://drive.google.com/file/d/${resume.data.id}/view
