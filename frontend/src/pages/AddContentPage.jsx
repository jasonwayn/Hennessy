import { useState, useEffect } from "react";
import axios from "axios";
import { getToken } from "../utils/getToken";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useLoginModal } from "../contexts/LoginModalContext";
import ImageCropUploader from "../components/ImageCropUploader";
import AlertModal from "../components/AlertModal";

function AddContentPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { openLoginModal } = useLoginModal();
  const [activeTab, setActiveTab] = useState("artist");

  const [name, setName] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [about, setAbout] = useState("");
  const [type, setType] = useState("solo");
  const [genre, setGenre] = useState("");
  const [formedDate, setFormedDate] = useState("");
  const [description, setDescription] = useState("");

  const [albumTitle, setAlbumTitle] = useState("");
  const [albumArtistId, setAlbumArtistId] = useState("");
  const [albumType, setAlbumType] = useState("album");
  const [albumGenre, setAlbumGenre] = useState("");
  const [albumDesc, setAlbumDesc] = useState("");
  const [albumDate, setAlbumDate] = useState("");
  const [albumImageUrl, setAlbumImageUrl] = useState("");
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [tracks, setTracks] = useState([{ title: "", track_number: 1, lyrics: "" }]);

  const [artistQuery, setArtistQuery] = useState("");
  const [artistOptions, setArtistOptions] = useState([]);
  const [showArtistDropdown, setShowArtistDropdown] = useState(false);

  // News state
  const [newsTitle, setNewsTitle] = useState("");
  const [newsSummary, setNewsSummary] = useState("");
  const [newsImageUrl, setNewsImageUrl] = useState("");
  const [newsContent, setNewsContent] = useState("");
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  useEffect(() => {
  if (!loading && !user) {
    openLoginModal();       
    navigate("/news");       
  }
}, [loading, user, navigate]);

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

  const handleSubmitArtist = async () => {
    const token = await getToken();
    if (!token) {
      setAlertMessage("로그인이 필요합니다.");
      setAlertOpen(true);
      return;
    }

    if (!name || !photoUrl) {
      setAlertMessage("이름과 사진은 필수입니다.");
      setAlertOpen(true);
      return;
    }
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
          formed_date: type === "group" ? formedDate : null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate(`/artist/${response.data.slug}`);
    } catch (err) {
      setAlertMessage("아티스트 등록 실패");
      setAlertOpen(true);
    }
  };

