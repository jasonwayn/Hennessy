// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAAjXEHMKk3iYqWBbHZNHbGgJBhWH-MVdA",
  authDomain: "hennessy-4ef47.firebaseapp.com",
  projectId: "hennessy-4ef47",
  storageBucket: "hennessy-4ef47.firebasestorage.app", // ✅ 꼭 이 이름 확인
  messagingSenderId: "952749548267",
  appId: "1:952749548267:web:c36fe9ca7d8e945fad14ae",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const storage = getStorage(app);
