import React from "react";
import "./Badges.css";

const BADGES = [
    { id: "streak_3", title: "3-Day Fire", description: "3 day streak", icon: "🔥", requiredStreak: 3 },
    { id: "streak_7", title: "7-Day Legend", description: "7 day streak", icon: "⚡", requiredStreak: 7 },
    { id: "streak_14", title: "14-Day Beast", description: "14 day streak", icon: "🐉", requiredStreak: 14 },
    { id: "streak_30", title: "30-Day God", description: "30 day streak", icon: "👑", requiredStreak: 30 },
];

export default function Badges({ bestStreak = 0 }) {
    return (
        <div className="badges-section">
            <h3>🏆 Streak Badges</h3>
            <div className="badges-grid">
                {BADGES.map((badge) => {
                    const isUnlocked = bestStreak >= badge.requiredStreak;
                    return (
                        <div key={badge.id} className={`badge-card ${isUnlocked ? "unlocked" : "locked"}`}>
                            <div className="badge-icon">{badge.icon}</div>
                            <div className="badge-info">
                                <h4>{badge.title}</h4>
                                <p>{badge.description}</p>
                            </div>
                            {!isUnlocked && (
                                <div className="badge-progress">
                                    <div className="badge-progress-bar">
                                        <div
                                            className="badge-progress-fill"
                                            style={{ width: `${Math.min((bestStreak / badge.requiredStreak) * 100, 100)}%` }}
                                        />
                                    </div>
                                    <span className="badge-progress-text">{bestStreak}/{badge.requiredStreak}</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
