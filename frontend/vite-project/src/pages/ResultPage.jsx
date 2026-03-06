import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function ResultPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state || {};

    const isMultiplayer = state.mode === "multiplayer";
    const topic = state.topic || "Quiz";

    // Single player data
    const score = state.score || 0;
    const total = state.total || 10;
    const correct = state.correct || 0;
    const avgTime = state.avgTime || 0;
    const performance = state.performance || {};

    // Multiplayer data
    const results = state.results || [];
    const myUsername = state.myUsername || "";

    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    const rankColors = {
        1: { bg: "linear-gradient(135deg,var(--gold),#e8a800)", color: "#1a1500" },
        2: { bg: "var(--silver)", color: "#1a2030" },
        3: { bg: "var(--bronze)", color: "#1a1000" },
    };

    function getTrophy() {
        if (isMultiplayer) {
            const myResult = results.find((r) => r.username === myUsername);
            const myRank = results.indexOf(myResult) + 1;
            if (myRank === 1) return "🏆";
            if (myRank === 2) return "🥈";
            if (myRank === 3) return "🥉";
            return "🎯";
        }
        if (accuracy >= 80) return "🏆";
        if (accuracy >= 60) return "⭐";
        if (accuracy >= 40) return "💪";
        return "📚";
    }

    function getMessage() {
        if (isMultiplayer) {
            const myResult = results.find((r) => r.username === myUsername);
            const myRank = results.indexOf(myResult) + 1;
            if (myRank === 1) return "Champion! You crushed the competition!";
            if (myRank === 2) return "So close! Great performance!";
            return "Well played! Keep practicing!";
        }
        if (accuracy >= 80) return "Outstanding performance!";
        if (accuracy >= 60) return "Great job! Keep it up!";
        if (accuracy >= 40) return "Good effort! Practice makes perfect!";
        return "Keep learning! You'll improve!";
    }

    return (
        <div>
            <Navbar />
            <div className="results-page">
                <div className="results-header">
                    <span className="trophy">{getTrophy()}</span>
                    <h1>{isMultiplayer ? "Game Over!" : "Quiz Complete!"}</h1>
                    <p>{getMessage()}</p>
                </div>

                {/* Score Card */}
                {!isMultiplayer && (
                    <div className="results-score-card">
                        <div className="results-score-number">{score}</div>
                        <div className="results-score-label">Total Score</div>
                    </div>
                )}

                {/* Stats */}
                {!isMultiplayer && (
                    <div className="results-stats">
                        <div className="result-stat">
                            <div className="result-stat-value">{correct}/{total}</div>
                            <div className="result-stat-label">Correct Answers</div>
                        </div>
                        <div className="result-stat">
                            <div className="result-stat-value">{accuracy}%</div>
                            <div className="result-stat-label">Accuracy</div>
                        </div>
                        <div className="result-stat">
                            <div className="result-stat-value">
                                {avgTime ? `${avgTime.toFixed(1)}s` : performance.avg_response_time ? `${performance.avg_response_time}s` : "—"}
                            </div>
                            <div className="result-stat-label">Avg Response</div>
                        </div>
                    </div>
                )}

                {/* Multiplayer Rankings */}
                {isMultiplayer && results.length > 0 && (
                    <div className="results-players">
                        <h3>🏅 Final Rankings</h3>
                        {results.map((r, i) => {
                            const rank = i + 1;
                            const rc = rankColors[rank] || { bg: "var(--surface3)", color: "var(--text)" };
                            const isMe = r.username === myUsername;
                            return (
                                <div
                                    key={i}
                                    className="result-player-row"
                                    style={{
                                        animationDelay: `${i * 0.15}s`,
                                        borderColor: isMe ? "rgba(255,107,26,.3)" : undefined,
                                    }}
                                >
                                    <div
                                        className="result-player-rank"
                                        style={{ background: rc.bg, color: rc.color }}
                                    >
                                        {rank}
                                    </div>
                                    <div className="result-player-name">
                                        {r.username} {isMe && "⭐"}
                                    </div>
                                    <div style={{ fontSize: ".78rem", color: "var(--muted)" }}>
                                        {r.correct}/{r.total} ({r.accuracy}%)
                                    </div>
                                    <div className="result-player-score">{r.score}</div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Actions */}
                <div className="results-actions">
                    <button
                        className="nav-btn-primary"
                        style={{ padding: ".7rem 1.5rem", fontSize: ".9rem" }}
                        onClick={() => navigate("/topics")}
                    >
                        Play Again 🎮
                    </button>
                    <button
                        className="nav-btn"
                        style={{ padding: ".7rem 1.5rem", fontSize: ".9rem" }}
                        onClick={() => navigate("/")}
                    >
                        Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}