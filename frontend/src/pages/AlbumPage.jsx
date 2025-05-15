// AlbumPage.jsx
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
        setAverageRating(res.data.average != null ? Number(res.data.average) : null);
        setRatingCount(res.data.count != null ? Number(res.data.count) : 0);
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

  useEffect(() => {
    const fetch = async () => await fetchReviews();
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
          target.classList.add("ring", "ring-blue-500");
          setTimeout(() => target.classList.remove("ring", "ring-blue-500"), 2000);
        }
      }, 500);
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
    const endpoint = token ? `/api/album/${albumSlug}/reviews` : `/api/album/${albumSlug}/reviews/public`;
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
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
      await axios.post(`/api/album/${albumSlug}/rating`, { rating: newRating }, { headers: { Authorization: `Bearer ${token}` } });
      const avgRes = await axios.get(`/api/album/${albumSlug}/average-rating`);
      setAverageRating(avgRes.data.average);
      setRatingCount(avgRes.data.count);
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
    if (!trimmed) return setAlertOpen(true);
    const token = await getToken();
    if (!token) return openLoginModal();
    try {
      if (editReviewId) {
        await axios.put(`/api/reviews/${editReviewId}`, { review_text: trimmed }, { headers: { Authorization: `Bearer ${token}` } });
        setEditReviewId(null);
      } else {
        await axios.post(`/api/album/${albumSlug}/reviews`, { review_text: trimmed }, { headers: { Authorization: `Bearer ${token}` } });
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
    await axios.delete(`/api/reviews/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    fetchReviews();
  };

  const handleLikeToggle = async (reviewId) => {
    const token = await getToken();
    if (!token) return openLoginModal();
    await axios.post(`/api/reviews/${reviewId}/like`, {}, { headers: { Authorization: `Bearer ${token}` } });
    fetchReviews();
  };

  const handleSaveToggle = async (reviewId) => {
    const token = await getToken();
    if (!token) return openLoginModal();
    try {
      const res = await axios.post(`/api/reviews/${reviewId}/save`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, saved: res.data.saved } : r)));
    } catch (err) {
      console.error("저장 토글 실패:", err);
    }
  };

  if (loading) return <div className="p-4">로딩 중...</div>;
  if (!album) return <div className="p-4">앨범을 찾을 수 없습니다.</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">{album.title}</h1>
      <p className="mb-2">장르: {album.genre}</p>
      <p className="mb-2">발매일: {album.release_date}</p>
      <p className="mb-4">설명: {album.description}</p>

      <div>
        <label>내 평점:</label>
        <select value={userRating ?? ""} onChange={handleRatingChange}>
          <option value="" disabled>
            선택하세요
          </option>
          {[...Array(21)].map((_, i) => {
            const score = (i * 0.5).toFixed(1);
            return (
              <option key={score} value={score}>
                {score}
              </option>
            );
          })}
        </select>
        <p>평균 평점: {averageRating ?? "-"} ({ratingCount ?? 0}명)</p>
      </div>

      <h2 className="text-2xl font-semibold mt-8">수록곡</h2>
      <ul>
        {songs.map((song) => (
          <li key={song.id}>{song.title}</li>
        ))}
      </ul>

      <h2 className="text-2xl font-semibold mt-8">리뷰</h2>
      <textarea
        value={newReview}
        onChange={(e) => setNewReview(e.target.value)}
        placeholder="리뷰를 입력하세요"
      />
      <button onClick={handleReviewSubmit}>{editReviewId ? "수정 완료" : "등록"}</button>

      <ul>
        {reviews.map((review) => (
          <li key={review.id} id={`review-${review.id}`}>
            <p>{review.nickname} ({review.user_rating})</p>
            <p>{review.review_text}</p>
            <button onClick={() => handleLikeToggle(review.id)}>좋아요 {review.like_count}</button>
            {review.is_owner ? (
              <>
                <button onClick={() => handleEdit(review.id, review.review_text)}>수정</button>
                <button onClick={() => handleDelete(review.id)}>삭제</button>
              </>
            ) : (
              <button onClick={() => handleSaveToggle(review.id)}>{review.saved ? "저장됨" : "저장"}</button>
            )}
          </li>
        ))}
      </ul>

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
