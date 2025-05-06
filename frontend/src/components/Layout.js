import Header from "./Header";
import { Outlet } from "react-router-dom";

function Layout() {
  return (
    <>
      <Header />
      <main className="px-4 py-6">
        <Outlet />
      </main>
    </>
  );
}

export default Layout;
