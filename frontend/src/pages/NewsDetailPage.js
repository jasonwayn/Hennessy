import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { getToken } from "../utils/getToken";
import { useAuth } from "../contexts/AuthContext";
import ConfirmModal from "../components/ConfirmModal";

function NewsDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [news, setNews] = useState(null);
  const [isAuthor, setIsAuthor] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await axios.get(`/api/news/${id}`);
        setNews(res.data);
        if (user && res.data.user_email === user.email) {
          setIsAuthor(true);
        }
      } catch (err) {
        console.error("뉴스 불러오기 실패:", err);
      }
    };

    fetchNews();
  }, [id, user]);

  const handleDelete = async () => {
    try {
      const token = await getToken();
      await axios.delete(`/api/news/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate("/news");
    } catch (err) {
      console.error("삭제 실패:", err);
      alert("삭제 중 오류 발생");
    } finally {
      setShowConfirm(false);
    }
  };

  if (!news) return <div className="p-6">로딩 중...</div>;

  return (
    <div className="px-4 sm:px-6 py-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">{news.title}</h1>
      <hr className="border-t border-gray-300 mb-3" />
      <p className="text-lg text-gray-700 mb-2">{news.summary}</p>

    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
      {news.profile_image_url && (
        <img
          src={news.profile_image_url}
          alt={news.nickname}
          className="w-6 h-6 rounded-full object-cover"
        />
      )}
      <Link
        to={`/user/${news.user_id}`}
        className="text-blue-600 font-medium hover:underline"
      >
        {news.nickname}
      </Link>
      <span className="text-gray-400">· {new Date(news.created_at).toLocaleDateString()}</span>
    </div>

      {news.image_url && (
        <img
          src={news.image_url}
          alt={news.title}
          className="w-full aspect-video object-cover rounded mb-6"
        />
      )}

      <div className="whitespace-pre-line text-gray-800 mb-6 leading-relaxed tracking-wide text-base sm:text-lg">
        {news.content}
      </div>

      {isAuthor && (
        <div className="flex justify-end gap-3 mt-6">
          <Link
            to={`/news/edit/${id}`}
            className="px-3 py-1 rounded text-sm border border-blue-600 text-blue-600 hover:bg-blue-50 transition"
          >
            수정
          </Link>
          <button
            onClick={() => setShowConfirm(true)}
            className="px-3 py-1 rounded text-sm border border-red-500 text-red-500 hover:bg-red-50 transition"
          >
            삭제
          </button>
        </div>
      )}

      <ConfirmModal
        isOpen={showConfirm}
        title="정말 삭제하시겠습니까?"
        description="삭제하면 복구할 수 없습니다."
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}

export default NewsDetailPage;
