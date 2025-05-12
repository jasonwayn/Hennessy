// src/pages/NewsEditPage.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { getToken } from "../utils/getToken";
import { useAuth } from "../contexts/AuthContext";

function NewsEditPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    if (!user) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    if (isEdit) {
      axios
        .get(`/api/news/${id}`)
        .then((res) => {
          const n = res.data;
          setTitle(n.title);
          setSummary(n.summary || "");
          setContent(n.content);
          setImageUrl(n.image_url || "");
        })
        .catch(() => {
          alert("뉴스 정보를 불러올 수 없습니다.");
          navigate("/news");
        });
    }
  }, [id, isEdit, user, navigate]);

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
        alert("뉴스 수정 완료");
        navigate(`/news/${id}`);
      } else {
        const res = await axios.post(`/api/news`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("뉴스 등록 완료");
        navigate(`/news/${res.data.news_id}`);
      }
    } catch (err) {
      console.error("저장 실패:", err);
      alert("오류 발생");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">{isEdit ? "뉴스 수정" : "뉴스 등록"}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />
        <input
          type="text"
          placeholder="요약 (1~2문장)"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />
        <input
          type="text"
          placeholder="이미지 URL"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />
        {imageUrl && (
          <img
            src={imageUrl}
            alt="미리보기"
            className="w-full h-64 object-cover rounded mb-2"
          />
        )}
        <textarea
          placeholder="내용"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          className="w-full border px-3 py-2 rounded"
        ></textarea>
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
