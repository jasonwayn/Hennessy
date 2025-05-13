// src/components/EditProfileModal.js
import { useState, useCallback } from "react";
import axios from "axios";
import { auth } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";
import Cropper from "react-easy-crop";
import Slider from "@mui/material/Slider";
import { getCroppedImg } from "../utils/cropImageCircle";

function EditProfileModal({ onClose, currentNickname, currentBio, onUpdate }) {
  const [nickname, setNickname] = useState(currentNickname);
  const [bio, setBio] = useState(currentBio || "");
  const [error, setError] = useState("");
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const validateNickname = (value) => /^[\uAC00-\uD7A3a-zA-Z0-9]{2,32}$/.test(value);

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImageSrc(reader.result);
      reader.readAsDataURL(file);
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
      let imageUrl = null;

      if (imageSrc && croppedAreaPixels) {
        const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
        const storageRef = ref(storage, `profile_images/${user.uid}_${Date.now()}`);
        await uploadBytes(storageRef, croppedBlob);
        imageUrl = await getDownloadURL(storageRef);

        await axios.post(
          "/api/me/profile-image",
          { image_url: imageUrl },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      await axios.put(
        "/api/mypage/profile",
        { nickname, bio },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      onUpdate(nickname, bio, imageUrl);
      onClose();
    } catch (err) {
      console.error(err);
      setError("프로필 수정 실패");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded w-[90vw] max-w-xl shadow relative">
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

        <label className="block text-sm font-medium mb-1">프로필 이미지</label>
        <input type="file" accept="image/*" onChange={handleImageUpload} className="mb-3" />

        {imageSrc && (
          <div className="relative w-full h-64 bg-gray-200 mb-4">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={onCropComplete}
            />
          </div>
        )}

        {imageSrc && (
          <div className="flex justify-between items-center mb-4">
            <label className="text-sm">Zoom</label>
            <Slider min={1} max={3} step={0.1} value={zoom} onChange={(e, v) => setZoom(v)} className="w-3/4" />
          </div>
        )}

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
