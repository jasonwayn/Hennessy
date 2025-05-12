import { getAuth, onAuthStateChanged } from "firebase/auth";

export const getToken = async () => {
  const auth = getAuth();
  const user = auth.currentUser;

  // 이미 로그인된 경우
  if (user) {
    return await user.getIdToken();
  }

  // 아직 로그인 정보가 초기화되지 않은 경우 대기
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (newUser) => {
      if (newUser) {
        const token = await newUser.getIdToken();
        resolve(token);
      } else {
        resolve(null);
      }
    });
  });
};
