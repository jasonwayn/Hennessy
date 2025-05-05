import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

function AlbumPage() {
  const { artistSlug, albumSlug } = useParams();
  const [album, setAlbum] = useState(null); // react의 state 개념
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`/api/album/${artistSlug}/${albumSlug}`)
      .then((res) => {
        setAlbum(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("앨범 정보 로딩 실패:", err);
        setLoading(false);
      });
  }, [artistSlug, albumSlug]);

  if (loading) return <div className="p-4">로딩 중...</div>;
  if (!album) return <div className="p-4">앨범을 찾을 수 없습니다.</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">{album.title}</h1>
      <p className="text-gray-600 mb-1">아티스트: {album.artist_name}</p>
      <p className="text-gray-600 mb-1">장르: {album.genre}</p>
      <p className="text-gray-600 mb-1">발매일: {album.release_date}</p>
      <p className="text-gray-700 mt-4 whitespace-pre-line">{album.description}</p>

      {/* 다음 단계: 수록곡 리스트 삽입 위치 */}
    </div>
  );
}

export default AlbumPage;
