// src/pages/SearchPage.js
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";

function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/search?q=${encodeURIComponent(query)}`);
      setResults(res.data);
    } catch (err) {
      console.error("검색 실패:", err);
    }
    setLoading(false);
  };

  useState(() => {
    if (query) fetchResults();
  }, [query]);

  if (loading) return <div className="p-4">로딩 중...</div>;
  if (!query) return <div className="p-4">검색어를 입력해주세요.</div>;
  if (!results) return null;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">"{query}" 검색 결과</h2>

      {/* 아티스트 */}
      <section className="mb-6">
        <h3 className="text-xl font-semibold mb-2">아티스트</h3>
        {results.artists.length === 0 ? (
          <p className="text-gray-500">검색 결과 없음</p>
        ) : (
          <ul className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {results.artists.map((artist) => (
              <li key={artist.id} className="text-center">
                <img src={artist.image_url} alt={artist.name} className="w-full rounded" />
                <p className="mt-1">{artist.name}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 앨범 */}
      <section className="mb-6">
        <h3 className="text-xl font-semibold mb-2">앨범</h3>
        {results.albums.length === 0 ? (
          <p className="text-gray-500">검색 결과 없음</p>
        ) : (
          <ul className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {results.albums.map((album) => (
              <li key={album.id} className="text-center">
                <img src={album.image_url} alt={album.title} className="w-full rounded" />
                <p className="mt-1">{album.title}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 곡 */}
      <section>
        <h3 className="text-xl font-semibold mb-2">곡</h3>
        {results.songs.length === 0 ? (
          <p className="text-gray-500">검색 결과 없음</p>
        ) : (
          <ul className="list-disc pl-5">
            {results.songs.map((song) => (
              <li key={song.id}>{song.title}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default SearchPage;
