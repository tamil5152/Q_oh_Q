import { useNavigate } from "react-router-dom";
import { getUser, logoutUser } from "../services/api";

export default function Navbar() {
    const navigate = useNavigate();
    const user = getUser();

    function handleLogout() {
        logoutUser();
        navigate("/");
    }

    return (
        <nav>
            <div className="logo" onClick={() => navigate("/")}>
                quiz<span className="oh">OH</span>quiz
            </div>

            <div className="nav-right">
                {user && (
                    <div className="streak-badge">
                        <span>🔥</span>
                        <span>{user.streak || 0} streak</span>
                    </div>
                )}

                {user ? (
                    <>
                        <button className="nav-btn" onClick={() => navigate("/analytics")}>
                            📊 Stats
                        </button>
                        <div className="nav-user" onClick={handleLogout} title="Click to logout">
                            <div className="nav-avatar">{user.username?.[0]?.toUpperCase() || "?"}</div>
                            <span>{user.username}</span>
                        </div>
                    </>
                ) : (
                    <>
                        <button className="nav-btn" onClick={() => navigate("/login")}>
                            Log in
                        </button>
                        <button className="nav-btn-primary" onClick={() => navigate("/signup")}>
                            Sign up
                        </button>
                    </>
                )}
            </div>
        </nav>
    );
}