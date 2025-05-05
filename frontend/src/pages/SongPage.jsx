import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

function SongPage() {
  const { id } = useParams();
  const [song, setSong] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`/api/songs/${id}`)
      .then((res) => {
        setSong(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("곡 정보 로딩 실패:", err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="p-4">로딩 중...</div>;
  if (!song) return <div className="p-4">곡을 찾을 수 없습니다.</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">{song.title}</h1>
      <p className="text-gray-600">앨범: {song.album_title}</p>
      <p className="text-gray-600 mb-4">아티스트: {song.artist_name}</p>

      <h2 className="text-lg font-semibold mt-6 mb-2">가사</h2>
      <pre className="whitespace-pre-wrap text-gray-800">
        {song.lyrics}
      </pre>
    </div>
  );
}

export default SongPage;
