import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getUser } from "../services/api";

const TOPIC_MAP = {
    "Science": "🔬",
    "Mathematics": "📐",
    "History": "📜",
    "Technology": "💻",
    "Geography": "🌍",
    "Sports": "⚽",
    "Literature": "📚",
    "General Knowledge": "🧠",
    "Computer Science": "🖥️",
    "Physics": "⚛️",
    "Chemistry": "🧪",
    "Biology": "🧬",
    "Economics": "📈",
    "Art & Culture": "🎨",
    "Music": "🎵",
    "Movies & Entertainment": "🎬",
};

export default function TopicSelect() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const mode = searchParams.get("mode") || "single";
    const user = getUser();

    function handleSelect(topic) {
        if (!user) {
            navigate("/login");
            return;
        }
        navigate(`/quiz?topic=${encodeURIComponent(topic)}&mode=${mode}`);
    }

    return (
        <div>
            <Navbar />
            <div className="topic-page">
                <div className="topic-header fade-in">
                    <h1>Choose Your Topic 📋</h1>
                    <p>Select a topic to start your quiz adventure</p>
                </div>

                <div className="topic-grid">
                    {Object.entries(TOPIC_MAP).map(([topic, icon]) => (
                        <div
                            key={topic}
                            className="topic-card slide-up"
                            onClick={() => handleSelect(topic)}
                        >
                            <span className="topic-icon">{icon}</span>
                            <span className="topic-name">{topic}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
