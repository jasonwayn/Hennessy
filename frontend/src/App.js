import { BrowserRouter, Routes, Route } from "react-router-dom";
import MyPage from "./pages/MyPage";
import { AuthProvider } from "./contexts/AuthContext"; 
import AlbumPage from "./pages/AlbumPage";
import SearchPage from "./pages/SearchPage";
import Layout from "./components/Layout";
import NewsPage from "./pages/NewsPage";
import NewsDetailPage from "./pages/NewsDetailPage";
import NewsEditPage from "./pages/NewsEditPage";
import AlbumsPage from "./pages/AlbumsPage";
import ArtistPage from "./pages/ArtistPage";
import EditProfile from "./pages/EditProfile"; 
import AddContentPage from "./pages/AddContentPage";
import SongPage from "./pages/SongPage";
import { LoginModalProvider } from "./contexts/LoginModalContext.js";
import UserPage from "./pages/UserPage";


function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LoginModalProvider> 
          <Routes>
            <Route element={<Layout />}>
              <Route path="/mypage" element={<MyPage />} />
              <Route path="/user/:id" element={<UserPage />} />
              <Route path="/album/:artistSlug/:albumSlug" element={<AlbumPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/albums" element={<AlbumsPage />} />
              <Route path="/news" element={<NewsPage />} />
              <Route path="/news/:id" element={<NewsDetailPage />} />
              <Route path="/news/edit/:id?" element={<NewsEditPage />} />
              <Route path="/artist/:slug" element={<ArtistPage />} />
              <Route path="/edit-profile" element={<EditProfile />} />
              <Route path="/add" element={<AddContentPage />} />
              <Route path="/songs/:id" element={<SongPage />} />
            </Route>
          </Routes>
        </LoginModalProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
