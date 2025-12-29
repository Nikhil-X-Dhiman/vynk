import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

// You can configure the Cloudinary instance here if needed
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default cloudinary;
export type { UploadApiResponse };
