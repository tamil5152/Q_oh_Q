import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Calendar from "../components/Calendar";
import Leaderboard from "../components/Leaderboard";
import { getUser, getUserStats } from "../services/api";

export default function Home() {
    const navigate = useNavigate();
    const user = getUser();
    const [activeDays, setActiveDays] = useState([]);

    // Fetch quiz activity so the calendar can highlight played days
    useEffect(() => {
        if (user) {
            getUserStats(user.id)
                .then((data) => {
                    if (data?.active_days) setActiveDays(data.active_days);
                })
                .catch(() => { });
        }
    }, []);

    function handleSinglePlayer() {
        if (!user) { navigate("/login"); return; }
        navigate("/topics");
    }

    function handleMultiplayer() {
        if (!user) { navigate("/login"); return; }
        navigate("/multiplayer");
    }

    return (
        <div>
            <Navbar />

            <div className="page-layout">
                <div className="center-col">
                    {/* Welcome + Mode Buttons */}
                    <div className="glass-card fade-in home-hero">
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

                        {/* Create / Join Room — inline below mode buttons */}
                        <div className="home-room-row">
                            <div className="home-room-card" onClick={handleMultiplayer}>
                                <span className="home-room-icon">🏠</span>
                                <div>
                                    <div className="home-room-title">Create a Room</div>
                                    <div className="home-room-desc">Host and invite friends with a code</div>
                                </div>
                                <button className="card-cta create" tabIndex={-1}>+ Create</button>
                            </div>
                            <div className="home-room-card" onClick={handleMultiplayer}>
                                <span className="home-room-icon">🚪</span>
                                <div>
                                    <div className="home-room-title">Join a Room</div>
                                    <div className="home-room-desc">Enter a code to join a friend's quiz</div>
                                </div>
                                <button className="card-cta join" tabIndex={-1}>→ Join</button>
                            </div>
                        </div>
                    </div>

                    <Leaderboard />
                </div>

                <div className="right-sidebar">
                    <Calendar activeDays={activeDays} />
                </div>
            </div>
        </div>
    );
}