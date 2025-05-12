import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { getToken } from "../utils/getToken";
import { useAuth } from "../contexts/AuthContext";

function NewsDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [news, setNews] = useState(null);
  const [isAuthor, setIsAuthor] = useState(false);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await axios.get(`/api/news/${id}`);
        setNews(res.data);
      } catch (err) {
        console.error("뉴스 불러오기 실패:", err);
      }
    };

    const checkAuthor = async () => {
      if (!user) return;
      const token = await getToken();
      const res = await axios.get("/api/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsAuthor(res.data && res.data.email === user.email);
    };

    fetchNews();
    checkAuthor();
  }, [id, user]);

  const handleDelete = async () => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      const token = await getToken();
      await axios.delete(`/api/news/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("삭제 완료");
      navigate("/news");
    } catch (err) {
      console.error("삭제 실패:", err);
      alert("삭제 중 오류 발생");
    }
  };

  if (!news) return <div className="p-6">로딩 중...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* 제목 */}
      <h1 className="text-3xl font-bold mb-2">{news.title}</h1>

      {/* 구분선 */}
      <hr className="border-t border-gray-300 mb-3" />

      {/* 요약 */}
      <p className="text-lg text-gray-700 mb-2">{news.summary}</p>

      {/* 작성자 정보 */}
      <div className="text-sm text-gray-500 mb-4">
        {news.nickname} · {new Date(news.created_at).toLocaleDateString()}
      </div>

      {/* 이미지 */}
      {news.image_url && (
        <img
          src={news.image_url}
          alt={news.title}
          className="w-full h-64 object-cover rounded mb-6"
        />
      )}

      {/* 본문 */}
      <div className="whitespace-pre-line text-gray-800 mb-6">{news.content}</div>

      {/* 수정/삭제 버튼 */}
      {isAuthor && (
        <div className="flex gap-4">
          <Link to={`/news/edit/${id}`} className="bg-yellow-500 text-white px-4 py-2 rounded">
            수정
          </Link>
          <button
            onClick={handleDelete}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            삭제
          </button>
        </div>
      )}
    </div>
  );
}

export default NewsDetailPage;
