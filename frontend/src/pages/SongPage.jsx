import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "../utils/getToken";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AlertModal from "../components/AlertModal";
import ConfirmModal from "../components/ConfirmModal";
import { Heart } from "lucide-react";


function SongPage() {
  const { id } = useParams();
  const [song, setSong] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedText, setSelectedText] = useState(null);
  const [activeTab, setActiveTab] = useState("translation");
  const [annotations, setAnnotations] = useState([]);
  const [newAnnotation, setNewAnnotation] = useState("");
  const [description, setDescription] = useState("");
  const [credits, setCredits] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const { user } = useAuth();
  const [isWriting, setIsWriting] = useState(false);
  const [creditArtists, setCreditArtists] = useState([]);

  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionResults, setMentionResults] = useState([]);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [saveErrorModalOpen, setSaveErrorModalOpen] = useState(false);
  const [editErrorModalOpen, setEditErrorModalOpen] = useState(false);
  const [deleteErrorModalOpen, setDeleteErrorModalOpen] = useState(false);
  const [likeErrorModalOpen, setLikeErrorModalOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");

  useEffect(() => {
    axios
      .get(`/api/songs/${id}`)
      .then((res) => {
        const data = res.data;
        setSong(data);
        setDescription(data.description || "");
        setCredits(data.credits || "");
        setLoading(false);
      })
      .catch((err) => {
        console.error("곡 정보 로딩 실패:", err);
        setLoading(false);
      });
  }, [id]);

useEffect(() => {
  const handleClickOutside = (e) => {
    const isLyricsClick = e.target.closest(".lyrics-line");
    const isPanelClick = e.target.closest(".annotation-panel");

    // 주석 작성 중일 땐 selectedText를 유지
    if (!isLyricsClick && !isPanelClick && !isWriting) {
      setSelectedText(null);
    }

    if (!isPanelClick) {
      setIsWriting(false); // 작성 중 상태는 닫을 수 있음
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, [isWriting]);

useEffect(() => {
  if (!credits) return;

  const matches = [...credits.matchAll(/@([\w\s]+)/g)].map((m) => m[1].trim());
  const unique = [...new Set(matches)];

  Promise.all(
    unique.map((name) =>
      axios
        .get(`/api/artists/search`, { params: { name: name.trim() } })  // ✅ 오타 수정
        .then((res) => {
          if (Array.isArray(res.data) && res.data.length > 0) {
            return { name, data: res.data[0] };
          } else {
            return { name, data: null };
          }
        })
        .catch(() => ({ name, data: null }))
    )
  ).then((results) => setCreditArtists(results));
}, [credits]);


useEffect(() => {
  if (!mentionQuery) return;

  axios
    .get("/api/artists/search", { params: { name: mentionQuery } })
    .then((res) => setMentionResults(res.data))
    .catch((err) => {
      console.error("자동완성 실패:", err);
      setMentionResults([]);
    });
}, [mentionQuery]);


  const handleLineClick = (line) => {
    setSelectedText(line);
    setIsWriting(false);
    axios
      .get("/api/song-annotations", {
        params: { song_id: song.id, line },
      })
      .then((res) => setAnnotations(res.data))
      .catch((err) => console.error("주석 조회 실패:", err));
  };

  const handleAnnotationSubmit = async () => {
    if (!newAnnotation.trim()) return;
    try {
      const token = await getToken();
      await axios.post(
        "/api/song-annotations",
        {
          song_id: song.id,
          line: selectedText,
          content: newAnnotation,
          type: activeTab,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setNewAnnotation("");
      setIsWriting(false);
      handleLineClick(selectedText);
    } catch (err) {
      console.error("주석 등록 실패:", err);
    }
  };

  const handleSaveDetails = async () => {
    try {
      const token = await getToken();
      await axios.patch(
        `/api/songs/${id}/details`,
        { description, credits },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsEditing(false);
    } catch (err) {
      console.error("곡 정보 저장 실패:", err);
      setSaveErrorModalOpen(true);
    }
  };

  const handleEditAnnotation = async (annotationId, newContent) => {
    try {
      const token = await getToken();
      await axios.patch(
        `/api/song-annotations/${annotationId}`,
        { content: newContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      handleLineClick(selectedText);
    } catch (err) {
      console.error("주석 수정 실패:", err);
      setEditErrorModalOpen(true);
    }
  };

  const handleDeleteAnnotation = (annotationId) => {
    setConfirmDeleteId(annotationId); // 삭제 모달 띄우기
  };
  
  const confirmDelete = async () => {
    try {
      const token = await getToken();
      await axios.delete(`/api/song-annotations/${confirmDeleteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConfirmDeleteId(null);
      handleLineClick(selectedText);
    } catch (err) {
      console.error("주석 삭제 실패:", err);
      setDeleteErrorModalOpen(true);
    }
  };


  const handleToggleLike = async (annotationId) => {
    setAnnotations((prev) =>
      prev.map((a) =>
        a.id === annotationId
          ? { ...a, liked: !a.liked, likes: a.liked ? a.likes - 1 : a.likes + 1 }
          : a
      )
    );
  
    try {
      const token = await getToken();
      await axios.post(
        `/api/song-annotations/${annotationId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("좋아요 실패:", err);
      setLikeErrorModalOpen(true);
    }
  };


  const renderLyrics = () =>
  song?.lyrics?.split("\n").map((line, idx) => (
    <p
      key={idx}
      onClick={() => handleLineClick(line)}
      className={`lyrics-line group flex items-center gap-3 cursor-pointer px-2 py-1 rounded ${
        selectedText === line ? "bg-yellow-200" : "hover:bg-gray-100"
      }`}
    >
      <span className="text-xs text-gray-400 font-mono w-6">{String(idx + 1).padStart(2, "0")}</span>
      <span>{line}</span>
    </p>
  ));

const renderCreditsWithLinks = (text) => {
  const parts = text.split(/(@\w[\w\s]*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("@")) {
      const name = part.slice(1).trim();
      const artist = creditArtists.find((a) => a.name === name && a.data);
      const slug = artist?.data?.slug || name.toLowerCase().replace(/\s+/g, "-");
      return (
        <Link
          key={index}
          to={`/artist/${slug}`}
          className="inline-flex items-center gap-2 text-blue-600 hover:underline"
        >
          {artist?.data?.image_url && (
            <img
              src={artist.data.image_url}
              alt={name}
              className="w-4 h-4 rounded-full object-cover"
            />
          )}
          {part}
        </Link>
      );
    } else {
      return <span key={index}>{part}</span>;
    }
  });
};

const handleCreditsChange = (e) => {
  const value = e.target.value;
  setCredits(value);

  // @로 시작하는 단어 추출
  const match = value.match(/@(\w{2,})$/); // 최소 2글자 이상
  if (match) {
    const query = match[1];
    setMentionQuery(query);
    setShowMentionDropdown(true);
  } else {
    setShowMentionDropdown(false);
    setMentionResults([]);
  }
};

const handleMentionSelect = (artist) => {
  // 마지막 @이후 단어를 artist.name으로 교체
  const newCredits = credits.replace(/@(\w{2,})$/, `@${artist.name} `);
  setCredits(newCredits);
  setShowMentionDropdown(false);
  setMentionResults([]);
};

  if (loading) return <div className="p-6 text-center">로딩 중...</div>;
  if (!song) return <div className="p-6 text-center">곡을 찾을 수 없습니다.</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-4">
          <img src={song.album_image_url} alt="Album Cover" className="w-full rounded shadow" />
          <div>
            <h2 className="text-sm text-gray-500 font-medium">앨범</h2>
            <Link to={`/album/${song.artist_slug}/${song.album_slug}`} className="font-bold text-base hover:underline">
              {song.album_title}
            </Link>
          </div>
          <div>
            <h2 className="text-sm text-gray-500 font-medium">아티스트</h2>
            <Link to={`/artist/${song.artist_slug}`} className="font-bold text-base hover:underline">
              {song.artist_name}
            </Link>
          </div>
          {user && (
            <button onClick={() => setIsEditing(true)} className="text-sm bg-gray-100 px-3 py-1 rounded hover:bg-gray-200">
              편집
            </button>
          )}
          <div>
            <h2 className="font-semibold text-sm mt-4 mb-1">ABOUT SONG</h2>
            {isEditing ? (
              <textarea className="w-full border p-2 rounded" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            ) : (
              <p className="text-sm text-gray-800 whitespace-pre-line">{description || ""}</p>
            )}
          </div>
          <div>
            <h2 className="font-semibold text-sm mt-4 mb-1">CREDITS</h2>
            {isEditing ? (
              <div className="relative">
                <textarea
                  className="w-full border p-2 rounded"
                  rows={2}
                  value={credits}
                  onChange={handleCreditsChange} // ✅ 자동완성 트리거 함수
                />
                {showMentionDropdown && mentionResults.length > 0 && (
                  <div className="absolute bg-white border w-full rounded-lg shadow-lg max-h-60 overflow-y-auto z-10 mt-1">
                    {mentionResults.map((artist) => (
                      <div
                        key={artist.id}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleMentionSelect(artist)} // ✅ 자동완성 선택
                      >
                        {artist.image_url && (
                          <img
                            src={artist.image_url}
                            alt={artist.name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        )}
                        <span className="text-sm">{artist.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-800 whitespace-pre-line">{renderCreditsWithLinks(credits)}</p>
            )}
          </div>

          {isEditing && (
            <button onClick={handleSaveDetails} className="w-full mt-2 bg-black text-white py-2 rounded">
              저장하기
            </button>
          )}
        </div>

        <div className="md:col-span-2">
          <h1 className="text-2xl font-bold mb-4">{song.title}</h1>
          <div className="bg-white p-4 rounded shadow whitespace-pre-wrap">{renderLyrics()}</div>
        </div>

        <div className="md:col-span-1 w-full md:w-[320px] lg:w-[360px] xl:w-[400px]">
          {selectedText ? (
            <div className="annotation-panel p-4 bg-white">
              <div className="flex space-x-4 border-b pb-2 mb-3 text-sm">
                <div
                  onClick={() => setActiveTab("translation")}
                  className={`cursor-pointer px-4 py-1 rounded-t-md transition ${
                    activeTab === "translation"
                      ? "bg-blue-100 text-blue-700 font-semibold"
                      : "text-gray-500 hover:text-blue-600"
                  }`}
                >
                  번역
                </div>
                <div onClick={() => setActiveTab("interpretation")} className={`cursor-pointer px-2 pb-1 ${activeTab === "interpretation" ? "border-b-2 border-blue-500 font-semibold" : "text-gray-500"}`}>
                  해석
                </div>
              </div>

              {isWriting ? (
                user ? (
                  <div className="mt-4">
                    <textarea
                      className="w-full border p-2 rounded mb-2"
                      rows={4}
                      placeholder={`여기에 ${activeTab === "translation" ? "번역" : "해석"}을 입력하세요`}
                      value={newAnnotation}
                      onChange={(e) => setNewAnnotation(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button onClick={handleAnnotationSubmit} className="bg-green-500 text-white px-4 py-2 rounded">등록</button>
                      <button onClick={() => { setNewAnnotation(""); setIsWriting(false); }} className="text-sm text-gray-500 hover:underline">취소</button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mt-2">로그인 후 주석을 작성할 수 있습니다.</p>
                )
              ) : (
                <>
                  {annotations.filter((a) => a.type === activeTab).length === 0 ? (
                    <p className="text-gray-500 text-sm">아직 주석이 없습니다.</p>
                  ) : (
                    annotations.filter((a) => a.type === activeTab).map((a) => {
                      const isAuthor = user?.email === a.user_email;
                      return (
                        <div key={a.id} className="mb-3 p-3 border rounded-lg bg-gray-50">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              {a.profile_image_url && (
                                <img
                                  src={a.profile_image_url}
                                  alt="profile"
                                  className="w-6 h-6 rounded-full object-cover"
                                />
                              )}
                              <Link
                                to={`/user/${a.user_id}`} 
                                className="text-sm font-medium text-blue-600 hover:underline"
                              >
                                {a.nickname}
                              </Link>
                            </div>

                            <div className="flex gap-2 items-center">
                              <button
                                onClick={() => handleToggleLike(a.id)}
                                className={`flex items-center gap-1 px-2 py-1 rounded-full border transition ${
                                  a.liked ? "border-blue-500 text-blue-500" : "border-gray-400 text-gray-700"
                                } hover:bg-gray-50`}
                              >
                                <Heart className="w-4 h-4" strokeWidth={2} />
                                <span className="text-sm">{a.likes}</span>
                              </button>


                              {isAuthor && (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingId(a.id);
                                      setEditingText(a.content);
                                    }}
                                    className="text-xs text-blue-600 hover:underline"
                                  >
                                    수정
                                  </button>
                                  <button onClick={() => handleDeleteAnnotation(a.id)} className="text-xs text-red-600 hover:underline">삭제</button>
                                </>
                              )}
                            </div>
                          </div>
                          {editingId === a.id ? (
                            <div className="mt-2 space-y-2">
                              <textarea
                                className="w-full border p-2 rounded text-sm"
                                rows={4}
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    handleEditAnnotation(a.id, editingText);
                                    setEditingId(null);
                                  }}
                                  className="text-sm text-white bg-blue-600 px-3 py-1 rounded"
                                >
                                  저장
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="text-sm text-gray-500 hover:underline"
                                >
                                  취소
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-800 whitespace-pre-line">{a.content}</p>
                          )}
                        </div>
                      );
                    })
                  )}
                  {user ? (
                    <button onClick={() => setIsWriting(true)} className="text-sm text-blue-600 hover:underline mt-3">
                      ➕ 새 주석 작성하기
                    </button>
                  ) : (
                    <p className="text-sm text-gray-500 mt-2">로그인 후 주석을 작성할 수 있습니다.</p>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="text-gray-500 text-sm">가사를 클릭하면 주석을 확인할 수 있습니다.</div>
          )}
        </div>
      </div>
          <AlertModal
            isOpen={saveErrorModalOpen}
            title="저장 실패"
            description="곡 정보를 저장하는 중 오류가 발생했습니다."
            onClose={() => setSaveErrorModalOpen(false)}
          />
          <AlertModal
            isOpen={editErrorModalOpen}
            title="수정 실패"
            description="주석 수정 중 오류가 발생했습니다."
            onClose={() => setEditErrorModalOpen(false)}
          />

          <AlertModal
            isOpen={deleteErrorModalOpen}
            title="삭제 실패"
            description="주석 삭제 중 오류가 발생했습니다."
            onClose={() => setDeleteErrorModalOpen(false)}
          />

          <AlertModal
            isOpen={likeErrorModalOpen}
            title="좋아요 실패"
            description="로그인이 필요하거나 오류가 발생했습니다."
            onClose={() => setLikeErrorModalOpen(false)}
          />

          <ConfirmModal
            isOpen={confirmDeleteId !== null}
            title="주석 삭제"
            description="정말 이 주석을 삭제하시겠습니까?"
            onConfirm={confirmDelete}
            onCancel={() => setConfirmDeleteId(null)}
          />
    </div>
  );
}

export default SongPage;
