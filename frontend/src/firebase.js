// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";             
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCi537-7TBXyTIb9qaUzWPtVs9wlnN01qE",
  authDomain: "hennessy-7faf2.firebaseapp.com",
  projectId: "hennessy-7faf2",
  storageBucket: "hennessy-7faf2.firebasestorage.app",
  messagingSenderId: "801719946609",
  appId: "1:801719946609:web:d613ad76d4434076cbfad0",
  measurementId: "G-41JBSMJ0QQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
