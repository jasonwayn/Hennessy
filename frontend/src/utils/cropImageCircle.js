// src/utils/cropImageCircle.js
export const getCroppedImg = (imageSrc, pixelCrop, rotation = 0) => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;

      // 원형 클리핑 적용
      ctx.beginPath();
      ctx.arc(
        pixelCrop.width / 2,
        pixelCrop.height / 2,
        pixelCrop.width / 2,
        0,
        2 * Math.PI
      );
      ctx.closePath();
      ctx.clip();

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );

      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error("Canvas is empty"));
        resolve(blob);
      }, "image/jpeg");
    };

    image.onerror = () => reject(new Error("이미지 로딩 실패"));
  });
};
