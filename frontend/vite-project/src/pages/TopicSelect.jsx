import { useState } from "react";
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

const DIFFICULTIES = [
    {
        id: "easy",
        label: "Easy",
        icon: "🟢",
        desc: "Basic concepts & everyday knowledge",
        color: "#22c55e",
        glow: "rgba(34,197,94,0.25)",
    },
    {
        id: "medium",
        label: "Medium",
        icon: "🟡",
        desc: "Requires understanding & application",
        color: "#eab308",
        glow: "rgba(234,179,8,0.25)",
    },
    {
        id: "hard",
        label: "Hard",
        icon: "🔴",
        desc: "Advanced concepts & deep knowledge",
        color: "#ef4444",
        glow: "rgba(239,68,68,0.25)",
    },
];

export default function TopicSelect() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const mode = searchParams.get("mode") || "single";
    const user = getUser();

    const [selectedTopic, setSelectedTopic] = useState(null);
    const [hoveredDiff, setHoveredDiff] = useState(null);

    function handleTopicClick(topic) {
        if (!user) {
            navigate("/login");
            return;
        }
        setSelectedTopic(topic);
        // Scroll to top so the difficulty panel is visible
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function handleDifficultySelect(diffId) {
        navigate(
            `/quiz?topic=${encodeURIComponent(selectedTopic)}&mode=${mode}&difficulty=${diffId}`
        );
    }

    return (
        <div>
            <Navbar />
            <div className="topic-page">

                {/* ── Difficulty Selection (shown after topic picked) ── */}
                {selectedTopic && (
                    <div className="diff-overlay fade-in">
                        <div className="diff-panel slide-up">
                            <div className="diff-panel-header">
                                <button
                                    className="diff-back-btn"
                                    onClick={() => setSelectedTopic(null)}
                                >
                                    ← Back
                                </button>
                                <h2>
                                    Choose Difficulty for{" "}
                                    <span style={{ color: "#00d4ff" }}>
                                        {TOPIC_MAP[selectedTopic]} {selectedTopic}
                                    </span>
                                </h2>
                                <p className="diff-sub">Pick your challenge level — questions will stay at this level throughout the quiz.</p>
                            </div>

                            <div className="diff-cards">
                                {DIFFICULTIES.map((d) => (
                                    <div
                                        key={d.id}
                                        className={`diff-card diff-${d.id}`}
                                        style={{
                                            borderColor: hoveredDiff === d.id ? d.color : "transparent",
                                            boxShadow: hoveredDiff === d.id
                                                ? `0 0 24px ${d.glow}, 0 0 0 2px ${d.color}40`
                                                : "none",
                                        }}
                                        onMouseEnter={() => setHoveredDiff(d.id)}
                                        onMouseLeave={() => setHoveredDiff(null)}
                                        onClick={() => handleDifficultySelect(d.id)}
                                    >
                                        <span className="diff-icon">{d.icon}</span>
                                        <span
                                            className="diff-label"
                                            style={{ color: d.color }}
                                        >
                                            {d.label}
                                        </span>
                                        <span className="diff-desc">{d.desc}</span>
                                        <button
                                            className="diff-btn"
                                            style={{
                                                background: d.color,
                                                boxShadow: `0 4px 14px ${d.glow}`,
                                            }}
                                        >
                                            Start Quiz →
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Topic Grid ── */}
                <div className="topic-header fade-in">
                    <h1>Choose Your Topic 📋</h1>
                    <p>Select a topic, then pick your difficulty level</p>
                </div>

                <div className="topic-grid">
                    {Object.entries(TOPIC_MAP).map(([topic, icon]) => (
                        <div
                            key={topic}
                            className={`topic-card slide-up${selectedTopic === topic ? " topic-card-active" : ""}`}
                            onClick={() => handleTopicClick(topic)}
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
