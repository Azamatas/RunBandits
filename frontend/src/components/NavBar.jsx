import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const s = {
  nav: { background: "#fff", borderBottom: "1px solid #e5e5e5", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 },
  brand: { fontWeight: 800, fontSize: 18, color: "#fc4c02", letterSpacing: -0.5 },
  links: { display: "flex", gap: 24, alignItems: "center", fontSize: 14, fontWeight: 500 },
};

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav style={s.nav}>
      <Link to="/feed" style={s.brand}>RunBanditsRun</Link>
      {user && (
        <div style={s.links}>
          <Link to="/feed">Feed</Link>
          <Link to="/log">Log Activity</Link>
          <Link to="/profile">Profile</Link>
          <button className="btn-ghost" style={{ padding: "4px 12px" }} onClick={handleLogout}>Logout</button>
        </div>
      )}
    </nav>
  );
}
