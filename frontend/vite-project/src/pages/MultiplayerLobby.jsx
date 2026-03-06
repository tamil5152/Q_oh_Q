import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getUser } from "../services/api";
import { connectSocket, getSocket } from "../services/socket";

const TOPIC_MAP = {
    "Science": "🔬", "Mathematics": "📐", "History": "📜", "Technology": "💻",
    "Geography": "🌍", "Sports": "⚽", "General Knowledge": "🧠", "Computer Science": "🖥️",
};

export default function MultiplayerLobby() {
    const navigate = useNavigate();
    const user = getUser();
    const [mode, setMode] = useState("choose"); // choose, create, join
    const [roomCode, setRoomCode] = useState("");
    const [joinCode, setJoinCode] = useState("");
    const [players, setPlayers] = useState([]);
    const [isHost, setIsHost] = useState(false);
    const [topic, setTopic] = useState("General Knowledge");
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);

    // Multiplayer quiz state
    const [gameStarted, setGameStarted] = useState(false);
    const [question, setQuestion] = useState(null);
    const [questionNum, setQuestionNum] = useState(0);
    const [totalQuestions, setTotalQuestions] = useState(10);
    const [scores, setScores] = useState({});
    const [selected, setSelected] = useState(null);
    const [answerResult, setAnswerResult] = useState(null);
    const [questionStartTime, setQuestionStartTime] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [results, setResults] = useState([]);

    useEffect(() => {
        if (!user) {
            navigate("/login");
            return;
        }
        const socket = connectSocket();

        socket.on("room_created", (data) => {
            setRoomCode(data.room_code);
            setPlayers(data.players);
            setIsHost(data.is_host);
            setMode("lobby");
        });

        socket.on("room_joined", (data) => {
            setRoomCode(data.room_code);
            setPlayers(data.players);
            setIsHost(data.is_host);
            setTopic(data.topic || "General Knowledge");
            setMode("lobby");
        });

        socket.on("player_joined", (data) => {
            setPlayers(data.players);
        });

        socket.on("player_left", (data) => {
            setPlayers(data.players);
        });

        socket.on("topic_update", (data) => {
            setTopic(data.topic);
        });

        socket.on("error", (data) => {
            setError(data.message);
            setTimeout(() => setError(""), 4000);
        });

        socket.on("game_starting", (data) => {
            setTopic(data.topic);
            setTotalQuestions(data.total_questions);
            setGameStarted(true);
        });

        socket.on("new_question", (data) => {
            setQuestion({ question: data.question, options: data.options });
            setQuestionNum(data.question_number);
            setTotalQuestions(data.total_questions);
            setScores(data.scores);
            setSelected(null);
            setAnswerResult(null);
            setQuestionStartTime(Date.now());
        });

        socket.on("answer_result", (data) => {
            setAnswerResult(data);
            setScores(data.scores);
        });

        socket.on("score_update", (data) => {
            setScores(data.scores);
        });

        socket.on("game_over", (data) => {
            setGameOver(true);
            setResults(data.results);
            navigate("/results", {
                state: {
                    mode: "multiplayer",
                    topic: data.topic || topic,
                    results: data.results,
                    myUsername: user.username,
                },
            });
        });

        return () => {
            socket.off("room_created");
            socket.off("room_joined");
            socket.off("player_joined");
            socket.off("player_left");
            socket.off("topic_update");
            socket.off("error");
            socket.off("game_starting");
            socket.off("new_question");
            socket.off("answer_result");
            socket.off("score_update");
            socket.off("game_over");
        };
    }, []);

    function handleCreate() {
        const socket = getSocket();
        socket.emit("create_room", { user_id: user.id, username: user.username });
    }

    function handleJoin() {
        if (!joinCode.trim()) {
            setError("Please enter a room code");
            return;
        }
        const socket = getSocket();
        socket.emit("join_room", {
            room_code: joinCode.trim().toUpperCase(),
            user_id: user.id,
            username: user.username,
        });
    }

    function handleTopicVote(t) {
        setTopic(t);
        const socket = getSocket();
        socket.emit("select_topic", { room_code: roomCode, topic: t });
    }

    function handleStartGame() {
        const socket = getSocket();
        socket.emit("start_game", { room_code: roomCode });
    }

    function handleSubmitAnswer(option) {
        if (selected !== null) return;
        setSelected(option);
        const responseTime = (Date.now() - questionStartTime) / 1000;
        const socket = getSocket();
        socket.emit("submit_answer", {
            room_code: roomCode,
            answer: option,
            response_time: responseTime,
        });
    }

    function copyCode() {
        navigator.clipboard.writeText(roomCode).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    const letters = ["A", "B", "C", "D"];

    // ── Game View ──────────────────────────────────────────
    if (gameStarted && question) {
        return (
            <div>
                <Navbar />
                <div className="quiz-page">
                    <div className="quiz-top-bar">
                        <div className="quiz-progress">
                            <div className="quiz-progress-label">
                                <span>Question {questionNum} / {totalQuestions}</span>
                                <span>Room: {roomCode}</span>
                            </div>
                            <div className="quiz-progress-bar">
                                <div className="quiz-progress-fill" style={{ width: `${(questionNum / totalQuestions) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>

                    {/* Live Scores */}
                    <div className="quiz-score-bar">
                        {Object.entries(scores).map(([name, s]) => (
                            <span key={name} style={{ marginRight: "1rem" }}>
                                {name}: <span className="quiz-score-val" style={{ fontSize: ".9rem" }}>{s}</span>
                            </span>
                        ))}
                    </div>

                    <div className="quiz-question-card">
                        <div className="quiz-question-text">{question.question}</div>
                    </div>

                    <div className="quiz-options">
                        {question.options.map((opt, i) => {
                            let cls = "quiz-option";
                            if (selected !== null) {
                                cls += " disabled";
                                if (answerResult) {
                                    if (opt === answerResult.correct_answer) cls += " correct";
                                    else if (opt === selected && !answerResult.is_correct) cls += " wrong";
                                }
                            }
                            return (
                                <div key={i} className={cls} onClick={() => handleSubmitAnswer(opt)}>
                                    <div className="quiz-option-letter">{letters[i]}</div>
                                    <span>{opt}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    if (gameStarted && !question) {
        return (
            <div>
                <Navbar />
                <div className="loading">
                    <div className="spinner"></div>
                    <p>Generating questions for {topic}...</p>
                </div>
            </div>
        );
    }

    // ── Lobby View ─────────────────────────────────────────
    if (mode === "lobby") {
        return (
            <div>
                <Navbar />
                <div className="lobby-page">
                    <div className="room-code-display fade-in">
                        <div className="room-code-label">Room Code</div>
                        <div className="room-code-value">{roomCode}</div>
                        <button className="room-code-copy" onClick={copyCode}>
                            {copied ? "✓ Copied!" : "📋 Copy Code"}
                        </button>
                    </div>

                    {error && <div className="auth-error">{error}</div>}

                    <div className="lobby-section">
                        <h3>👥 Players ({players.length}/4)</h3>
                        <div className="player-list">
                            {players.map((p, i) => (
                                <div key={i} className="player-item slide-up">
                                    <div className="player-avatar-lg">{p.username?.[0]?.toUpperCase()}</div>
                                    <div className="player-name">{p.username}</div>
                                    {i === 0 && <span className="player-host">Host</span>}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="lobby-section">
                        <h3>📋 Select Topic</h3>
                        <div className="topic-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))" }}>
                            {Object.entries(TOPIC_MAP).map(([t, icon]) => (
                                <div
                                    key={t}
                                    className={`topic-card ${topic === t ? "selected" : ""}`}
                                    onClick={() => handleTopicVote(t)}
                                    style={{ padding: "1rem .6rem" }}
                                >
                                    <span className="topic-icon" style={{ fontSize: "1.5rem" }}>{icon}</span>
                                    <span className="topic-name" style={{ fontSize: ".75rem" }}>{t}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {isHost && (
                        <button
                            className="lobby-start-btn"
                            onClick={handleStartGame}
                            disabled={players.length < 2}
                        >
                            {players.length < 2 ? "Waiting for players..." : `Start Game ⚡ (${topic})`}
                        </button>
                    )}

                    {!isHost && (
                        <div style={{ textAlign: "center", color: "var(--muted)", padding: "1rem" }}>
                            Waiting for host to start the game...
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ── Choose Mode / Join ─────────────────────────────────
    return (
        <div>
            <Navbar />
            <div className="lobby-page">
                <div className="topic-header fade-in">
                    <h1>Multiplayer ⚔️</h1>
                    <p>Challenge your friends in real-time!</p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <div className="rooms-grid" style={{ marginBottom: "2rem" }}>
                    <div className="room-card" onClick={handleCreate}>
                        <div className="card-body" style={{ padding: "1.5rem" }}>
                            <h3>🏠 Create Room</h3>
                            <p>Host a new quiz room and invite friends</p>
                            <button className="card-cta create">+ Create</button>
                        </div>
                    </div>
                    <div className="room-card">
                        <div className="card-body" style={{ padding: "1.5rem" }}>
                            <h3>🚪 Join Room</h3>
                            <p>Enter a room code to join</p>
                            <div className="lobby-join-form" style={{ marginTop: ".8rem" }}>
                                <input
                                    placeholder="CODE"
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value)}
                                    maxLength={6}
                                />
                                <button onClick={handleJoin}>Join</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}