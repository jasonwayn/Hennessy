// src/components/ChangePasswordModal.js
import { useState } from "react";
import { auth } from "../firebase";
import {
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
} from "firebase/auth";
import ConfirmModal from "./ConfirmModal";
import AlertModal from "./AlertModal";

function ChangePasswordModal({ onClose }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordAgain, setNewPasswordAgain] = useState("");
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const handleChange = async () => {
    setError("");

    if (newPassword !== newPasswordAgain) {
      return setError("새 비밀번호가 일치하지 않습니다.");
    }
    if (newPassword.length < 6) {
      return setError("비밀번호는 최소 6자 이상이어야 합니다.");
    }

    try {
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      setShowConfirm(true);
    } catch (err) {
      console.error(err);
      setError("현재 비밀번호가 일치하지 않습니다.");
    }
  };

  const confirmPasswordChange = async () => {
    try {
      const user = auth.currentUser;
      await updatePassword(user, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordAgain("");
      setAlertMessage("비밀번호가 성공적으로 변경되었습니다.");
      setShowAlert(true);
      setShowConfirm(false);
    } catch (err) {
      console.error(err);
      setAlertMessage("비밀번호 변경 실패: " + err.message);
      setShowAlert(true);
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
        <h2 className="text-lg font-bold mb-4">비밀번호 변경</h2>
        <input
          type="password"
          placeholder="현재 비밀번호"
          className="w-full border p-2 rounded mb-2"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="새 비밀번호"
          className="w-full border p-2 rounded mb-2"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="새 비밀번호 확인"
          className="w-full border p-2 rounded mb-2"
          value={newPasswordAgain}
          onChange={(e) => setNewPasswordAgain(e.target.value)}
        />
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        <button
          onClick={handleChange}
          className="w-full bg-blue-600 text-white p-2 rounded"
        >
          변경하기
        </button>

        <ConfirmModal
          isOpen={showConfirm}
          title="비밀번호 변경"
          description="정말 비밀번호를 변경하시겠습니까?"
          onConfirm={confirmPasswordChange}
          onCancel={() => setShowConfirm(false)}
        />

        <AlertModal
          isOpen={showAlert}
          title="알림"
          description={alertMessage}
          onClose={() => {
            setShowAlert(false);
            if (alertMessage.includes("성공적으로")) onClose();
          }}
        />
      </div>
    </div>
  );
}

export default ChangePasswordModal;
