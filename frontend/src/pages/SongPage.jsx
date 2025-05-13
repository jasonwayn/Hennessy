import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "../utils/getToken";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

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
  
useEffect(() => {
  axios
    .get(`/api/songs/${id}`)
    .then((res) => {
      console.log("곡 상세 데이터 확인:", res.data.album_slug, res.data);
      const data = res.data;
      setSong(res.data);
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
      if (
        e.target.closest(".lyrics-line") === null &&
        e.target.closest(".annotation-panel") === null
      ) {
        setSelectedText(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleLineClick = (line) => {
    setSelectedText(line);
    axios
      .get("/api/song-annotations", {
        params: {
          song_id: song.id,
          line,
        },
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
      alert("곡 정보가 저장되었습니다.");
      setIsEditing(false);
    } catch (err) {
      console.error("곡 정보 저장 실패:", err);
      alert("저장 중 오류 발생");
    }
  };

  const renderLyrics = () =>
    song?.lyrics?.split("\n").map((line, idx) => (
      <p
        key={idx}
        onClick={() => handleLineClick(line)}
        className={`lyrics-line cursor-pointer hover:bg-yellow-100 px-2 py-1 rounded ${
          selectedText === line ? "bg-yellow-200" : ""
        }`}
      >
        {line}
      </p>
    ));

  const handleEditAnnotation = async (annotationId, newContent) => {
  try {
    const token = await getToken();
    await axios.patch(`/api/song-annotations/${annotationId}`, {
      content: newContent,
    }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    alert("수정 완료");
    handleLineClick(selectedText); // 주석 다시 불러오기
  } catch (err) {
    console.error("주석 수정 실패:", err);
    alert("수정 중 오류 발생");
  }
};

  const handleDeleteAnnotation = async (annotationId) => {
  if (!window.confirm("정말 삭제하시겠습니까?")) return;

  try {
    const token = await getToken();
    await axios.delete(`/api/song-annotations/${annotationId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    alert("삭제 완료");
    handleLineClick(selectedText); // 주석 다시 불러오기
  } catch (err) {
    console.error("주석 삭제 실패:", err);
    alert("삭제 중 오류 발생");
  }
};


  const handleToggleLike = async (annotationId) => {
  try {
    const token = await getToken();
    await axios.post(`/api/song-annotations/${annotationId}/like`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    handleLineClick(selectedText); // 새로고침 없이 상태 업데이트
  } catch (err) {
    console.error("좋아요 실패:", err);
    alert("로그인이 필요하거나 오류가 발생했습니다.");
  }
};

  if (loading) return <div className="p-6 text-center">로딩 중...</div>;
  if (!song) return <div className="p-6 text-center">곡을 찾을 수 없습니다.</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* 좌측 정보 영역 */}
        <div className="md:col-span-1 space-y-4">
          <img
            src={song.album_image_url}
            alt="Album Cover"
            className="w-full rounded shadow"
          />
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

          <button
            onClick={() => setIsEditing(true)}
            className="text-sm bg-gray-100 px-3 py-1 rounded hover:bg-gray-200"
          >
            편집
          </button>

          {/* About Song */}
          <div>
            <h2 className="font-semibold text-sm mt-4 mb-1">ABOUT SONG</h2>
            {isEditing ? (
              <textarea
                className="w-full border p-2 rounded"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            ) : (
              <p className="text-sm text-gray-800 whitespace-pre-line">
                {description || ""}
              </p>
            )}
          </div>

          {/* Credits */}
          <div>
            <h2 className="font-semibold text-sm mt-4 mb-1">CREDITS</h2>
            {isEditing ? (
              <textarea
                className="w-full border p-2 rounded"
                rows={2}
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
              />
            ) : (
              <p className="text-sm text-gray-800 whitespace-pre-line">
                {credits || ""}
              </p>
            )}
          </div>

          {isEditing && (
            <button
              onClick={handleSaveDetails}
              className="w-full mt-2 bg-black text-white py-2 rounded"
            >
              저장하기
            </button>
          )}
        </div>

        {/* 중앙 가사 */}
        <div className="md:col-span-2">
          <h1 className="text-2xl font-bold mb-4">{song.title}</h1>
          <div className="bg-white p-4 rounded shadow whitespace-pre-wrap">
            {renderLyrics()}
          </div>
        </div>

        {/* 우측 주석 */}
        <div className="md:col-span-1">
          {selectedText ? (
            <div className="annotation-panel p-4 border rounded bg-gray-50">
              <p className="font-semibold mb-2">선택한 문장:</p>
              <p className="italic mb-4">"{selectedText}"</p>

              <div className="mb-4 flex space-x-2">
                <button
                  onClick={() => setActiveTab("translation")}
                  className={`px-4 py-1 border rounded ${
                    activeTab === "translation" ? "bg-blue-500 text-white" : ""
                  }`}
                >
                  번역
                </button>
                <button
                  onClick={() => setActiveTab("interpretation")}
                  className={`px-4 py-1 border rounded ${
                    activeTab === "interpretation" ? "bg-blue-500 text-white" : ""
                  }`}
                >
                  해석
                </button>
              </div>

              <textarea
                className="w-full border p-2 rounded mb-2"
                rows={3}
                placeholder={`여기에 ${
                  activeTab === "translation" ? "번역" : "해석"
                }을 입력하세요`}
                value={newAnnotation}
                onChange={(e) => setNewAnnotation(e.target.value)}
              />

              <button
                onClick={handleAnnotationSubmit}
                className="bg-green-500 text-white px-4 py-2 rounded"
              >
                주석 등록
              </button>

              <div className="mt-6">
                <p className="font-semibold mb-2">주석 목록:</p>
                {annotations.filter((a) => a.type === activeTab).length === 0 ? (
                  <p className="text-gray-500">아직 주석이 없습니다.</p>
                ) : (
                annotations
                  .filter((a) => a.type === activeTab)
                  .map((a) => {
                    const isAuthor = user?.email === a.user_email; // 🔑 내가 작성한 주석인지 확인
                  
                    return (
                      <div key={a.id} className="mb-2 p-2 border rounded">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm text-gray-600">{a.nickname}</p>
                          <div className="flex gap-2 items-center">
                            <button
                              onClick={() => handleToggleLike(a.id)}
                              className="text-sm text-gray-500 hover:text-red-500"
                            >
                              ❤️ <span>{a.likes}개</span>
                            </button>
                              {isAuthor && (
                                <>
                                  <button
                                    onClick={() => {
                                      const newContent = prompt("새 내용:", a.content);
                                      if (newContent && newContent !== a.content) {
                                        handleEditAnnotation(a.id, newContent);
                                      }
                                    }}
                                    className="text-xs text-blue-600 hover:underline"
                                  >
                                    수정
                                  </button>
                                  <button
                                    onClick={() => handleDeleteAnnotation(a.id)}
                                    className="text-xs text-red-600 hover:underline"
                                  >
                                    삭제
                                  </button>
                                </>
                              )}
                          </div>
                        </div>
                        <p>{a.content}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-sm">
              가사를 클릭하면 주석을 작성할 수 있습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SongPage;
