// src/pages/AddContentPage.jsx
import { useState, useEffect } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";
import axios from "axios";
import { getToken } from "../utils/getToken";
import { useNavigate } from "react-router-dom";

function AddContentPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("artist");

  // Artist State
  const [name, setName] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [about, setAbout] = useState("");
  const [type, setType] = useState("solo");
  const [genre, setGenre] = useState("");
  const [formedDate, setFormedDate] = useState("");
  const [description, setDescription] = useState("");

  // Album State
  const [albumTitle, setAlbumTitle] = useState("");
  const [albumArtistId, setAlbumArtistId] = useState("");
  const [albumType, setAlbumType] = useState("album");
  const [albumGenre, setAlbumGenre] = useState("");
  const [albumDesc, setAlbumDesc] = useState("");
  const [albumDate, setAlbumDate] = useState("");
  const [albumImageFile, setAlbumImageFile] = useState(null);
  const [albumImageUrl, setAlbumImageUrl] = useState("");
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [tracks, setTracks] = useState([{ title: "", track_number: 1, lyrics: "" }]);

  const [artistQuery, setArtistQuery] = useState("");
  const [artistOptions, setArtistOptions] = useState([]);
  const [showArtistDropdown, setShowArtistDropdown] = useState(false);

  // News state
  const [newsTitle, setNewsTitle] = useState("");
  const [newsSummary, setNewsSummary] = useState("");
  const [newsImageFile, setNewsImageFile] = useState(null);
  const [newsImageUrl, setNewsImageUrl] = useState("");
  const [newsContent, setNewsContent] = useState("");

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (artistQuery.trim()) {
        axios
          .get(`/api/search?q=${encodeURIComponent(artistQuery)}`)
          .then((res) => {
            setArtistOptions(res.data.artists);
            setShowArtistDropdown(true);
          })
          .catch((err) => console.error("검색 실패:", err));
      } else {
        setShowArtistDropdown(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [artistQuery]);

  const handleUploadPhoto = async (file, path, setUrl) => {
    if (!file) return;
    const fileRef = ref(storage, `${path}/${file.name}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    setUrl(url);
    alert("사진 업로드 완료!");
  };

  const handleSubmitArtist = async () => {
    const token = await getToken();
    if (!token) return alert("로그인이 필요합니다.");
    if (!name || !photoUrl) return alert("이름과 사진은 필수입니다.");
    try {
      const response = await axios.post(
        "/api/artists",
        {
          name,
          image_url: photoUrl,
          members: about,
          bio: description,
          type,
          genre,
          formed_date: formedDate
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const slug = response.data.slug;
      alert("아티스트 등록 완료");
      navigate(`/artist/${slug}`);
    } catch (err) {
      console.error("아티스트 등록 실패:", err);
      alert("등록 실패");
    }
  };

  const handleSubmitAlbum = async () => {
    const token = await getToken();
    if (!token) return alert("로그인이 필요합니다.");
    const artistIds = albumType === "collaboration" ? selectedArtists.map((a) => a.id) : [albumArtistId];
    if (!albumTitle || !albumImageUrl || artistIds.length === 0) return alert("필수 항목 누락");
    try {
      const res = await axios.post(
        "/api/albums",
        {
          title: albumTitle,
          artist_id: artistIds[0],
          artist_ids: artistIds,
          genre: albumGenre,
          description: albumDesc,
          release_date: albumDate,
          image_url: albumImageUrl,
          type: albumType,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const albumId = res.data.album_id;

      for (const track of tracks) {
        if (track.title.trim()) {
          await axios.post("/api/songs", {
            title: track.title,
            track_number: track.track_number,
            lyrics: track.lyrics,
            album_id: albumId,
          });
        }
      }
      const slug =res.data.slug;
      const artistSlug = res.data.artist_slug;
      alert("앨범 및 수록곡 등록 완료");
      navigate(`/album/${artistSlug}/${slug}`);
    } catch (err) {
      console.error("앨범 등록 실패:", err);
      alert("등록 실패");
    }
  };

  const handleSubmitNews = async () => {
    const token = await getToken();
    if (!token) return alert("로그인이 필요합니다.");
    if (!newsTitle || !newsSummary || !newsContent) return alert("모든 필드를 입력해주세요.");
    try {
      const response = await axios.post(
        "/api/news",
        {
          title: newsTitle,
          summary: newsSummary,
          content: newsContent,
          image_url: newsImageUrl,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const newsId = response.data.news_id;
      alert("뉴스 등록 완료");
      navigate(`/news/${newsId}`);
    } catch (err) {
      console.error("뉴스 등록 실패:", err);
      alert("뉴스 등록 실패");
    }
  };


  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Add a Content</h1>

      <div className="flex border rounded overflow-hidden mb-6">
        <button
          onClick={() => setActiveTab("artist")}
          className={`flex-1 p-2 ${activeTab === "artist" ? "bg-gray-300" : "bg-white"}`}
        >
          Add Artist
        </button>
        <button
          onClick={() => setActiveTab("album")}
          className={`flex-1 p-2 ${activeTab === "album" ? "bg-gray-300" : "bg-white"}`}
        >
          Add Album / Single 
        </button>
        <button
          onClick={() => setActiveTab("news")}
          className={`flex-1 p-2 ${activeTab === "news" ? "bg-gray-300" : "bg-white"}`}
        >
          Add News
        </button>
      </div>

      {activeTab === "artist" && (
        <div className="space-y-4">
          <label className="block">
            Name
            <input type="text" className="w-full border p-2 rounded mt-1" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <div>
            <label>Photo Upload</label>
            <div className="flex gap-4 items-center mt-1">
              <input type="file" onChange={(e) => setPhotoFile(e.target.files[0])} />
              <button onClick={() => handleUploadPhoto(photoFile, "artists", setPhotoUrl)} className="bg-blue-500 text-white px-3 py-1 rounded">Upload</button>
            </div>
          </div>
          <label className="block">
            {type === "solo" ? "Also Known As" : "Members"}
            <input
              type="text"
              className="w-full border p-2 rounded mt-1"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
            />
          </label>
          <div className="flex gap-4">
            <label className="flex-1">
              Type
              <select className="w-full border p-2 rounded mt-1" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="solo">Solo</option>
                <option value="group">Group</option>
              </select>
            </label>
            <label className="flex-1">
              Genre
              <input type="text" className="w-full border p-2 rounded mt-1" value={genre} onChange={(e) => setGenre(e.target.value)} />
            </label>
          </div>
          {type === "group" && (
            <label className="block">
              Formed Date
              <input
                type="date"
                className="w-full border p-2 rounded mt-1"
                value={formedDate}
                onChange={(e) => setFormedDate(e.target.value)}
              />
            </label>
          )}

          <label className="block">
            Bio (description)
            <textarea className="w-full border p-2 rounded mt-1" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <button onClick={handleSubmitArtist} className="w-full bg-black text-white p-2 rounded mt-4">
            Submit
          </button>
        </div>
      )}

      {activeTab === "news" && (
  <div className="space-y-4">
    <label className="block">
      Title
      <input
        type="text"
        className="w-full border p-2 rounded mt-1"
        value={newsTitle}
        onChange={(e) => setNewsTitle(e.target.value)}
      />
    </label>
    <label className="block">
      Summary
      <input
        type="text"
        className="w-full border p-2 rounded mt-1"
        value={newsSummary}
        onChange={(e) => setNewsSummary(e.target.value)}
        placeholder="뉴스 내용을 요약해 주세요 (1~2문장)"
      />
    </label>
    <label className="block">
      Content
      <textarea
        className="w-full border p-2 rounded mt-1"
        rows={6}
        value={newsContent}
        onChange={(e) => setNewsContent(e.target.value)}
      />
    </label>

    <div>
      <label>Cover Image</label>
      <div className="flex gap-4 items-center mt-1">
        <input type="file" onChange={(e) => setNewsImageFile(e.target.files[0])} />
        <button
          onClick={() => handleUploadPhoto(newsImageFile, "news", setNewsImageUrl)}
          className="bg-blue-500 text-white px-3 py-1 rounded"
        >
          Upload
        </button>
      </div>
    </div>

    <button
      onClick={handleSubmitNews}
      className="w-full bg-black text-white p-2 rounded mt-4"
    >
      Submit News
    </button>
  </div>
)}


      {activeTab === "album" && (
        <div className="space-y-4">
          <label className="block">
            Title
            <input type="text" className="w-full border p-2 rounded mt-1" value={albumTitle} onChange={(e) => setAlbumTitle(e.target.value)} />
          </label>

          {albumType !== "collaboration" ? (
            <label className="block relative">
              Artist
              <input
                type="text"
                className="w-full border p-2 rounded mt-1"
                value={artistQuery}
                onChange={(e) => {
                  setArtistQuery(e.target.value);
                  setAlbumArtistId("");
                }}
                placeholder="Search artist by name"
              />
              {showArtistDropdown && artistOptions.length > 0 && (
                <ul className="absolute z-50 bg-white border rounded w-full max-h-60 overflow-y-auto shadow mt-1">
                  {artistOptions.map((artist) => (
                    <li
                      key={artist.id}
                      onClick={() => {
                        setAlbumArtistId(artist.id);
                        setArtistQuery(artist.name);
                        setShowArtistDropdown(false);
                      }}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                    >
                      <img src={artist.image_url} alt={artist.name} className="w-6 h-6 object-cover rounded-full" />
                      <span>{artist.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </label>
          ) : (
            <label className="block relative">
              Artists (Collaboration)
              <input
                type="text"
                className="w-full border p-2 rounded mt-1"
                value={artistQuery}
                onChange={(e) => setArtistQuery(e.target.value)}
                placeholder="Search and select multiple artists"
              />
              {showArtistDropdown && artistOptions.length > 0 && (
                <ul className="absolute z-50 bg-white border rounded w-full max-h-60 overflow-y-auto shadow mt-1">
                  {artistOptions.map((artist) => (
                    <li
                      key={artist.id}
                      onClick={() => {
                        if (!selectedArtists.some((a) => a.id === artist.id)) {
                          setSelectedArtists([...selectedArtists, { id: artist.id, name: artist.name }]);
                        }
                        setShowArtistDropdown(false);
                        setArtistQuery("");
                      }}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                    >
                      <img src={artist.image_url} alt={artist.name} className="w-6 h-6 object-cover rounded-full" />
                      <span>{artist.name}</span>
                    </li>
                  ))}
                </ul>
              )}
              <ul className="flex gap-2 flex-wrap mt-2">
                {selectedArtists.map((artist) => (
                  <li key={artist.id} className="bg-gray-200 px-2 py-1 rounded text-sm flex items-center gap-1">
                    {artist.name}
                    <button onClick={() => setSelectedArtists(selectedArtists.filter((x) => x.id !== artist.id))}>
                      ❌
                    </button>
                  </li>
                ))}
              </ul>
            </label>
          )}

          <label className="block">
            Type
            <select className="w-full border p-2 rounded mt-1" value={albumType} onChange={(e) => setAlbumType(e.target.value)}>
              <option value="album">Album</option>
              <option value="ep">EP</option>
              <option value="single">Single</option>
              <option value="collaboration">Collaboration</option>
            </select>
          </label>

          <label className="block">
            Genre
            <input type="text" className="w-full border p-2 rounded mt-1" value={albumGenre} onChange={(e) => setAlbumGenre(e.target.value)} />
          </label>

          <label className="block">
            Description
            <textarea className="w-full border p-2 rounded mt-1" rows={3} value={albumDesc} onChange={(e) => setAlbumDesc(e.target.value)} />
          </label>

          <label className="block">
            Release Date
            <input type="date" className="w-full border p-2 rounded mt-1" value={albumDate} onChange={(e) => setAlbumDate(e.target.value)} />
          </label>

          <div>
            <label>Album Cover Upload</label>
            <div className="flex gap-4 items-center mt-1">
              <input type="file" onChange={(e) => setAlbumImageFile(e.target.files[0])} />
              <button onClick={() => handleUploadPhoto(albumImageFile, "albums", setAlbumImageUrl)} className="bg-blue-500 text-white px-3 py-1 rounded">Upload</button>
            </div>
          </div>

          <div>
            <label className="block text-lg font-semibold mt-6">Tracks</label>
            {tracks.map((track, index) => (
              <div key={index} className="border p-3 rounded mb-3 relative">
                <button
                  type="button"
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-sm"
                  onClick={() => {
                    const updated = tracks.filter((_, i) => i !== index);
                    setTracks(updated);
                  }}
                >
                  ❌
                </button>
                <label className="block mb-1">
                  Title
                  <input
                    type="text"
                    className="w-full border p-1 rounded"
                    value={track.title}
                    onChange={(e) => {
                      const updated = [...tracks];
                      updated[index].title = e.target.value;
                      setTracks(updated);
                    }}
                  />
                </label>
                <label className="block mb-1">
                  Track #
                  <input
                    type="number"
                    className="w-full border p-1 rounded"
                    value={track.track_number}
                    onChange={(e) => {
                      const updated = [...tracks];
                      updated[index].track_number = Number(e.target.value);
                      setTracks(updated);
                    }}
                  />
                </label>
                <label className="block mb-1">
                  Lyrics
                  <textarea
                    className="w-full border p-1 rounded"
                    rows={2}
                    value={track.lyrics}
                    onChange={(e) => {
                      const updated = [...tracks];
                      updated[index].lyrics = e.target.value;
                      setTracks(updated);
                    }}
                  />
                </label>
              </div>
            ))}
            <button
              type="button"
              className="text-blue-600 hover:underline text-sm"
              onClick={() =>
                setTracks([...tracks, { title: "", track_number: tracks.length + 1, lyrics: "" }])
              }
            >
              + Add Track
            </button>
          </div>

          <button onClick={handleSubmitAlbum} className="w-full bg-black text-white p-2 rounded mt-4">
            Submit
          </button>
        </div>
      )}
    </div>
  );
}

export default AddContentPage;
