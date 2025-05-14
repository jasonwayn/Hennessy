// src/components/ImageCropUploader.jsx
import { useState } from "react";
import Cropper from "react-easy-crop";
import Slider from "@mui/material/Slider";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";
import { v4 as uuidv4 } from "uuid";
import { getCroppedImg as cropRect } from "../utils/cropImage";
import { getCroppedImg as cropCircle } from "../utils/cropImageCircle";

function ImageCropUploader({
  storagePath = "uploads",
  aspect = 1,
  cropShape = "rect",
  onComplete,
}) {
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result);
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (_, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  };

  const handleUpload = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setUploading(true);
    try {
      const cropFn = cropShape === "round" ? cropCircle : cropRect;
      const croppedBlob = await cropFn(imageSrc, croppedAreaPixels, rotation);
      const fileRef = ref(storage, `${storagePath}/${uuidv4()}.jpg`);
      await uploadBytes(fileRef, croppedBlob);
      const url = await getDownloadURL(fileRef);
      onComplete(url);
      setImageSrc(null); // 초기화
    } catch (err) {
      console.error("이미지 업로드 실패:", err);
      alert("업로드 실패");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <input type="file" accept="image/*" onChange={handleImageChange} />

      {imageSrc && (
        <>
          <div className="relative w-full h-64 bg-gray-200">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspect}
              cropShape={cropShape}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={handleCropComplete}
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="text-sm">Zoom</label>
            <Slider
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e, v) => setZoom(v)}
              className="w-3/4"
            />
          </div>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            {uploading ? "업로드 중..." : "자르기 및 업로드"}
          </button>
        </>
      )}
    </div>
  );
}

export default ImageCropUploader;
