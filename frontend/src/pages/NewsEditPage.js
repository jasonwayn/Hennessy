import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { getToken } from "../utils/getToken";
import { useAuth } from "../contexts/AuthContext";
import { useLoginModal } from "../contexts/LoginModalContext";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import ImageCropUploader from "../components/ImageCropUploader";

function NewsEditPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openLoginModal } = useLoginModal();

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    if (!user) {
      alert("로그인이 필요합니다.");
      openLoginModal();
      return;
    }

    if (isEdit) {
      (async () => {
        try {
          const token = await getToken();
          const res = await axios.get(`/api/news/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const news = res.data;

          if (news.email && news.email !== user.email) {
            alert("수정 권한이 없습니다.");
            navigate("/news");
            return;
          }

          setTitle(news.title);
          setSummary(news.summary || "");
          setContent(news.content);
          setImageUrl(news.image_url || "");
        } catch (err) {
          alert("뉴스 정보를 불러올 수 없습니다.");
          navigate("/news");
        }
      })();
    }
  }, [id, isEdit, user, navigate, openLoginModal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim() || !content.trim()) {
      alert("제목, 요약, 내용을 모두 입력해주세요.");
      return;
    }

    try {
      const token = await getToken();
      const payload = {
        title,
        summary,
        content,
        image_url: imageUrl,
      };

      if (isEdit) {
        await axios.put(`/api/news/${id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        navigate(`/news/${id}`);
      } else {
        const res = await axios.post(`/api/news`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        navigate(`/news/${res.data.news_id}`);
      }
    } catch (err) {
      console.error("저장 실패:", err);
      alert("오류 발생");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">{isEdit ? "" : "뉴스 등록"}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-semibold">제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        <div>
          <label className="block mb-1 font-semibold">요약</label>
          <input
            type="text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        <div>
          <label className="block mb-1 font-semibold">이미지 업로드</label>
          <ImageCropUploader
            storagePath="news"
            aspect={16 / 9}
            cropShape="rect"
            onComplete={(url) => setImageUrl(url)}
          />
          {imageUrl && (
            <img
              src={imageUrl}
              alt="미리보기"
              className="w-full h-64 object-cover rounded mt-2"
            />
          )}
        </div>


        <div>
          <label className="block mb-1 font-semibold">내용</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded"
        >
          {isEdit ? "수정 완료" : "등록"}
        </button>
      </form>
    </div>
  );
}

export default NewsEditPage;
