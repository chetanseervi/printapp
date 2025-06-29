import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  // Replace these values with your Firebase config
  apiKey: "AIzaSyCwdpIzfJz7Iwhbqswe7p9xMkrPp5xZBZY",
  authDomain: "shop-e403e.firebaseapp.com",
  projectId: "shop-e403e",
  storageBucket: "shop-e403e.appspot.com",
  messagingSenderId: "575791621719",
  appId: "1:575791621719:web:49110af4f98244f5c06512",
  measurementId: "G-89NJ2FPQPE"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export async function uploadToCloudinary(file: File) {
  const url = `https://api.cloudinary.com/v1_1/<your-cloud-name>/raw/upload`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', '<your-upload-preset>');

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });
  const data = await response.json();
  return data.secure_url;
} 