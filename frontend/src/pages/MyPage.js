// src/pages/MyPage.js
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import axios from "axios";
import EditProfileModal from "../components/EditProfileModal";
import ChangePasswordModal from "../components/ChangePasswordModal";

function MyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [offset, setOffset] = useState(0);
  const [ratingsGrouped, setRatingsGrouped] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [bio, setBio] = useState("");
  const [savedReviews, setSavedReviews] = useState([]);
  const [expandedRatings, setExpandedRatings] = useState({});

  const ratingsRef = useRef(null);
  const reviewsRef = useRef(null);
  const savedRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const token = await user.getIdToken();
      const res = await axios.get("/api/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNickname(res.data.nickname);
      setProfileImage(res.data.profile_image_url);
      setBio(res.data.bio);
    };

    const fetchReviews = async () => {
      const token = await user.getIdToken();
      const res = await axios.get(`/api/mypage/reviews?offset=0`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReviews(res.data);
    };

    const fetchRatings = async () => {
      const token = await user.getIdToken();
      const res = await axios.get(`/api/mypage/ratings/grouped`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRatingsGrouped(res.data);
    };

    if (user) {
      Promise.all([fetchProfile(), fetchReviews(), fetchRatings()])
        .then(() => setLoading(false))
        .catch(() => setLoading(false));
    } else {
      navigate("/login");
    }
  }, [user, navigate]);

  const loadMoreReviews = async () => {
    const token = await user.getIdToken();
    const nextOffset = offset + 3;
    const res = await axios.get(`/api/mypage/reviews?offset=${nextOffset}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setReviews((prev) => [...prev, ...res.data]);
    setOffset(nextOffset);
  };

  const getVisibleAlbums = (groupKey, albums) => {
    const count = expandedRatings[groupKey] || 8;
    return albums.slice(0, count);
  };

  const handleLogout = async () => {
    await signOut(auth);
    alert("로그아웃 완료!");
    navigate("/news");
  };

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchSavedReviews = async () => {
    const token = await user.getIdToken();
    const res = await axios.get("/api/mypage/saved-reviews", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setSavedReviews(res.data);
  };

  if (!user || loading) return <div className="p-8 text-center">로딩 중...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">마이페이지</h2>

      <div className="flex items-center mb-4">
        {profileImage && (
          <img
            src={profileImage}
            alt="프로필 이미지"
            className="w-16 h-16 rounded-full mr-4 object-cover"
          />
        )}
        <div>
          <p className="font-semibold">{nickname || "닉네임 없음"}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </div>

      <div className="flex gap-4 mb-8">
        <div className="flex flex-col gap-2">
          <button onClick={() => scrollToSection(ratingsRef)} className="bg-gray-200 px-3 py-1 rounded">ratings</button>
          <button onClick={() => scrollToSection(reviewsRef)} className="bg-gray-200 px-3 py-1 rounded">reviews</button>
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={() => scrollToSection(savedRef)} className="bg-gray-200 px-3 py-1 rounded">SAVED</button>
          <button onClick={() => setShowEditModal(true)} className="bg-gray-200 px-3 py-1 rounded">edit profile</button>
          <button onClick={() => setShowPasswordModal(true)} className="bg-gray-200 px-3 py-1 rounded">change password</button>
        </div>
      </div>

      <div ref={ratingsRef} className="mb-10">
        <h3 className="text-xl font-semibold mb-2">내 평점</h3>
        {ratingsGrouped.map((group) => {
          const groupKey = group.rating_group;
          const allAlbums = JSON.parse(group.albums);
          const visibleCount = expandedRatings[groupKey] || 8;
          const visibleAlbums = allAlbums.slice(0, visibleCount);

          return (
            <div key={groupKey} className="mb-4">
              <h4 className="font-bold mb-2">{groupKey}</h4>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                {visibleAlbums.map((album) => (
                  <div key={album.slug} className="text-center">
                    <img
                      src={album.image_url}
                      alt={album.title}
                      className="w-20 h-20 object-cover rounded mx-auto"
                    />
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
                  className="mt-2 text-sm text-blue-500 underline"
                >
                  더보기
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div ref={reviewsRef} className="mb-10">
        <h3 className="text-xl font-semibold mb-2">내 리뷰</h3>
        {reviews.map((r) => (
          <div key={r.id} className="border p-4 rounded mb-2">
            <p className="text-gray-700 mb-1">{r.review_text}</p>
            <p className="text-sm text-gray-500">
              {r.artist_name} - {r.album_title}
            </p>
          </div>
        ))}
        <button onClick={loadMoreReviews} className="mt-2 text-blue-500 underline">
          더보기
        </button>
      </div>

      <div ref={savedRef}>
        <h3 className="text-xl font-semibold mb-2">SAVED CONTENTS</h3>
        {savedReviews.length === 0 ? (
          <p className="text-gray-500">저장된 리뷰가 없습니다.</p>
        ) : (
          <ul className="space-y-4">
            {savedReviews.map((review) => (
              <li key={review.id} className="border p-4 rounded">
                <p className="text-gray-800 mb-1">{review.review_text}</p>
                <div className="text-sm text-gray-500">
                  {review.nickname} / {review.artist_name} - {review.album_title}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        onClick={handleLogout}
        className="mt-6 bg-red-500 text-white px-4 py-2 rounded"
      >
        로그아웃
      </button>

      {showEditModal && (
        <EditProfileModal
          onClose={() => setShowEditModal(false)}
          currentNickname={nickname}
          currentBio={bio}
          onUpdate={(newNick, newBio, newImg) => {
            setNickname(newNick);
            setBio(newBio);
            if (newImg) setProfileImage(newImg);
          }}
        />
      )}

      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </div>
  );
}

export default MyPage;
