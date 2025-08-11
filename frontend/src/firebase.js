// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// 🔐 Replace with your actual Firebase config values
const firebaseConfig = {
  apiKey: "AIzaSyC8iQ8sLxbxuIAROCAnpqtVOvDhsipYj_8",
  authDomain: "ml-studio-fdf7d.firebaseapp.com",
  projectId: "ml-studio-fdf7d",
  storageBucket: "ml-studio-fdf7d.firebasestorage.app",
  messagingSenderId: "698235205870",
  appId: "1:698235205870:web:fb176a548331fa7a771bff"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
