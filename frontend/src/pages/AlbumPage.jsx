import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "../utils/getToken";
import { useLoginModal } from "../contexts/LoginModalContext";
import { useAuth } from "../contexts/AuthContext";
import { useLocation } from "react-router-dom";
import AlertModal from "../components/AlertModal";

function AlbumPage() {
  const { artistSlug, albumSlug } = useParams();
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(null);
  const [averageRating, setAverageRating] = useState(null);
  const [songs, setSongs] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState("");
  const [editReviewId, setEditReviewId] = useState(null);
  const [sortOrder, setSortOrder] = useState("likes");
  const { openLoginModal } = useLoginModal();
  const { user } = useAuth();
  const location = useLocation();
  const [ratingCount, setRatingCount] = useState(null);
  const [alertOpen, setAlertOpen] = useState(false);

  // ✅ 앨범 정보 및 내 평점 로딩
  useEffect(() => {
    axios
      .get(`/api/album/${artistSlug}/${albumSlug}`)
      .then((res) => {
        setAlbum(res.data);
        return axios.get(`/api/albums/${res.data.id}/songs`);
      })
      .then((res) => {
        setSongs(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("앨범 또는 수록곡 로딩 실패:", err);
        setLoading(false);
      });

  axios
    .get(`/api/album/${albumSlug}/average-rating`)
    .then((res) => {
      setAverageRating(
        res.data.average != null ? Number(res.data.average) : null
      );
      setRatingCount(
        res.data.count != null ? Number(res.data.count) : 0
      );
    })
    .catch((err) => console.error("평균 평점 로딩 실패:", err));

    const fetchUserRating = async () => {
      const token = await getToken();
      if (!token) return;

      try {
        const res = await axios.get(`/api/album/${albumSlug}/my-rating`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserRating(res.data.rating);
      } catch (err) {
        console.error("내 평점 로딩 실패:", err);
      }
    };

    fetchUserRating();
  }, [artistSlug, albumSlug]);

  // ✅ 리뷰는 로그인 유저가 준비된 후에만 fetch
  useEffect(() => {
    const fetch = async () => {
      await fetchReviews();
    };
    fetch();
  }, [albumSlug, sortOrder, user]);

    useEffect(() => {
    const params = new URLSearchParams(location.search);
    const targetId = params.get("reviewId");

    if (targetId) {
      setTimeout(() => {
        const target = document.getElementById(`review-${targetId}`);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          target.classList.add("ring", "ring-blue-500"); // 강조 효과도 가능
          setTimeout(() => target.classList.remove("ring", "ring-blue-500"), 2000);
        }
      }, 500); // 렌더 완료 이후 실행
    }
  }, [reviews, location.search]);

  useEffect(() => {
  const reviewId = window.location.hash?.split("review-")[1];
  if (reviewId) {
    setTimeout(() => {
      const target = document.getElementById(`review-${reviewId}`);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        target.classList.add("ring", "ring-blue-500");
        setTimeout(() => target.classList.remove("ring", "ring-blue-500"), 2000);
      }
    }, 500);
  }
}, [reviews]);



const fetchReviews = async () => {
  const token = await getToken();

  const endpoint = token
    ? `/api/album/${albumSlug}/reviews`
    : `/api/album/${albumSlug}/reviews/public`;

  const config = token
    ? { headers: { Authorization: `Bearer ${token}` } }
    : {};

  try {
    const res = await axios.get(endpoint, config);
    setReviews(res.data);
  } catch (err) {
    console.error("리뷰 불러오기 실패:", err);
  }
};


  const handleRatingChange = async (e) => {
    const newRating = parseFloat(e.target.value);
    setUserRating(newRating); // 낙관적 UI 반영

    const token = await getToken();
    if (!token) return openLoginModal();

    try {
      // 평점 저장
      await axios.post(
        `/api/album/${albumSlug}/rating`,
        { rating: newRating },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 평균 평점 + 참여자 수 다시 가져오기
      const avgRes = await axios.get(`/api/album/${albumSlug}/average-rating`);
      setAverageRating(avgRes.data.average);
      setRatingCount(avgRes.data.count);

      // 내 평점도 다시 불러오기
      const myRes = await axios.get(`/api/album/${albumSlug}/my-rating`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserRating(myRes.data.rating);
    } catch (err) {
      console.error("평점 등록 실패:", err);
    }
  };

  const handleReviewSubmit = async () => {
    const trimmed = newReview.trim();
    if (!trimmed) {
      setAlertOpen(true);
      return;
    }

    const token = await getToken();
    if (!token) return openLoginModal();

    try {
      if (editReviewId) {
        await axios.put(
          `/api/reviews/${editReviewId}`,
          { review_text: trimmed },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setEditReviewId(null);
      } else {
        await axios.post(
          `/api/album/${albumSlug}/reviews`,
          { review_text: trimmed },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      setNewReview("");
      fetchReviews();
    } catch (err) {
      console.error("리뷰 저장 실패:", err);
    }
  };

  const handleEdit = (id, text) => {
    setEditReviewId(id);
    setNewReview(text);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("리뷰를 삭제하시겠습니까?")) return;
    const token = await getToken();
    await axios.delete(`/api/reviews/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchReviews();
  };

  const handleLikeToggle = async (reviewId) => {
    const token = await getToken();
    if (!token) return openLoginModal();

    await axios.post(
      `/api/reviews/${reviewId}/like`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchReviews();
  };

    const handleSaveToggle = async (reviewId) => {
      const token = await getToken();
      if (!token) return openLoginModal();
    
      try {
        const res = await axios.post(
          `/api/reviews/${reviewId}/save`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      
        setReviews((prevReviews) =>
          prevReviews.map((review) =>
            review.id === reviewId ? { ...review, saved: res.data.saved } : review
          )
        );
      } catch (err) {
        console.error("저장 토글 실패:", err);
      }
    };

  if (loading) return <div className="p-4">로딩 중...</div>;
  if (!album) return <div className="p-4">앨범을 찾을 수 없습니다.</div>;

  return (
    <div className="p-8">
      {/* 앨범 정보 */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="w-full md:w-48">
          <img src={album.image_url} alt={album.title} className="rounded shadow" />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{album.title}</h1>
          <p className="text-gray-600 mb-1">
            아티스트: <Link to={`/artist/${album.artist_slug}`} className="text-blue-600 hover:underline">{album.artist_name}</Link>
          </p>
            <p className="text-gray-600 mb-1">
              아티스트:{" "}
              {album.collaborators?.map((a, idx) => (
                <span key={a.id}>
                  <Link to={`/artist/${a.slug}`} className="text-blue-600 hover:underline">{a.name}</Link>
                  {idx < album.collaborators.length - 1 && ", "}
                </span>
              ))}
            </p>

          <p className="text-gray-600 mb-1">장르: {album.genre}</p>
          <p className="text-gray-600 mb-1">발매일: {album.release_date?.slice(0, 10)}</p>
          {album.description && <p className="text-gray-700 mt-4 whitespace-pre-line">{album.description}</p>}
        </div>
      </div>

      {/* 평점 */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-4">앨범 평점</h2>

        <div className="flex items-center gap-6 mb-3">
          {/* 평균 평점 표시 */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-full border-4 border-black flex items-center justify-center text-xl font-bold">
              {averageRating != null && !isNaN(averageRating)
                ? Number(averageRating).toFixed(1)
                : "-"}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {/*평균 평점 {ratingCount !== null ? `(${ratingCount}명)` : "(0명)"}*/}
            </p>
          </div>
              
          {/* 내 평점 select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">내 평점</label>
            <select
              value={userRating ?? ""}
              onChange={handleRatingChange}
              className="border rounded px-2 py-1"
              disabled={!user}
            >
              <option value="" disabled>
                선택하세요
              </option>
              {Array.from({ length: 21 }, (_, i) => (i * 0.5).toFixed(1)).map((score) => (
                <option key={score} value={score}>
                  {score}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>


      {/* 수록곡 */}
<div className="mt-8">
  <h2 className="text-xl font-semibold mb-4">트랙리스트</h2>
  <div className="divide-y">
    {songs.map((song, idx) => (
      <div
        key={song.id}
        className="flex items-center justify-between px-2 py-3 hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 font-mono w-6 text-right">{String(song.track_number).padStart(2, "0")}</span>
          <a
            href={`/songs/${song.id}`}
            className="font-medium hover:underline text-sm"
          >
            {song.title}
          </a>
        </div>
        {song.view_count != null && (
          <div className="flex items-center text-xs text-gray-600 gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12s-3.75 6.75-9.75 6.75S2.25 12 2.25 12z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>
              {song.view_count >= 1000
                ? (song.view_count / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
                : song.view_count}
            </span>
          </div>
        )}
      </div>
    ))}
  </div>
</div>


      {/* 리뷰 */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-3">리뷰</h2>

        <div className="mb-6">
          <textarea
            value={newReview}
            onChange={(e) => {
              if (!user) return openLoginModal();
              setNewReview(e.target.value);
            }}
            placeholder="리뷰를 입력하세요"
            className="w-full border rounded p-2 mb-2"
            rows={3}
          />
            <button
              onClick={() => {
                if (!user) return openLoginModal();
                handleReviewSubmit();
              }}
              className="px-5 py-2 rounded-full bg-black text-white hover:bg-gray-800 transition shadow-sm"
            >
              {editReviewId ? "수정 완료" : "리뷰 등록"}
            </button>
        </div>

        <div className="mb-4">
          <button onClick={() => setSortOrder("likes")} className={`mr-2 px-3 py-1 rounded ${sortOrder === "likes" ? "bg-blue-500 text-white" : "bg-gray-200"}`}>좋아요순</button>
          <button onClick={() => setSortOrder("recent")} className={`px-3 py-1 rounded ${sortOrder === "recent" ? "bg-blue-500 text-white" : "bg-gray-200"}`}>최신순</button>
        </div>

<ul className="space-y-6">
  {reviews.map((review) => (
    <li key={review.id} id={`review-${review.id}`} className="border-b pb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3 text-sm text-gray-700">
          {review.profile_image && (
            <img
              src={review.profile_image}
              alt="프로필"
              className="w-8 h-8 rounded-full"
            />
          )}
            <Link
              to={`/user/${review.user_id}`}
              className="font-semibold text-blue-600 hover:underline"
            >
              {review.nickname}
            </Link>
          <div className="w-12 h-12 rounded-full border-4 border-black flex items-center justify-center text-lg font-bold ml-2">
            {Number.isFinite(parseFloat(review.user_rating))
              ? parseFloat(review.user_rating).toFixed(1)
              : "-"}
          </div>
        </div>

        {/* 오른쪽: 작성일 (YYYY.MM.DD) */}
        <span className="text-xs text-gray-500">
          {new Date(review.created_at).toISOString().slice(0, 10).replace(/-/g, ".")}
        </span>
      </div>

      {/* 리뷰 본문 */}
      <p className="mb-2 text-gray-800 whitespace-pre-line">{review.review_text}</p>

      {/* 좋아요/저장/수정/삭제 버튼 */}
      <div className="flex gap-4 text-sm">
        <button
          onClick={() => handleLikeToggle(review.id)}
          className={`flex items-center space-x-1 ${
            review.liked ? "text-blue-600" : "text-gray-500"
          } hover:text-blue-700`}
        >
          <span>👍</span>
          <span>{review.like_count}</span>
        </button>

        {review.is_owner ? (
          <>
            <button
              onClick={() => handleEdit(review.id, review.review_text)}
              className="text-blue-600"
            >
              수정
            </button>
            <button
              onClick={() => handleDelete(review.id)}
              className="text-red-600"
            >
              삭제
            </button>
          </>
        ) : (
          <button
            onClick={() => handleSaveToggle(review.id)}
            className={`text-sm ${
              review.saved ? "text-green-600" : "text-gray-500"
            } hover:underline`}
          >
            {review.saved ? "저장됨" : "저장"}
          </button>
        )}
      </div>
    </li>
  ))}
</ul>


      </div>
          <AlertModal
      isOpen={alertOpen}
      title="입력 필요"
      description="리뷰를 입력해주세요."
      onClose={() => setAlertOpen(false)}
    />
    </div>
  );
}

export default AlbumPage;
