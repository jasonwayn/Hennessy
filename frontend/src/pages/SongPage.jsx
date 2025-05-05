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

  useEffect(() => {
    axios
      .get(`/api/songs/${id}`)
      .then((res) => {
        setSong(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("곡 정보 로딩 실패:", err);
        setLoading(false);
      });
  }, [id]);

//주석 조회 요청
  const handleLineClick = (line) => {
    setSelectedText(line);
    axios
      .get("/api/song-annotations", {
        params: {
          song_id: song.id,
          line: line,
        },
      })
      .then((res) => setAnnotations(res.data))
      .catch((err) => console.error("주석 조회 실패:", err));
  };

//주석 업로드 요청
const handleAnnotationSubmit = async () => {
  if (!newAnnotation.trim()) return;

  try {
    const token = await getToken();
    if (!token) {
      alert("로그인이 필요합니다");
      return;
    }

    await axios.post(
      "/api/song-annotations",
      {
        song_id: song.id,
        line: selectedText,
        content: newAnnotation,
        type: activeTab,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setNewAnnotation("");
    handleLineClick(selectedText);
  } catch (err) {
    console.error("주석 등록 실패:", err);
  }
};
//
  const renderLyrics = () => {
    return song.lyrics.split("\n").map((line, idx) => (
      <p
        key={idx}
        onClick={() => handleLineClick(line)}
        className={`cursor-pointer hover:bg-yellow-100 ${
          selectedText === line ? "bg-yellow-200" : ""
        }`}
      >
        {line}
      </p>
    ));
  };

  if (loading) return <div className="p-4">로딩 중...</div>;
  if (!song) return <div className="p-4">곡을 찾을 수 없습니다.</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">{song.title}</h1>
      <p className="text-gray-600">앨범: {song.album_title}</p>
      <p className="text-gray-600 mb-4">아티스트: {song.artist_name}</p>

      <h2 className="text-lg font-semibold mt-6 mb-2">가사</h2>
      <pre className="whitespace-pre-wrap text-gray-800">{renderLyrics()}</pre>

      {selectedText && (
        <div className="mt-6 p-4 border rounded bg-gray-50">
          <p className="font-semibold mb-2">선택한 문장:</p>
          <p className="italic mb-4">"{selectedText}"</p>

          <div className="mb-4 flex space-x-4">
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
            placeholder={`여기에 ${activeTab === "translation" ? "번역" : "해석"}을 입력하세요`}
            value={newAnnotation}
            onChange={(e) => setNewAnnotation(e.target.value)}
          ></textarea>

          <button
            onClick={handleAnnotationSubmit}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            주석 등록
          </button>

          <div className="mt-6">
            <p className="font-semibold mb-2">주석 목록:</p>
            {annotations
              .filter((a) => a.type === activeTab)
              .map((a) => (
                <div key={a.id} className="mb-2 p-2 border rounded">
                  <p className="text-sm text-gray-600 mb-1">{a.nickname}:</p>
                  <p>{a.content}</p>
                </div>
              ))}
            {annotations.filter((a) => a.type === activeTab).length === 0 && (
              <p className="text-gray-500">아직 주석이 없습니다.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SongPage;
