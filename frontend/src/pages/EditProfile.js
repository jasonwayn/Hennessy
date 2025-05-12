// src/pages/EditProfile.js
import { useState } from "react";
import { storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";

function EditProfile() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      console.log("📁 파일 선택됨:", selected.name);
    } else {
      console.log("❌ 파일이 선택되지 않음");
    }
  };

  const handleUpload = async () => {
    console.log("✅ handleUpload 실행됨");
    console.log("👤 user:", user);
    console.log("📁 file:", file);

    if (!file || !user) {
      alert("파일 또는 사용자 정보가 없습니다.");
      return;
    }

    try {
      const filePath = `profile_images/${user.uid}_${encodeURIComponent(file.name)}`;
      const storageRef = ref(storage, filePath);

      console.log("🚀 Firebase Storage에 업로드 시도 중:", filePath);
      await uploadBytes(storageRef, file);
      console.log("✅ Storage 업로드 성공");

      const downloadURL = await getDownloadURL(storageRef);
      console.log("🔗 다운로드 URL:", downloadURL);

      const token = await user.getIdToken();

      const response = await axios.post(
        "/api/me/profile-image",
        { image_url: downloadURL },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("✅ 백엔드 저장 완료:", response.data);
      alert("업로드 완료!");
    } catch (err) {
      console.error("❌ 업로드 실패:", err);
      alert("프로필 이미지 업로드 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">프로필 수정</h2>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      {preview && <img src={preview} alt="미리보기" className="w-40 mt-4 rounded" />}
      <button
        onClick={() => {
          console.log("🔘 업로드 버튼 클릭됨");
          handleUpload();
        }}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        업로드
      </button>
    </div>
  );
}

export default EditProfile;
