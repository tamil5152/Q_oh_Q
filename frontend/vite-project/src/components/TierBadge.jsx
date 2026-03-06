import React from "react";
import "./TierBadge.css";

// Tier Logic:
// Bronze: < 100
// Silver: 100 - 999
// Gold: 1,000 - 9,999
// Platinum: 10,000 - 49,999
// Master Glacier: 50,000+

const getTierInfo = (score) => {
    if (score >= 50000) return { name: "Master Glacier", class: "master-glacier", icon: "💎", needed: Infinity };
    if (score >= 10000) return { name: "Platinum", class: "platinum", icon: "✨", needed: 50000 };
    if (score >= 1000) return { name: "Gold", class: "gold", icon: "🏅", needed: 10000 };
    if (score >= 100) return { name: "Silver", class: "silver", icon: "🥈", needed: 1000 };
    return { name: "Bronze", class: "bronze", icon: "🥉", needed: 100 };
};

export default function TierBadge({ score = 0 }) {
    const tier = getTierInfo(score);
    const progressPercent = tier.needed === Infinity ? 100 : Math.min((score / tier.needed) * 100, 100);

    return (
        <div className={`tier-badge-container tier-${tier.class} slide-up`}>
            <div className="tier-header">
                <span className="tier-icon">{tier.icon}</span>
                <div className="tier-details">
                    <span className="tier-label">Current Tier</span>
                    <h3 className="tier-name">{tier.name}</h3>
                </div>
            </div>

            <div className="tier-progress-section">
                <div className="tier-score-row">
                    <span>{score.toLocaleString()} XP</span>
                    {tier.needed !== Infinity && <span>{tier.needed.toLocaleString()} XP</span>}
                </div>
                <div className="tier-progress-bar">
                    <div
                        className="tier-progress-fill"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
                {tier.needed !== Infinity && (
                    <p className="tier-next-hint">
                        {(tier.needed - score).toLocaleString()} XP to Next Tier
                    </p>
                )}
            </div>
        </div>
    );
}
