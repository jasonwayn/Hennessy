import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "../utils/getToken";

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

  useEffect(() => {
    axios
      .get(`/api/songs/${id}`)
      .then((res) => {
        setSong(res.data);
        setDescription(res.data.description || "");
        setCredits(res.data.credits || "");
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
            <h2 className="text-lg font-bold">앨범</h2>
            <p>{song.album_title}</p>
          </div>
          <div>
            <h2 className="text-lg font-bold">아티스트</h2>
            <p>{song.artist_name}</p>
          </div>

          {/* 편집 가능한 About & Credits */}
          <div className="mt-4 space-y-4">
            <div>
              <label className="block font-semibold mb-1">About Song</label>
              <textarea
                className="w-full border p-2 rounded"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Credits</label>
              <textarea
                className="w-full border p-2 rounded"
                rows={2}
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
              />
            </div>
            <button
              onClick={handleSaveDetails}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              저장하기
            </button>
          </div>
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
                    .map((a) => (
                      <div key={a.id} className="mb-2 p-2 border rounded">
                        <p className="text-sm text-gray-600 mb-1">{a.nickname}:</p>
                        <p>{a.content}</p>
                      </div>
                    ))
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
