import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import TopicSelect from "./pages/TopicSelect";
import QuizPage from "./pages/QuizPage";
import MultiplayerLobby from "./pages/MultiplayerLobby";
import ResultPage from "./pages/ResultPage";
import AnalyticsPage from "./pages/AnalyticsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/topics" element={<TopicSelect />} />
      <Route path="/quiz" element={<QuizPage />} />
      <Route path="/multiplayer" element={<MultiplayerLobby />} />
      <Route path="/results" element={<ResultPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}