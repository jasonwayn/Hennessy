import { useRef, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

function UserPage() {
  const [userInfo, setUserInfo] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [ratingsGrouped, setRatingsGrouped] = useState([]);
  const [expandedRatings, setExpandedRatings] = useState({});
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const ratingsRef = useRef(null);
  const reviewsRef = useRef(null);

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await axios.get(`/api/users/${id}`);
        setUserInfo(res.data);
      } catch (err) {
        console.error("❌ 유저 정보 로딩 실패", err);
      }
    };

    const fetchUserReviews = async () => {
      try {
        const res = await axios.get(`/api/users/${id}/reviews`);
        setReviews(res.data);
      } catch (err) {
        console.error("유저 리뷰 로딩 실패", err);
      }
    };

    const fetchRatings = async () => {
      try {
        const res = await axios.get(`/api/users/${id}/ratings/grouped`);
        setRatingsGrouped(res.data);
      } catch (err) {
        console.error("유저 평점 로딩 실패", err);
      }
    };

    Promise.all([fetchUserProfile(), fetchUserReviews(), fetchRatings()])
      .then(() => setLoading(false))
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-center">로딩 중...</div>;
  if (!userInfo) return <div className="p-8 text-center">사용자를 찾을 수 없습니다.</div>;

  return (
    <div className="max-w-6xl mx-auto">
      {/* 상단 프로필 영역 */}
      <div className="bg-[#f9dad6] p-8 mb-10 rounded">
        <div className="flex justify-between items-start">
          {/* 왼쪽: 프로필 이미지 + 닉네임 + 소개 */}
          <div className="flex items-start gap-6">
            {userInfo.profile_image_url && (
              <img
                src={userInfo.profile_image_url}
                alt="프로필 이미지"
                className="w-48 h-48 rounded-full object-cover"
              />
            )}
            <div>
              <p className="text-4xl font-bold">{userInfo.nickname}</p>
              <p className="text-base text-gray-600 whitespace-pre-line mt-2">{userInfo.bio}</p>
            </div>
          </div>

          {/* 오른쪽: 평점/리뷰 버튼 */}
          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={() => scrollToSection(ratingsRef)}
              className="w-28 h-28 bg-white border border-[#f2bfb5] hover:bg-[#f5cfc7] transition rounded-xl shadow-sm flex items-center justify-center text-sm font-medium"
            >
              평점
            </button>
            <button
              onClick={() => scrollToSection(reviewsRef)}
              className="w-28 h-28 bg-white border border-[#f2bfb5] hover:bg-[#f5cfc7] transition rounded-xl shadow-sm flex items-center justify-center text-sm font-medium"
            >
              리뷰
            </button>
          </div>
        </div>
      </div>

      {/* 평점 섹션 */}
      <div ref={ratingsRef} className="mb-10">
        <h3 className="text-xl font-semibold mb-2 border-l-4 pl-2 border-[#db4c3f]">작성한 평점</h3>
        {ratingsGrouped.map((group) => {
          const groupKey = group.rating_group;
          const allAlbums = JSON.parse(group.albums);
          const visibleCount = expandedRatings[groupKey] || 8;
          const visibleAlbums = allAlbums.slice(0, visibleCount);

          return (
            <div key={groupKey} className="mb-4">
              <h4 className="font-bold mb-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full border-4 border-black flex items-center justify-center text-xl font-bold">
                  {groupKey}
                </div>
              </h4>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                {visibleAlbums.map((album) => (
                  <div key={album.slug} className="text-center">
                    <Link to={`/album/${album.artist_slug}/${album.slug}`}>
                      <img
                        src={album.image_url}
                        alt={album.title}
                        className="w-20 h-20 object-cover rounded mx-auto cursor-pointer hover:opacity-80 transition"
                      />
                    </Link>
                    <p className="text-xs mt-1">{album.title}</p>
                    <p className="text-xs text-gray-500">{album.rating}</p>
                  </div>
                ))}
              </div>
              {allAlbums.length > visibleCount && (
                <button
                  onClick={() =>
                    setExpandedRatings((prev) => ({
                      ...prev,
                      [groupKey]: visibleCount + 8,
                    }))
                  }
                  className="mt-2 text-sm bg-gray-100 px-3 py-1 rounded hover:bg-gray-200"
                >
                  더보기
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* 리뷰 섹션 */}
      <div ref={reviewsRef}>
        <h3 className="text-xl font-semibold mb-2 border-l-4 pl-2 border-[#db4c3f]">작성한 리뷰</h3>
        {reviews.map((r) => (
          <Link
            key={r.id}
            to={`/album/${r.artist_slug}/${r.album_slug}#review-${r.id}`}
            className="flex gap-4 border p-4 rounded mb-2 hover:bg-gray-50 transition"
          >
            <img
              src={r.image_url}
              alt={r.album_title}
              className="w-16 h-16 object-cover rounded"
            />
            <div className="flex-1">
              <p className="text-gray-800 mb-1 line-clamp-2">{r.review_text}</p>
              <p className="text-sm text-gray-500">
                {r.artist_name} - {r.album_title}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default UserPage;
