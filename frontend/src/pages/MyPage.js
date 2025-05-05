import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

function MyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user === undefined) return; // 아직 상태 못 받았으면 아무것도 안함
    if (!user) {
      navigate("/login");
    }
    setLoading(false);
  }, [user, navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    alert("로그아웃 완료!");
    navigate("/login");
  };

  if (loading || !user) {
    return <div>로딩 중...</div>; // user 없으면 무조건 로딩 화면
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h2 className="text-2xl font-bold mb-4">마이페이지</h2>
      <p className="mb-4">이메일: {user.email}</p>
      <button
        onClick={handleLogout}
        className="bg-red-500 text-white px-4 py-2 rounded"
      >
        로그아웃
      </button>
    </div>
  );
}

export default MyPage;
