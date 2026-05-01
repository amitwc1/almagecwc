const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'gec_alumni/profiles',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }],
  },
});

const eventStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'gec_alumni/events',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    transformation: [{ width: 1000, height: 600, crop: 'limit' }],
  },
});

const messageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'gec_alumni/messages',
    allowed_formats: ['jpg', 'png', 'jpeg', 'pdf', 'mp3', 'wav', 'ogg'],
    resource_type: 'auto',
  },
});

const resumeStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'gec_alumni/resumes',
    allowed_formats: ['pdf', 'doc', 'docx'],
    resource_type: 'auto',
  },
});

module.exports = {
  cloudinary,
  profileStorage,
  eventStorage,
  messageStorage,
  resumeStorage
};
