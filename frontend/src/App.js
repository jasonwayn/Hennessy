// App.js
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import MyPage from "./pages/MyPage";
import { AuthProvider } from "./contexts/AuthContext"; 
import AlbumPage from "./pages/AlbumPage";
import SearchPage from "./pages/SearchPage";
import Layout from "./components/Layout"; // ✅ 추가

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* ✅ 공통 레이아웃이 필요한 경로들 */}
          <Route element={<Layout />}>
            <Route path="/mypage" element={<MyPage />} />
            <Route path="/album/:artistSlug/:albumSlug" element={<AlbumPage />} />
            <Route path="/search" element={<SearchPage />} />
          </Route>

          {/* ❗ 로그인/회원가입은 헤더 제외 (단독 화면) */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
