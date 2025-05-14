// src/pages/AlbumsPage.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

function AlbumsPage() {
  const [albums, setAlbums] = useState([]);
  const [year, setYear] = useState("");
  const [sort, setSort] = useState("rating");

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1899 }, (_, i) => currentYear - i);

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const res = await axios.get("/api/albums", {
          params: { year: year || undefined, sort },
        });
        // single 타입 필터링
        const filtered = res.data.filter(
          (album) => String(album.type).toLowerCase() !== "single"
        );
        setAlbums(filtered);  // ← 여기를 filtered로 변경!
      } catch (err) {
        console.error("앨범 불러오기 실패:", err);
      }
    };

    fetchAlbums();
  }, [year, sort]);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">앨범 목록</h2>

      <div className="flex gap-4 mb-6">
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="border px-3 py-2 rounded"
        >
          <option value="">연도 선택</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="border px-3 py-2 rounded"
        >
          <option value="rating">평점순</option>
          <option value="latest">최신순</option>
        </select>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {albums.map((album) => (
          <Link
            to={`/album/${album.artist_slug}/${album.slug}`}
            key={album.id}
            className="border rounded p-3 hover:shadow"
          >
            <img
              src={album.image_url}
              alt={album.title}
              className="w-full h-48 object-cover mb-2 rounded"
            />
            <p className="font-semibold truncate">{album.title}</p>
            <p className="text-sm text-gray-500 truncate">{album.artist_name}</p>
            <p className="text-sm mt-1 text-gray-700">
              {isNaN(Number(album.average_rating)) ? "0.0" : Number(album.average_rating).toFixed(1)} / 10.0
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default AlbumsPage;
