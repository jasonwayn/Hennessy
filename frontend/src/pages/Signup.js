// src/pages/Signup.js
import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";  // firebase.js 경로 확인

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert("회원가입 성공!");
      // 성공하면 로그인 페이지 이동 가능
    } catch (error) {
      console.error(error);
      alert("회원가입 실패: " + error.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h2 className="text-2xl font-bold mb-4">회원가입</h2>
      <input
        type="email"
        placeholder="이메일"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border rounded p-2 mb-2 w-72"
      />
      <input
        type="password"
        placeholder="비밀번호"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border rounded p-2 mb-4 w-72"
      />
      <button
        onClick={handleSignup}
        className="bg-green-500 text-white px-4 py-2 rounded w-72"
      >
        회원가입
      </button>
    </div>
  );
}

export default Signup;
    