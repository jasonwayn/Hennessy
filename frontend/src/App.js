import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import MyPage from "./pages/MyPage";
import { AuthProvider } from "./contexts/AuthContext"; 
import AlbumPage from "./pages/AlbumPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/album/:artistSlug/:albumSlug" element={<AlbumPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
