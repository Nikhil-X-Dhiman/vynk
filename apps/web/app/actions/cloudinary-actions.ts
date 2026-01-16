import { v2 as cloudinary } from 'cloudinary';
import { env } from 'process';

function handleCloudinarySignature() {
  const timestamp = Math.round(new Date().getTime() / 1000);
  try {
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp: timestamp,
        folder: 'vynk_avatars', // Optional: Organize in folders
      },
      env.CLOUDINARY_API_SECRET!
    );
    return { success: true, response: { signature, timestamp } };
  } catch (err) {
    return { success: false, response: { signature: null, error: `${err}` } };
  }
}

export { handleCloudinarySignature };
