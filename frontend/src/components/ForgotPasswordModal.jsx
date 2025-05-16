// src/components/ForgotPasswordModal.jsx
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import AlertModal from "./AlertModal";

function ForgotPasswordModal({ onClose }) {
  const [email, setEmail] = useState("");
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const handleSubmit = async () => {
    if (!email) {
      setAlertMessage("이메일을 입력해주세요.");
      setAlertOpen(true);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setAlertMessage("비밀번호 재설정 링크를 전송했습니다.");
      setAlertOpen(true);
    } catch (err) {
      console.error(err);
      setAlertMessage("메일 전송 실패: " + err.message);
      setAlertOpen(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded w-96 shadow relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-gray-500 hover:text-black"
        >
          ✕
        </button>
        <h2 className="text-lg font-bold mb-4">비밀번호 재설정</h2>
        <input
          type="email"
          placeholder="이메일 주소"
          className="w-full border p-2 rounded mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          onClick={handleSubmit}
          className="w-full bg-blue-600 text-white p-2 rounded"
        >
          전송
        </button>

        <AlertModal
          isOpen={alertOpen}
          title="알림"
          description={alertMessage}
          onClose={() => {
            setAlertOpen(false);
            if (alertMessage.includes("전송")) onClose();
          }}
        />
      </div>
    </div>
  );
}

export default ForgotPasswordModal;
