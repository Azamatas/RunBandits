import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { register } from "../api/auth";
import { getMe } from "../api/users";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { saveToken, setUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });

  const mutation = useMutation({
    mutationFn: register,
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
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fc4c02", marginBottom: 24 }}>Create Account</h1>

        {["username", "email", "password"].map((field) => (
          <div className="form-group" key={field}>
            <label style={{ textTransform: "capitalize" }}>{field}</label>
            <input
              type={field === "password" ? "password" : field === "email" ? "email" : "text"}
              value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            />
          </div>
        ))}

        {mutation.isError && <p className="error">{mutation.error?.response?.data?.detail ?? "Registration failed"}</p>}

        <button className="btn-primary" style={{ width: "100%", marginTop: 8 }} onClick={() => mutation.mutate(form)} disabled={mutation.isPending}>
          {mutation.isPending ? "Creating account…" : "Sign Up"}
        </button>

        <p style={{ marginTop: 16, fontSize: 13, textAlign: "center", color: "#666" }}>
          Already have an account? <Link to="/login" style={{ color: "#fc4c02" }}>Log in</Link>
        </p>
      </div>
    </div>
  );
}