const handleSubmitAlbum = async () => {
  const token = await getToken();
  if (!token) {
    setAlertMessage("로그인이 필요합니다.");
    setAlertOpen(true);
    return;
  }

  const artistIds = albumType === "collaboration"
    ? selectedArtists.map((a) => a.id)
    : [albumArtistId];

  if (artistIds.length === 0 || !artistIds[0]) {
    setAlertMessage("존재하지 않는 아티스트입니다. 자동완성에서 아티스트를 선택해주세요.");
    setAlertOpen(true);
    return;
  }

  if (!albumTitle || !albumImageUrl || artistIds.length === 0) {
    setAlertMessage("모든 필드를 입력해주세요.");
    setAlertOpen(true);
    return;
  }

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

    const slug = res.data.slug;
    const artistSlug = res.data.artist_slug;
    setTimeout(() => navigate(`/album/${artistSlug}/${slug}`), 1000); 
  } catch (err) {
    console.error("앨범 등록 실패:", err);
    setAlertMessage("앨범 등록 중 오류가 발생했습니다.");
    setAlertOpen(true);
  }
};


  const handleSubmitNews = async () => {
    const token = await getToken();
      if (!token) {
        setAlertMessage("로그인이 필요합니다.");
        setAlertOpen(true);
        return;
      }

      if (!newsTitle || !newsSummary || !newsContent) {
        setAlertMessage("모든 필드를 입력해주세요.");
        setAlertOpen(true);
        return;
      }
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
      navigate(`/news/${newsId}`);
    } catch (err) {
      setAlertMessage("뉴스 등록 실패");
      setAlertOpen(true);
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
          아티스트 등록
        </button>
        <button
          onClick={() => setActiveTab("album")}
          className={`flex-1 p-2 ${activeTab === "album" ? "bg-gray-300" : "bg-white"}`}
        >
          앨범 / 싱글 등록
        </button>
        <button
          onClick={() => setActiveTab("news")}
          className={`flex-1 p-2 ${activeTab === "news" ? "bg-gray-300" : "bg-white"}`}
        >
          뉴스 작성
        </button>
      </div>

      {activeTab === "artist" && (
        <div className="space-y-4">
          <label className="block">
            이름
            <input type="text" className="w-full border p-2 rounded mt-1" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
            <div>
              <label className="block text-sm font-medium mb-1">이미지 업로드</label>
              <ImageCropUploader
                storagePath="artists"
                aspect={1}
                cropShape="rect"
                onComplete={(url) => setPhotoUrl(url)}
              />
            </div>

            {photoUrl && (
              <img
                src={photoUrl}
                alt="아티스트 프로필 미리보기"
                className="w-32 h-32 object-cover rounded mt-2"
              />
            )}
          <label className="block">
            {type === "solo" ? "Also Known As" : "구성원"}
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
              장르
              <input type="text" className="w-full border p-2 rounded mt-1" value={genre} onChange={(e) => setGenre(e.target.value)} />
            </label>
          </div>
          {type === "group" && (
            <label className="block">
              결성일
              <input
                type="date"
                className="w-full border p-2 rounded mt-1"
                value={formedDate}
                onChange={(e) => setFormedDate(e.target.value)}
              />
            </label>
          )}

          <label className="block">
            소개
            <textarea className="w-full border p-2 rounded mt-1" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <button onClick={handleSubmitArtist} className="w-full bg-black text-white p-2 rounded mt-4">
            아티스트 저장
          </button>
        </div>
      )}

      {activeTab === "news" && (
  <div className="space-y-4">
    <label className="block">
      제목
      <input
        type="text"
        className="w-full border p-2 rounded mt-1"
        value={newsTitle}
        onChange={(e) => setNewsTitle(e.target.value)}
      />
    </label>
    <label className="block">
      요약
      <input
        type="text"
        className="w-full border p-2 rounded mt-1"
        value={newsSummary}
        onChange={(e) => setNewsSummary(e.target.value)}
        placeholder="뉴스 내용을 요약해 주세요 (1~2문장)"
      />
    </label>
    <label className="block">
      내용
      <textarea
        className="w-full border p-2 rounded mt-1"
        rows={6}
        value={newsContent}
        onChange={(e) => setNewsContent(e.target.value)}
      />
    </label>

<div>
  <label className="block text-sm font-medium mb-1">이미지 업로드</label>
  <ImageCropUploader
    storagePath="news"
    aspect={16 / 9}
    cropShape="rect"
    onComplete={(url) => setNewsImageUrl(url)}
  />
</div>

{newsImageUrl && (
  <img
    src={newsImageUrl}
    alt="뉴스 이미지 미리보기"
    className="w-full h-48 object-cover rounded mb-4"
  />
)}

    <button
      onClick={handleSubmitNews}
      className="w-full bg-black text-white p-2 rounded mt-4"
    >
      뉴스 저장
    </button>
  </div>
)}


      {activeTab === "album" && (
        <div className="space-y-4">
          <label className="block">
            앨범명
            <input type="text" className="w-full border p-2 rounded mt-1" value={albumTitle} onChange={(e) => setAlbumTitle(e.target.value)} />
          </label>

          {albumType !== "collaboration" ? (
            <label className="block relative">
              아티스트
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
            장르
            <input type="text" className="w-full border p-2 rounded mt-1" value={albumGenre} onChange={(e) => setAlbumGenre(e.target.value)} />
          </label>

          <label className="block">
            앨범 소개
            <textarea className="w-full border p-2 rounded mt-1" rows={3} value={albumDesc} onChange={(e) => setAlbumDesc(e.target.value)} />
          </label>

          <label className="block">
            발매일
            <input type="date" className="w-full border p-2 rounded mt-1" value={albumDate} onChange={(e) => setAlbumDate(e.target.value)} />
          </label>

          <div>
            <label className="block text-sm font-medium mb-1">앨범 커버</label>
            <ImageCropUploader
              storagePath="albums"
              aspect={1}
              cropShape="rect"
              onComplete={(url) => setAlbumImageUrl(url)}
            />
          </div>

          {albumImageUrl && (
            <img
              src={albumImageUrl}
              alt="앨범 커버 미리보기"
              className="aspect-square w-full object-cover rounded mb-4"
            />
          )}


          <div>
            <label className="block text-lg font-semibold mt-6">수록곡</label>
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
                <p className="text-sm mb-1 font-medium text-gray-700">Track {index + 1}</p>

                <label className="block mb-1">
                  가사
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
              + 곡 추가
            </button>
          </div>

          <button onClick={handleSubmitAlbum} className="w-full bg-black text-white p-2 rounded mt-4">
            저장
          </button>
        </div>
      )}
    <AlertModal
      isOpen={alertOpen}
      title="알림"
      description={alertMessage}
      onClose={() => setAlertOpen(false)}
    />     
    </div>
  );
}


export default AddContentPage;
