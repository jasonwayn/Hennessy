// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage"; // 프로필 이미지 업로드용

const firebaseConfig = {
  apiKey: "AIzaSyAAjXEHMKk3iYqWBbHZNHbGgJBhWH-MVdA",
  authDomain: "hennessy-4ef47.firebaseapp.com",
  projectId: "hennessy-4ef47",
  storageBucket: "hennessy-4ef47.appspot.com",  // ← storage URL 수정 필요!
  messagingSenderId: "952749548267",
  appId: "1:952749548267:web:c36fe9ca7d8e945fad14ae",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const storage = getStorage(app); // 이거 이제 프로필 이미지 업로드에 쓸 수 있음


