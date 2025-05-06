import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "../utils/getToken";

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

  useEffect(() => {
    axios
      .get(`/api/album/${albumSlug}/reviews?sort=${sortOrder}`)
      .then((res) => setReviews(res.data))
      .catch((err) => console.error("리뷰 불러오기 실패:", err));
  }, [albumSlug, sortOrder]);

  const fetchReviews = async () => {
    const res = await axios.get(`/api/album/${albumSlug}/reviews?sort=${sortOrder}`);
    setReviews(res.data);
  };

  const handleRatingChange = async (e) => {
    const newRating = parseFloat(e.target.value);
    setUserRating(newRating);

    try {
      const token = await getToken();
      if (!token) {
        alert("로그인이 필요합니다.");
        return;
      }

      await axios.post(
        `/api/album/${albumSlug}/rating`,
        { rating: newRating },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const res = await axios.get(`/api/album/${albumSlug}/average-rating`);
      setAverageRating(res.data.average);
    } catch (err) {
      console.error("평점 등록 실패:", err);
      alert("평점 등록에 실패했습니다.");
    }
  };

  const handleReviewSubmit = async () => {
    const trimmed = newReview.trim();
    if (!trimmed) {
      alert("리뷰를 입력해주세요.");
      return;
    }

    const token = await getToken();
    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }

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
      alert("리뷰 저장 중 오류 발생");
    }
  };

  const handleEdit = (id, text) => {
    setEditReviewId(id);
    setNewReview(text);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("리뷰를 삭제하시겠습니까?")) return;
    try {
      const token = await getToken();
      await axios.delete(`/api/reviews/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchReviews();
    } catch (err) {
      console.error("리뷰 삭제 실패:", err);
      alert("삭제 중 오류 발생");
    }
  };

  const handleLikeToggle = async (reviewId) => {
    try {
      const token = await getToken();
      if (!token) {
        alert("로그인이 필요합니다.");
        return;
      }

      await axios.post(
        `/api/reviews/${reviewId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      fetchReviews();
    } catch (err) {
      console.error("리뷰 좋아요 실패:", err);
      alert("좋아요 처리 중 문제가 발생했습니다.");
    }
  };

  if (loading) return <div className="p-4">로딩 중...</div>;
  if (!album) return <div className="p-4">앨범을 찾을 수 없습니다.</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">{album.title}</h1>
      <p className="text-gray-600 mb-1">아티스트: {album.artist_name}</p>
      <p className="text-gray-600 mb-1">장르: {album.genre}</p>
      <p className="text-gray-600 mb-1">발매일: {album.release_date}</p>
      <p className="text-gray-700 mt-4 whitespace-pre-line">{album.description}</p>

      <div className="mt-6">
        <h2 className="text-lg font-semibold">앨범 평점</h2>
        <p className="mb-2 text-gray-700">
          평균 평점: {averageRating !== null ? averageRating.toFixed(1) : "불러오는 중..."}
        </p>
        <label className="mr-2">내 평점:</label>
        <select
          value={userRating ?? ""}
          onChange={handleRatingChange}
          className="border rounded px-2 py-1"
        >
          <option value="" disabled>선택하세요</option>
          {Array.from({ length: 21 }, (_, i) => (i * 0.5).toFixed(1)).map((score) => (
            <option key={score} value={score}>{score}</option>
          ))}
        </select>
      </div>

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

      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-3">리뷰</h2>

        <div className="mb-6">
          <textarea
            value={newReview}
            onChange={(e) => setNewReview(e.target.value)}
            placeholder="리뷰를 입력하세요"
            className="w-full border rounded p-2 mb-2"
            rows={3}
          />
          <button
            onClick={handleReviewSubmit}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            {editReviewId ? "수정 완료" : "리뷰 등록"}
          </button>
        </div>

        <div className="mb-4">
          <button
            onClick={() => setSortOrder("likes")}
            className={`mr-2 px-3 py-1 rounded ${sortOrder === "likes" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          >
            좋아요순
          </button>
          <button
            onClick={() => setSortOrder("recent")}
            className={`px-3 py-1 rounded ${sortOrder === "recent" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          >
            최신순
          </button>
        </div>

        {reviews.length === 0 ? (
          <p className="text-gray-500">아직 등록된 리뷰가 없습니다.</p>
        ) : (
          <ul className="space-y-4">
            {reviews.map((review) => (
              <li key={review.id} className="border p-4 rounded bg-gray-50">
                <div className="flex items-center mb-2 gap-3">
                  {review.profile_image && (
                    <img
                      src={review.profile_image}
                      alt="프로필"
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <p className="text-sm text-gray-600">{review.nickname}</p>
                </div>
                <p className="mb-2">{review.review_text}</p>
                <div className="flex gap-4 text-sm">
                  <button
                    onClick={() => handleLikeToggle(review.id)}
                    className={`flex items-center space-x-1 text-sm ${
                      review.liked ? "text-blue-600" : "text-gray-500"
                    } hover:text-blue-700`}
                  >
                    <span>👍</span>
                    <span>{review.like_count}</span>
                  </button>
                  <button onClick={() => handleEdit(review.id, review.review_text)} className="text-blue-600">
                    수정
                  </button>
                  <button onClick={() => handleDelete(review.id)} className="text-red-600">
                    삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default AlbumPage;
