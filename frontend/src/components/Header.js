import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useRef } from "react";
import LoginModal from "./LoginModal";
import axios from "axios";

function Header() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const { user, loading } = useAuth(); 
  const [nickname, setNickname] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef();


  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await user.getIdToken();
        const res = await axios.get("/api/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNickname(res.data.nickname);
        setProfileImage(res.data.profile_image_url);
      } catch (err) {
        console.error("프로필 정보 불러오기 실패:", err.message);
      }
    };

    if (!loading && user) {
      fetchProfile(); // ✅ loading false일 때만 실행
    }
  }, [user, loading]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (query.trim()) {
        axios
          .get(`/api/search?q=${encodeURIComponent(query)}`)
          .then((res) => {
            setResults(res.data);
            setShowResults(true);
          })
          .catch((err) => console.error("검색 실패:", err));
      } else {
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  useEffect(() => {
  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setShowResults(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);

  return (
    <>
      <header className="bg-white shadow px-6 py-4 flex items-center justify-between relative">
        {/* 왼쪽: 로고 & 메뉴 */}
        <div className="flex items-center gap-6">
          <Link to="/" className="text-xl font-bold">🎵 Hennessy</Link>
          <Link to="/news" className="text-gray-700 hover:underline">News</Link>
          <Link to="/albums" className="text-gray-700 hover:underline">Album</Link>
          <Link to="/add" className="text-gray-700 hover:underline">Add Content</Link>
        </div>

        {/* 가운데: 검색창 */}
        <div className="relative w-64">
          <input
            type="text"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border px-3 py-1 rounded w-full"
          />

          {showResults && results && (
            <div
              ref={dropdownRef}
              className="absolute z-50 bg-white border rounded shadow w-full mt-1 max-h-96 overflow-y-auto"
            >
              <div className="p-2 font-semibold border-b">Artists</div>
              {results.artists.length > 0 ? results.artists.map(a => (
                <Link key={a.id} to={`/artist/${a.slug}`} className="block px-3 py-1 hover:bg-gray-100">
                  {a.name}
                </Link>
              )) : <div className="px-3 text-sm text-gray-500">No artist found</div>}

              <div className="p-2 font-semibold border-b">Albums</div>
              {results.albums.length > 0 ? results.albums.map(a => (
                <Link key={a.id} to={`/album/${a.artist_slug}/${a.slug}`} className="block px-3 py-1 hover:bg-gray-100">
                  {a.title}
                </Link>
              )) : <div className="px-3 text-sm text-gray-500">No album found</div>}

              <div className="p-2 font-semibold border-b">Songs</div>
              {results.songs.length > 0 ? results.songs.map(s => (
                <Link key={s.id} to={`/songs/${s.id}`} className="block px-3 py-1 hover:bg-gray-100">
                  {s.title}
                </Link>
              )) : <div className="px-3 text-sm text-gray-500">No song found</div>}
            </div>
          )}
        </div>

        {/* 오른쪽: 유저 정보 or 로그인 */}
        <div className="flex items-center gap-4">
          {!loading && user ? (
            <Link to="/mypage" className="flex items-center gap-2 text-gray-700 hover:underline">
              {profileImage && (
                <img src={profileImage} alt="프로필" className="w-8 h-8 rounded-full object-cover" />
              )}
              <span className="font-medium">{nickname || user.email}</span>
            </Link>
          ) : (
            <button
              onClick={() => setShowModal(true)}
              className="text-gray-600 hover:underline"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {showModal && <LoginModal onClose={() => setShowModal(false)} />}
    </>
  );
}

export default Header;
