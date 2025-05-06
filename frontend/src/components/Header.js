// src/components/Header.js
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

function Header() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const { user } = useAuth();
  const [nickname, setNickname] = useState("");
  const [profileImage, setProfileImage] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const token = await user.getIdToken();
      const res = await fetch("/api/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setNickname(data.nickname);
      setProfileImage(data.profile_image_url);
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    setQuery("");
  };

  return (
    <header className="bg-white shadow px-6 py-4 flex items-center justify-between">
      <Link to="/" className="text-xl font-bold">🎵 Hennessy</Link>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          placeholder="검색 (아티스트, 앨범, 곡)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border px-3 py-1 rounded w-64"
        />
        <button type="submit" className="bg-blue-500 text-white px-3 py-1 rounded">
          검색
        </button>
      </form>

      <div className="flex items-center gap-4">
        {user ? (
          <Link to="/mypage" className="flex items-center gap-2 text-gray-700 hover:underline">
            {profileImage && (
              <img
                src={profileImage}
                alt="프로필"
                className="w-8 h-8 rounded-full object-cover"
              />
            )}
            <span className="font-medium">{nickname || user.email}</span>
          </Link>
        ) : (
          <>
            <Link to="/login" className="text-gray-600 hover:underline">로그인</Link>
            <Link to="/signup" className="text-gray-600 hover:underline">회원가입</Link>
          </>
        )}
      </div>
    </header>
  );
}

export default Header;
