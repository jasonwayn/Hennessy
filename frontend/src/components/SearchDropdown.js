// SearchDropdown.js
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { Mic, Disc, Music } from "lucide-react"; 

function SearchDropdown({ query, onClose }) {
  const [results, setResults] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);

  useEffect(() => {
    if (!query) return;

    axios
      .get(`/api/search?q=${encodeURIComponent(query)}`)
      .then((res) => setResults(res.data))
      .catch((err) => console.error("검색 실패:", err));
  }, [query]);

  if (!query || !results) return null;

  return (
    <div className="absolute top-full left-1/2 transform -translate-x-1/2 bg-white border mt-2 w-[500px] p-4 rounded shadow z-50 max-h-[70vh] overflow-y-auto">
      <h2 className="text-lg font-bold mb-4">Results for ‘{query}’</h2>

      {/* 아티스트 */}
      <div className="mb-6">
        <h3 className="flex items-center text-md font-semibold mb-2 text-gray-700">
          <Mic className="w-4 h-4 mr-2" /> Artists
        </h3>
        {results.artists.length === 0 ? (
          <p className="text-gray-400 text-sm">No artist found</p>
        ) : (
          <ul className="bg-gray-100 rounded divide-y divide-gray-200">
            {(expandedSection === "artist" ? results.artists : results.artists.slice(0, 3)).map((artist) => (
              <li key={artist.id} className="flex items-center gap-3 p-2 hover:bg-gray-200">
                <img src={artist.image_url} alt={artist.name} className="w-10 h-10 rounded object-cover" />
                <Link to={`/artist/${artist.slug}`} onClick={onClose} className="text-gray-800 font-medium">
                  {artist.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
        {results.artists.length > 3 && (
          <button
            onClick={() => setExpandedSection(expandedSection === "artist" ? null : "artist")}
            className="text-xs text-gray-500 mt-1 hover:underline"
          >
            {expandedSection === "artist" ? "Show less" : "Show more results"}
          </button>
        )}
      </div>

      {/* 앨범 */}
      <div className="mb-6">
        <h3 className="flex items-center text-md font-semibold mb-2 text-gray-700">
          <Disc className="w-4 h-4 mr-2" /> Albums
        </h3>
        {results.albums.length === 0 ? (
          <p className="text-gray-400 text-sm">No album found</p>
        ) : (
          <ul className="bg-gray-100 rounded divide-y divide-gray-200">
            {(expandedSection === "album" ? results.albums : results.albums.slice(0, 3)).map((album) => (
              <li key={album.id} className="flex items-center gap-3 p-2 hover:bg-gray-200">
                <img src={album.image_url} alt={album.title} className="w-10 h-10 rounded object-cover" />
                <Link
                  to={`/album/${album.artist_slug}/${album.slug}`}
                  onClick={onClose}
                  className="text-gray-800 font-medium"
                >
                  {album.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
        {results.albums.length > 3 && (
          <button
            onClick={() => setExpandedSection(expandedSection === "album" ? null : "album")}
            className="text-xs text-gray-500 mt-1 hover:underline"
          >
            {expandedSection === "album" ? "Show less" : "Show more results"}
          </button>
        )}
      </div>

      {/* 곡 */}
      <div>
        <h3 className="flex items-center text-md font-semibold mb-2 text-gray-700">
          <Music className="w-4 h-4 mr-2" /> Songs
        </h3>
        {results.songs.length === 0 ? (
          <p className="text-gray-400 text-sm">No song found</p>
        ) : (
          <ul className="bg-gray-100 rounded divide-y divide-gray-200">
            {(expandedSection === "song" ? results.songs : results.songs.slice(0, 3)).map((song) => (
              <li key={song.id} className="flex items-center gap-3 p-2 hover:bg-gray-200">
                <img src={song.album_image_url} alt={song.title} className="w-10 h-10 rounded object-cover" />
                <span className="text-gray-800 font-medium">{song.title}</span>
              </li>
            ))}
          </ul>
        )}
        {results.songs.length > 3 && (
          <button
            onClick={() => setExpandedSection(expandedSection === "song" ? null : "song")}
            className="text-xs text-gray-500 mt-1 hover:underline"
          >
            {expandedSection === "song" ? "Show less" : "Show more results"}
          </button>
        )}
      </div>
    </div>
  );
}

export default SearchDropdown;
