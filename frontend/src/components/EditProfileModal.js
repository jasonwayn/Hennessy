import { useState } from "react";
import axios from "axios";
import { auth } from "../firebase";
import { storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

function EditProfileModal({ onClose, currentNickname, currentBio, onUpdate }) {
  const [nickname, setNickname] = useState(currentNickname);
  const [bio, setBio] = useState(currentBio || "");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [error, setError] = useState("");

  const validateNickname = (value) => /^[\uAC00-\uD7A3a-zA-Z0-9]{2,32}$/.test(value);

  const handleUpload = async () => {
    if (!selectedFile) return alert("파일을 선택하세요.");
    try {
      const user = auth.currentUser;
      const storageRef = ref(storage, `profile_images/${user.uid}_${selectedFile.name}`);
      await uploadBytes(storageRef, selectedFile);
      const downloadURL = await getDownloadURL(storageRef);
      setUploadedImage(downloadURL);
      alert("이미지 업로드 성공");
    } catch (err) {
      console.error("이미지 업로드 실패:", err);
      alert("업로드 실패");
    }
  };

  const handleSubmit = async () => {
    if (!validateNickname(nickname)) {
      return setError("닉네임은 2~32자, 한글/영어/숫자만 허용됩니다.");
    }
    if (bio.length > 100) {
      return setError("Bio는 최대 100자까지 가능합니다.");
    }

    try {
      const user = auth.currentUser;
      if (!user) return setError("로그인이 필요합니다.");

      const token = await user.getIdToken();

      await axios.put(
        "/api/mypage/profile",
        { nickname, bio },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (uploadedImage) {
        await axios.post(
          "/api/me/profile-image",
          { image_url: uploadedImage },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      onUpdate(nickname, bio, uploadedImage);
      onClose();
    } catch (err) {
      console.error(err);
      setError("프로필 수정 실패");
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
        <h2 className="text-lg font-bold mb-4">프로필 수정</h2>

        <label className="text-sm font-medium">닉네임</label>
        <input
          type="text"
          className="w-full border p-2 rounded mb-3"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />

        <label className="text-sm font-medium">Bio</label>
        <textarea
          className="w-full border p-2 rounded mb-3"
          maxLength={100}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />

        <label className="text-sm font-medium">프로필 사진</label>
        <div className="flex items-center gap-2 mb-3">
          <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} />
          <button
            onClick={handleUpload}
            className="bg-blue-500 text-white px-3 py-1 rounded"
          >
            업로드
          </button>
        </div>

        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

        <button
          onClick={handleSubmit}
          className="w-full bg-blue-600 text-white p-2 rounded"
        >
          저장하기
        </button>
      </div>
    </div>
  );
}

export default EditProfileModal;
