// src/utils/cropImage.js
export const getCroppedImg = (imageSrc, croppedAreaPixels, rotation = 0) => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.crossOrigin = "anonymous"; // to handle CORS issues if needed

    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const maxSize = Math.max(image.width, image.height);
      const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

      canvas.width = safeArea;
      canvas.height = safeArea;

      ctx.translate(safeArea / 2, safeArea / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-safeArea / 2, -safeArea / 2);
      ctx.drawImage(
        image,
        (safeArea - image.width) / 2,
        (safeArea - image.height) / 2
      );

      const data = ctx.getImageData(0, 0, safeArea, safeArea);

      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      ctx.putImageData(
        data,
        Math.round(-croppedAreaPixels.x),
        Math.round(-croppedAreaPixels.y)
      );

      canvas.toBlob((blob) => {
        if (!blob) return reject("Blob 생성 실패");
        resolve(blob);
      }, "image/jpeg");
    };

    image.onerror = () => reject("이미지를 불러올 수 없습니다.");
  });
};
