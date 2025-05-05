// src/utils/getToken.js
import { getAuth } from "firebase/auth";

export const getToken = async () => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) return null;

  return await user.getIdToken(); // Firebase JWT 토큰 반환
};
