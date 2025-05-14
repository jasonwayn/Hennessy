import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

function NewsPage() {
  const [topNews, setTopNews] = useState([]);
  const [newsList, setNewsList] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 6;

  useEffect(() => {
    const fetchTopNews = async () => {
      try {
        const res = await axios.get("/api/news/top");
        setTopNews(res.data);
      } catch (err) {
        console.error("인기 뉴스 불러오기 실패:", err);
      }
    };

    const fetchInitialNews = async () => {
      try {
        const res = await axios.get(`/api/news?offset=0`);
        const newNews = res.data;
        if (newNews.length < limit) setHasMore(false);
        setNewsList(newNews);
        setOffset(newNews.length);
      } catch (err) {
        console.error("뉴스 불러오기 실패:", err);
      }
    };

    fetchTopNews();
    fetchInitialNews();
  }, []);

  const fetchMoreNews = async () => {
    try {
      const res = await axios.get(`/api/news?offset=${offset}`);
      const newNews = res.data;
      if (newNews.length < limit) setHasMore(false);
      setNewsList(prev => [...prev, ...newNews]);
      setOffset(prev => prev + newNews.length);
    } catch (err) {
      console.error("뉴스 더 불러오기 실패:", err);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl sm:text-3xl font-bold mb-6">뉴스</h2>

      {/* ✅ 인기 뉴스 레이아웃 */}
      {topNews.length === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* 왼쪽 큰 뉴스 */}
          <Link
            to={`/news/${topNews[0].id}`}
            className="lg:col-span-2 block border rounded overflow-hidden shadow hover:shadow-lg transition duration-300"
          >
            <img
              src={topNews[0].image_url}
              alt={topNews[0].title}
              className="w-full aspect-[16/9] object-cover"
            />
            <div className="p-4">
              <h3 className="text-xl sm:text-2xl font-bold mb-1 line-clamp-2">
                {topNews[0].title}
              </h3>
              <p className="text-sm text-gray-500">
                {new Date(topNews[0].created_at).toLocaleDateString()}
              </p>
            </div>
          </Link>

          {/* 오른쪽 두 개 세로 뉴스 */}
          <div className="flex flex-col gap-6">
            {[topNews[1], topNews[2]].map(news => (
              <Link
                key={news.id}
                to={`/news/${news.id}`}
                className="block border rounded overflow-hidden shadow hover:shadow-md transition duration-300"
              >
                <img
                  src={news.image_url}
                  alt={news.title}
                  className="w-full aspect-video object-cover"
                />
                <div className="p-3">
                  <h3 className="text-base sm:text-lg font-semibold line-clamp-2">
                    {news.title}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {new Date(news.created_at).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-gray-300 my-8" />

      {/* ✅ 최신 뉴스 리스트 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {newsList.map(news => (
          <Link
            key={news.id}
            to={`/news/${news.id}`}
            className="block border rounded overflow-hidden shadow hover:shadow-md transition duration-300"
          >
            <img
              src={news.image_url}
              alt={news.title}
              className="w-full aspect-video object-cover"
            />
            <div className="p-3">
              <h3 className="text-base sm:text-lg font-semibold line-clamp-2">
                {news.title}
              </h3>
              <p className="text-xs text-gray-500">
                {new Date(news.created_at).toLocaleDateString()}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={fetchMoreNews}
          className="block mx-auto px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded shadow"
        >
          더보기
        </button>
      )}
    </div>
  );
}

export default NewsPage;
