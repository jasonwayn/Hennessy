import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

function ArtistPage() {
  const { slug } = useParams();
  const [artist, setArtist] = useState(null);
  const [albums, setAlbums] = useState([]);
  const [activeTab, setActiveTab] = useState("albums");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`/api/artists/${slug}`)
      .then((res) => {
        setArtist(res.data.artist);
        setAlbums(res.data.albums);
        setLoading(false);
      })
      .catch((err) => {
        console.error("아티스트 로딩 실패:", err);
        setLoading(false);
      });
  }, [slug]);

  const filtered = {
    albums: albums.filter((a) => a.type === "album"),
    eps: albums.filter((a) => a.type === "ep"),
    singles: albums.filter((a) => a.type === "single"),
    collaborations: albums.filter((a) => a.type === "collaboration"),
    credits: [], // 추후 구현
  };

  if (loading) return <div className="p-4">로딩 중...</div>;
  if (!artist) return <div className="p-4">아티스트를 찾을 수 없습니다.</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">{artist.name}</h1>

      <div className="flex gap-6 mb-8">
        <img
          src={artist.image_url}
          alt={artist.name}
          className="w-40 h-40 object-cover rounded"
        />
        <div className="flex-1">
          <h2 className="text-lg font-semibold mb-2">Artist Info</h2>
          <p>Type: {artist.type}</p>
          <p>Formed: {artist.formed_date?.slice(0, 10) || "정보 없음"}</p>
          <p>Genre: {artist.genre || "정보 없음"}</p>
          {artist.members && <p>Members: {artist.members}</p>}
        </div>
      </div>

      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-2">About</h2>
        <p className="text-gray-700 whitespace-pre-line">{artist.bio}</p>
      </div>

      {/* 탭 */}
      <div className="flex border-b mb-4">
        {["albums", "eps", "singles", "collaborations", "credits"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 capitalize ${
              activeTab === tab
                ? "border-b-2 border-black font-bold"
                : "text-gray-500"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 앨범 목록 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {filtered[activeTab].length > 0 ? (
          filtered[activeTab].map((album) => (
            <div key={album.id} className="text-center">
              <img
                src={album.image_url}
                alt={album.title}
                className="w-full rounded"
              />
              <p className="mt-2 font-medium">{album.title}</p>
              <p className="text-sm text-gray-500">{album.release_date?.slice(0, 10)}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500 col-span-full">해당 콘텐츠가 없습니다.</p>
        )}
      </div>
    </div>
  );
}

export default ArtistPage;
