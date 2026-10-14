import { Navigate, Route, Routes } from "react-router-dom";
import Header from "./components/Header.jsx";
import SessionsPage from "./pages/SessionsPage.jsx";
import HeatmapPage from "./pages/HeatmapPage.jsx";

export default function App() {
  return (
    <div className="app">
      <Header />
      <main className="main">
        <Routes>
          <Route path="/" element={<Navigate to="/sessions" replace />} />
          <Route path="/sessions" element={<SessionsPage />} />
          <Route path="/sessions/:sessionId" element={<SessionsPage />} />
          <Route path="/heatmap" element={<HeatmapPage />} />
          <Route path="*" element={<Navigate to="/sessions" replace />} />
        </Routes>
      </main>
    </div>
  );
}
