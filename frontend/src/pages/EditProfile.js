// src/pages/EditProfile.js
import { useState } from "react";
import { storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "../contexts/AuthContext";

function EditProfile() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleUpload = async () => {
    if (!file || !user) return;
    const storageRef = ref(storage, `profile_images/${user.uid}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    // 🔽 백엔드에 다운로드 URL 저장 요청 (optional)
    const token = await user.getIdToken();
    await fetch("/api/me/profile-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ image_url: downloadURL }),
    });

    alert("업로드 완료!");
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">프로필 수정</h2>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      {preview && <img src={preview} alt="미리보기" className="w-40 mt-4" />}
      <button
        onClick={handleUpload}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        업로드
      </button>
    </div>
  );
}

export default EditProfile;
