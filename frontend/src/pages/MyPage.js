// src/pages/MyPage.js
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import axios from "axios";
import { Link } from "react-router-dom";
import EditProfileModal from "../components/EditProfileModal";
import ChangePasswordModal from "../components/ChangePasswordModal";
import { useLoginModal } from "../contexts/LoginModalContext.js";

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
  const { openLoginModal } = useLoginModal();


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
      navigate("/news"); 
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
    <div className="max-w-6xl mx-auto">
      <div className="bg-[#f9dad6] p-8 mb-10 rounded">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-6">
            {profileImage && (
              <img
                src={profileImage}
                alt="프로필 이미지"
                className="w-28 h-28 rounded-full object-cover"
              />
            )}
            <div>
              <p className="text-2xl font-bold">{nickname || "닉네임 없음"}</p>
              <p className="text-sm text-gray-600 mb-3">{user.email}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="text-sm px-3 py-1 bg-gray-200 rounded"
                >
                  비밀번호 변경
                </button>
                <button
                  onClick={handleLogout}
                  className="text-sm px-3 py-1 bg-red-500 text-white rounded"
                >
                  로그아웃
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setShowEditModal(true)}
              className="w-28 h-28 bg-white bg-opacity-80 border border-[#f2bfb5] hover:bg-[#f5cfc7] transition rounded-xl shadow-sm flex items-center justify-center text-sm font-medium"
            >
              프로필 편집
            </button>
            <button
              onClick={() => scrollToSection(ratingsRef)}
              className="w-28 h-28 bg-white bg-opacity-80 border border-[#f2bfb5] hover:bg-[#f5cfc7] transition rounded-xl shadow-sm flex items-center justify-center text-sm font-medium"
            >
              평점
            </button>
            <button
              onClick={() => scrollToSection(reviewsRef)}
              className="w-28 h-28 bg-white bg-opacity-80 border border-[#f2bfb5] hover:bg-[#f5cfc7] transition rounded-xl shadow-sm flex items-center justify-center text-sm font-medium"
            >
              리뷰
            </button>
            <button
              onClick={() => scrollToSection(savedRef)}
              className="w-28 h-28 bg-white bg-opacity-80 border border-[#f2bfb5] hover:bg-[#f5cfc7] transition rounded-xl shadow-sm flex items-center justify-center text-sm font-medium"
            >
              보관함
            </button>
          </div>
        </div>
      </div>


      <div ref={ratingsRef} className="mb-10">
        <h3 className="text-xl font-semibold mb-2 border-l-4 pl-2 border-[#db4c3f]">내 평점</h3>
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

      <div ref={reviewsRef} className="mb-10">
        <h3 className="text-xl font-semibold mb-2 border-l-4 pl-2 border-[#db4c3f]">내 리뷰</h3>
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
        <h3 className="text-xl font-semibold mb-2 border-l-4 pl-2 border-[#db4c3f]">SAVED CONTENTS</h3>
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
