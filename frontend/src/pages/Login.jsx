import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { login } from "../api/auth";
import { getMe } from "../api/users";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { saveToken, setUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: async ({ access_token }) => {
      saveToken(access_token);
      const me = await getMe();
      setUser(me);
      navigate("/feed");
    },
  });

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="card" style={{ width: 360 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fc4c02", marginBottom: 24 }}>RunBanditsRun</h1>

        <div className="form-group">
          <label>Email</label>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>

        {mutation.isError && <p className="error">{mutation.error?.response?.data?.detail ?? "Login failed"}</p>}

        <button className="btn-primary" style={{ width: "100%", marginTop: 8 }} onClick={() => mutation.mutate(form)} disabled={mutation.isPending}>
          {mutation.isPending ? "Logging in…" : "Log In"}
        </button>

        <p style={{ marginTop: 16, fontSize: 13, textAlign: "center", color: "#666" }}>
          No account? <Link to="/register" style={{ color: "#fc4c02" }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}
