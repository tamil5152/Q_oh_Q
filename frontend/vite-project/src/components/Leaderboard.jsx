import { useState, useEffect } from "react";
import { getLeaderboard } from "../services/api";

export default function Leaderboard() {
    const [players, setPlayers] = useState([]);

    useEffect(() => {
        getLeaderboard()
            .then((data) => {
                if (data.leaderboard) setPlayers(data.leaderboard);
            })
            .catch(() => { });
    }, []);

    const emojis = ["🦁", "🦊", "🐺", "🐯", "🦅", "🐬", "🦈", "🐉", "🦄", "🐲"];

    const display = players.length > 0
        ? players
        : [
            { rank: 1, username: "—", score: 0 },
            { rank: 2, username: "—", score: 0 },
            { rank: 3, username: "—", score: 0 },
        ];

    return (
        <div className="scorers-wrap">
            <p className="section-label">🏆 Top Scorers</p>
            <div className="scorers-list">
                {display.map((p, i) => (
                    <div key={i} className={`scorer-row rank-${p.rank}`}>
                        <div className="scorer-rank">{p.rank}</div>
                        <div className="scorer-avatar">{emojis[i % emojis.length]}</div>
                        <div className="scorer-info">
                            <div className="scorer-name">{p.username}</div>
                            <div className="scorer-tag">
                                {p.total_quizzes ? `${p.total_quizzes} quizzes` : "No quizzes yet"}
                            </div>
                        </div>
                        <div className="scorer-score">{p.score}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}