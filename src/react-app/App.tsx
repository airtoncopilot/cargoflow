import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "@/react-app/pages/Login";
import MenuPage from "@/react-app/pages/Menu";
import DocaPage from "@/react-app/pages/Doca";
import RomaneioPage from "@/react-app/pages/Romaneio";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/doca" element={<DocaPage />} />
        <Route path="/romaneio" element={<RomaneioPage />} />
      </Routes>
    </Router>
  );
}
