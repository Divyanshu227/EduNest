import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export async function uploadToCloudinary(file: File, folder: string) {
  const buffer = Buffer.from(await file.arrayBuffer());

  return new Promise<{ secure_url: string; public_id: string; resource_type: string; format?: string }>((resolve, reject) => {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const resourceType = isPdf ? 'raw' : 'auto';
    
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Cloudinary upload failed'));
          return;
        }

        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });
}

export default cloudinary;