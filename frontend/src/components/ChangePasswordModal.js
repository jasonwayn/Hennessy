// src/components/ChangePasswordModal.js
import { useState } from "react";
import { auth } from "../firebase";
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "firebase/auth";

function ChangePasswordModal({ onClose }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordAgain, setNewPasswordAgain] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = async () => {
    setError("");
    setSuccess(false);

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
      await updatePassword(user, newPassword);
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordAgain("");
      alert("비밀번호가 변경되었습니다.");
      onClose();
    } catch (err) {
      console.error(err);
      setError("비밀번호 변경 실패: " + err.message);
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
      </div>
    </div>
  );
}

export default ChangePasswordModal;
