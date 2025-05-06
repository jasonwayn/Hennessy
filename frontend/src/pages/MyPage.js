import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";
import axios from "axios";

function MyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [offset, setOffset] = useState(0);
  const [ratingsGrouped, setRatingsGrouped] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const token = await user.getIdToken();
      const res = await axios.get("/api/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNickname(res.data.nickname);
      setProfileImage(res.data.profile_image_url); // DB에 저장된 URL
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
      Promise.all([fetchProfile(), fetchReviews(), fetchRatings()]).then(() =>
        setLoading(false)
      );
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

  const handleLogout = async () => {
    await signOut(auth);
    alert("로그아웃 완료!");
    navigate("/login");
  };

  const handleImageChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    const storageRef = ref(storage, `profiles/${user.uid}_${selectedFile.name}`);
    await uploadBytes(storageRef, selectedFile);
    const downloadURL = await getDownloadURL(storageRef);

    const token = await user.getIdToken();

    await axios.post(
      "/api/mypage/profile-image",
      { image_url: downloadURL },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setProfileImage(downloadURL);
    alert("프로필 이미지가 저장되었습니다.");
  };

  if (!user || loading) return <div>로딩 중...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">마이페이지</h2>
      
      {/* 프로필 섹션 */}
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
      <div className="mb-6">
        <input type="file" onChange={handleImageChange} />
        <button
          onClick={handleUpload}
          className="ml-2 px-3 py-1 bg-blue-500 text-white rounded"
        >
          이미지 업로드
        </button>
      </div>

      {/* 내가 쓴 리뷰 */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2">내 리뷰</h3>
        {reviews.map((r) => (
          <div key={r.id} className="border p-4 rounded mb-2">
            <p className="text-gray-700 mb-1">{r.review_text}</p>
            <p className="text-sm text-gray-500">
              {r.artist_name} - {r.album_title}
            </p>
          </div>
        ))}
        <button
          onClick={loadMoreReviews}
          className="mt-2 text-blue-500 underline"
        >
          더보기
        </button>
      </div>

      {/* 평점 그룹 */}
      <div>
        <h3 className="text-xl font-semibold mb-2">내 평점</h3>
        {ratingsGrouped.map((group) => (
          <div key={group.rating_group} className="mb-4">
            <h4 className="font-bold mb-2">{group.rating_group}점대</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {JSON.parse(group.albums).map((album) => (
                <div key={album.slug} className="text-center">
                  <img
                    src={album.image_url}
                    alt={album.title}
                    className="w-full rounded"
                  />
                  <p className="text-sm mt-1">{album.title}</p>
                  <p className="text-xs text-gray-500">{album.rating}점</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 로그아웃 */}
      <button
        onClick={handleLogout}
        className="mt-6 bg-red-500 text-white px-4 py-2 rounded"
      >
        로그아웃
      </button>
    </div>
  );
}

export default MyPage;
