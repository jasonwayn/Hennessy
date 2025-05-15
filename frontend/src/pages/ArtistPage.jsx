import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

function ArtistPage() {
  const { slug } = useParams();
  const [artist, setArtist] = useState(null);
  const [albums, setAlbums] = useState([]);
  const [credits, setCredits] = useState([]);
  const [activeTab, setActiveTab] = useState("albums");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`/api/artists/${slug}`)
      .then((res) => {
        setArtist(res.data.artist);
        setAlbums(res.data.albums);
        setCredits(res.data.credits || []);
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
    credits: credits,
  };

  if (loading) return <div className="p-4">로딩 중...</div>;
  if (!artist) return <div className="p-4">아티스트를 찾을 수 없습니다.</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* 아티스트 이름 */}
      <h1 className="text-3xl font-bold mb-6">{artist.name}</h1>

      {/* 아티스트 정보 섹션 */}
      <div className="grid grid-cols-1 md:grid-cols-[auto,1fr] gap-6 mb-10">
        <img
          src={artist.image_url}
          alt={artist.name}
          className="w-40 h-40 object-cover rounded shadow"
        />
        <div>
          <h2 className="text-lg font-semibold mb-3">Artist Info</h2>
          {artist.type === "group" ? (
            <>
              <p className="mb-1">Formed: {artist.formed_date?.slice(0, 10) || "정보 없음"}</p>
              <p className="mb-1">Genre: {artist.genre || "정보 없음"}</p>
              {artist.members && <p className="mb-1">Members: {artist.members}</p>}
            </>
          ) : (
            <>
              <p className="mb-1">Also Known As: {artist.members || "정보 없음"}</p>
              <p className="mb-1">Genre: {artist.genre || "정보 없음"}</p>
            </>
          )}
        </div>
      </div>

      {/* 소개 섹션 */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-2">About</h2>
        <p className="text-gray-700 whitespace-pre-line leading-relaxed">{artist.bio}</p>
      </div>

      {/* 탭 영역 */}
      <div className="flex border-b mb-6">
        {["albums", "eps", "singles", "collaborations", "credits"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 capitalize transition font-medium ${
              activeTab === tab
                ? "border-b-2 border-black text-black"
                : "text-gray-500 hover:text-black"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 앨범 목록 */}
      {activeTab !== "credits" && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {filtered[activeTab].length > 0 ? (
            filtered[activeTab].map((album) => (
              <Link
                key={album.id}
                to={`/album/${album.artist_slug}/${album.slug}`}
                className="block bg-white rounded shadow hover:shadow-md transition overflow-hidden"
              >
                <img
                  src={album.image_url}
                  alt={album.title}
                  className="w-full aspect-square object-cover"
                />
                <div className="p-2">
                  <div className="text-sm font-medium truncate">{album.title}</div>
                  <div className="text-xs text-gray-500">{album.release_date?.slice(0, 10)}</div>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-sm text-gray-500 col-span-full">앨범 정보가 없습니다.</p>
          )}
        </div>
      )}

      {/* 크레딧 탭 */}
      {activeTab === "credits" && (
        <div className="space-y-4">
          {credits.length > 0 ? (
            credits.map((credit, index) => (
              <div
                key={`${credit.song_id}-${credit.album_id || index}`}
                className="flex items-center gap-4 border p-3 rounded hover:bg-gray-50"
              >
                <img
                  src={credit.album_image}
                  alt={credit.album_title}
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1">
                  <Link
                    to={`/songs/${credit.song_id}`}
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    {credit.song_title}
                  </Link>
                  <p className="text-sm text-gray-500">
                    from <span className="italic">{credit.album_title}</span>
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">크레딧 참여 정보가 없습니다.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default ArtistPage;
