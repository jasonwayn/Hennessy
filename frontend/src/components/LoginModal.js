// LoginModal.jsx
import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AlertModal from "./AlertModal";
import ConfirmModal from "./ConfirmModal";

function LoginModal({ onClose }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");
  const [nickname, setNickname] = useState("");
  const [alert, setAlert] = useState({ open: false, message: "" });
  const [confirm, setConfirm] = useState({ open: false });
  const navigate = useNavigate();

  const resetFields = () => {
    setEmail("");
    setPassword("");
    setPasswordAgain("");
    setNickname("");
  };

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onClose();
    } catch (error) {
      console.error(error);
      setAlert({ open: true, message: "로그인 실패: " + error.message });
    }
  };

  const handleSignup = async () => {
    if (password !== passwordAgain) {
      setAlert({ open: true, message: "비밀번호가 일치하지 않습니다." });
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();

      await axios.post("/api/auth/register", {}, {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      await axios.post("/api/register", { nickname }, {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      onClose();
      navigate("/mypage");
    } catch (error) {
      console.error(error);
      setAlert({ open: true, message: "회원가입 실패: " + error.message });
    }
  };

  const handleResetPassword = () => {
    setConfirm({
      open: true,
      title: "비밀번호 재설정",
      description: "비밀번호 재설정 링크를 받을 이메일을 입력해주세요:",
      onConfirm: async () => {
        try {
          await sendPasswordResetEmail(auth, email);
          setAlert({ open: true, message: "재설정 링크를 전송했습니다." });
        } catch (error) {
          console.error(error);
          setAlert({ open: true, message: "메일 전송 실패: " + error.message });
        }
        setConfirm({ open: false });
      },
      onCancel: () => setConfirm({ open: false }),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded w-96 shadow relative">
        <button onClick={onClose} className="absolute top-2 right-3 text-gray-500 hover:text-black">✕</button>

        <div className="flex justify-around mb-4">
          <button
            onClick={() => {
              setMode("login");
              resetFields();
            }}
            className={`px-4 py-2 ${mode === "login" ? "font-bold border-b-2 border-black" : "text-gray-400"}`}
          >
            로그인
          </button>
          <button
            onClick={() => {
              setMode("signup");
              resetFields();
            }}
            className={`px-4 py-2 ${mode === "signup" ? "font-bold border-b-2 border-black" : "text-gray-400"}`}
          >
            회원가입
          </button>
        </div>

        <input
          type="email"
          placeholder="이메일"
          className="w-full border p-2 mb-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="비밀번호"
          className="w-full border p-2 mb-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {mode === "signup" && (
          <>
            <input
              type="password"
              placeholder="비밀번호 확인"
              className="w-full border p-2 mb-2 rounded"
              value={passwordAgain}
              onChange={(e) => setPasswordAgain(e.target.value)}
            />
            <input
              type="text"
              placeholder="닉네임"
              className="w-full border p-2 mb-4 rounded"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </>
        )}

        <button
          onClick={mode === "login" ? handleLogin : handleSignup}
          className="w-full bg-blue-600 text-white p-2 rounded"
        >
          {mode === "login" ? "로그인" : "회원가입"}
        </button>

        {mode === "login" && (
          <p
            className="text-xs mt-3 text-right text-blue-500 hover:underline cursor-pointer"
            onClick={handleResetPassword}
          >
            비밀번호를 잊으셨나요?
          </p>
        )}
      </div>

      <AlertModal
        isOpen={alert.open}
        title="알림"
        description={alert.message}
        onClose={() => setAlert({ open: false, message: "" })}
      />

      <ConfirmModal
        isOpen={confirm.open}
        title={confirm.title}
        description={confirm.description}
        onConfirm={confirm.onConfirm}
        onCancel={confirm.onCancel}
      />
    </div>
  );
}

export default LoginModal;
