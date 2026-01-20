'use server';
import { v2 as cloudinary } from 'cloudinary';
import { protectedAction } from '@/lib/safe-action';

const handleCloudinarySignature = protectedAction(async () => {
  const timestamp = Math.round(new Date().getTime() / 1000);
  try {
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp: timestamp,
        folder: 'vynk_profilePic', // Optional: Organize in folders
      },
      process.env.CLOUDINARY_API_SECRET!,
    );
    return { success: true, response: { signature, timestamp } };
  } catch (err) {
    return { success: false, response: { signature: null, error: `${err}` } };
  }
});

export { handleCloudinarySignature };
