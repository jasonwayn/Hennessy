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
import ForgotPasswordModal from "./ForgotPasswordModal";

function LoginModal({ onClose }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");
  const [nickname, setNickname] = useState("");
  const [alert, setAlert] = useState({ open: false, message: "" });
  const [confirm, setConfirm] = useState({ open: false });
  const navigate = useNavigate();
  const [showForgotModal, setShowForgotModal] = useState(false);

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
      let message = "로그인에 실패했습니다.";
      if (error.code === "auth/user-not-found") {
        message = "존재하지 않는 사용자입니다.";
      } else if (error.code === "auth/wrong-password") {
        message = "비밀번호가 올바르지 않습니다.";
      } else if (error.code === "auth/invalid-email") {
        message = "유효하지 않은 이메일입니다.";
      }
      setAlert({ open: true, message });
    }
  };

  const handleSignup = async () => {
    if (!email.includes("@") || !email.includes(".")) {
      return setAlert({ open: true, message: "유효하지 않은 이메일입니다." });
    }

    if (password.length < 6) {
      return setAlert({ open: true, message: "비밀번호는 최소 6자 이상이어야 합니다." });
    }

    if (password !== passwordAgain) {
      return setAlert({ open: true, message: "비밀번호 확인과 일치하지 않습니다." });
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
      let message = "회원가입에 실패했습니다.";
      if (error.code === "auth/email-already-in-use") {
        message = "이미 사용 중인 이메일입니다.";
      } else if (error.code === "auth/invalid-email") {
        message = "유효하지 않은 이메일입니다.";
      } else if (error.code === "auth/weak-password") {
        message = "비밀번호는 최소 6자 이상이어야 합니다.";
      }
      setAlert({ open: true, message });
    }
  };

  const handleResetPassword = () => {
    setShowForgotModal(true);
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

      {alertOpen && (
        <AlertModal
          isOpen={true}
          title="알림"
          description={alertMessage || "오류가 발생했습니다."}
          onClose={() => {
            setAlertOpen(false);
            if (alertMessage.includes("전송")) {
              setEmail(""); // 입력 필드 초기화
              onClose(); // 모달 닫기
            }
          }}
        />
      )}

      <ConfirmModal
        isOpen={confirm.open}
        title={confirm.title}
        description={confirm.description}
        onConfirm={confirm.onConfirm}
        onCancel={confirm.onCancel}
      />
      {showForgotModal && (
        <ForgotPasswordModal onClose={() => setShowForgotModal(false)} />
      )}
    </div>
  );
}

export default LoginModal;
