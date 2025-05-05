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

  useEffect(() => {
    // 앨범 상세 + 수록곡 정보
    axios
      .get(`/api/album/${artistSlug}/${albumSlug}`)
      .then((res) => {
        setAlbum(res.data);
        const albumId = res.data.id;

        // 수록곡 요청
        return axios.get(`/api/albums/${albumId}/songs`);
      })
      .then((res) => {
        setSongs(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("앨범 또는 수록곡 로딩 실패:", err);
        setLoading(false);
      });

    // 평균 평점 요청
    axios
      .get(`/api/album/${albumSlug}/average-rating`)
      .then((res) => setAverageRating(res.data.average))
      .catch((err) => console.error("평균 평점 로딩 실패:", err));

    // 내 평점 요청
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
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // 등록 후 평균 평점 다시 불러오기
      const res = await axios.get(`/api/album/${albumSlug}/average-rating`);
      setAverageRating(res.data.average);
    } catch (err) {
      console.error("평점 등록 실패:", err);
      alert("평점 등록에 실패했습니다.");
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

      {/* 평점 UI */}
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
            <option key={score} value={score}>
              {score}
            </option>
          ))}
        </select>
      </div>

      {/* 수록곡 리스트 */}
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
    </div>
  );
}

export default AlbumPage;
