import { Cloudinary } from '@cloudinary/url-gen';

// TODO: Move these credentials to environment variables in production
const cloudinary = new Cloudinary({
  cloud: {
    cloudName: 'dz1unto1u',
    apiKey: '229575868218742',
    apiSecret: 'q6dYV-iSBE1tXnWpVDvrP3CqWJ0'
  }
});

export default cloudinary;

export const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'print_shop_uploads');
  formData.append('api_key', '229575868218742');

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/dz1unto1u/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Upload error details:', errorData);
      throw new Error(errorData.error?.message || 'Upload failed');
    }

    const data = await response.json();
    console.log('Upload successful:', data);
    return data.secure_url;
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error('Failed to upload file');
  }
}; 