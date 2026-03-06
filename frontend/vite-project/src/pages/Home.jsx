import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Calendar from "../components/Calendar";
import Leaderboard from "../components/Leaderboard";
import { getUser } from "../services/api";

export default function Home() {
    const navigate = useNavigate();
    const user = getUser();

    function handleSinglePlayer() {
        if (!user) {
            navigate("/login");
            return;
        }
        navigate("/topics");
    }

    function handleMultiplayer() {
        if (!user) {
            navigate("/login");
            return;
        }
        navigate("/multiplayer");
    }

    return (
        <div>
            <Navbar />

            <div className="page-layout">
                <div className="center-col">
                    <div className="glass-card fade-in">
                        <div className="welcome-text">
                            <h1>
                                Welcome to <span>quizOHquiz</span> 🧠
                            </h1>
                            <p>
                                {user
                                    ? `Ready to play, ${user.username}? Pick a mode below!`
                                    : "Test your knowledge and challenge friends"}
                            </p>
                        </div>

                        <div className="mode-section">
                            <button className="mode-btn single" onClick={handleSinglePlayer}>
                                🎮 Single Player
                            </button>
                            <button className="mode-btn multi" onClick={handleMultiplayer}>
                                ⚔️ Multiplayer
                            </button>
                        </div>
                    </div>

                    <Leaderboard />

                    <div className="rooms-grid">
                        <div className="room-card" onClick={handleMultiplayer}>
                            <div className="card-body">
                                <h3>🏠 Create a Room</h3>
                                <p>Host a quiz room and invite friends with a code</p>
                                <button className="card-cta create">+ Create Room</button>
                            </div>
                        </div>
                        <div className="room-card" onClick={handleMultiplayer}>
                            <div className="card-body">
                                <h3>🚪 Join a Room</h3>
                                <p>Enter a room code to join a friend's quiz</p>
                                <button className="card-cta join">→ Join Room</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="right-sidebar">
                    <Calendar />
                </div>
            </div>
        </div>
    );
}