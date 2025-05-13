import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "../utils/getToken";
import { useLoginModal } from "../contexts/LoginModalContext";
import { useAuth } from "../contexts/AuthContext";

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
      .then((res) => setAverageRating(res.data.average))
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
    setUserRating(newRating);

    const token = await getToken();
    if (!token) return openLoginModal();

    try {
      await axios.post(
        `/api/album/${albumSlug}/rating`,
        { rating: newRating },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const res = await axios.get(`/api/album/${albumSlug}/average-rating`);
      setAverageRating(res.data.average);
    } catch (err) {
      console.error("평점 등록 실패:", err);
    }
  };

  const handleReviewSubmit = async () => {
    const trimmed = newReview.trim();
    if (!trimmed) return alert("리뷰를 입력해주세요.");

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
          {album.type === "collaboration" && album.collaborators?.length > 1 && (
            <p className="text-gray-600 text-sm mb-1">
              참여 아티스트: {album.collaborators.map((a, idx) => (
                <span key={a.id}>
                  <Link to={`/artist/${a.slug}`} className="text-blue-600 hover:underline">{a.name}</Link>
                  {idx < album.collaborators.length - 1 && ", "}
                </span>
              ))}
            </p>
          )}
          <p className="text-gray-600 mb-1">장르: {album.genre}</p>
          <p className="text-gray-600 mb-1">발매일: {album.release_date?.slice(0, 10)}</p>
          {album.description && <p className="text-gray-700 mt-4 whitespace-pre-line">{album.description}</p>}
        </div>
      </div>

      {/* 평점 */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold">앨범 평점</h2>
        <p className="mb-2">평균 평점: {typeof averageRating === "number" ? averageRating.toFixed(1) : "불러오는 중..."}</p>
        <label className="mr-2">내 평점:</label>
        <select
          value={userRating ?? ""}
          onChange={handleRatingChange}
          className="border rounded px-2 py-1"
          disabled={!user} // ✅ 비로그인 시 비활성화
        >
          <option value="" disabled>선택하세요</option>
          {Array.from({ length: 21 }, (_, i) => (i * 0.5).toFixed(1)).map((score) => (
            <option key={score} value={score}>{score}</option>
          ))}
        </select>
      </div>

      {/* 수록곡 */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">수록곡</h2>
        <ul className="space-y-1">
          {songs.map((song) => (
            <li key={song.id}>
              <a href={`/songs/${song.id}`} className="text-blue-600 hover:underline">
                {song.track_number}. {song.title}
              </a>
            </li>
          ))}
        </ul>
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
            className="bg-green-500 text-white px-4 py-2 rounded"
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
    <li key={review.id} className="border-b pb-4">
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
        {review.profile_image && (
          <img
            src={review.profile_image}
            alt="프로필"
            className="w-8 h-8 rounded-full"
          />
        )}
        <p>{review.nickname}</p>
      </div>
      <p className="mb-2">{review.review_text}</p>
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
        ) : null}

        {!review.is_owner && (
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
    </div>
  );
}

export default AlbumPage;
