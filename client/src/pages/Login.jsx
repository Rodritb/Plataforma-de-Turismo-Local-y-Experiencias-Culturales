import { useState } from "react";
import turistaImg from "../assets/turista.jpg";
import adminImg from "../assets/administrator.jpg";
import fondoImg from "../assets/sucre.png";

const API_URL = "http://localhost:3000/api/auth/login";

const ROLES = [
  { id: "turista", label: "Turista", icon: turistaImg, desc: "Explora y reserva experiencias" },
  { id: "admin", label: "Administrador", icon: adminImg, desc: "Gestión completa del sistema" },
];

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [rol, setRol] = useState("turista");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Credenciales incorrectas"); return; }
      if (rol === "admin" && data.user.rol !== "admin") {
        setError("No tienes permisos de administrador"); return;
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      if (data.user.rol === "admin") window.location.href = "/admin";
      else if (["guia_turistico","guia_gastronomico","anfitrion"].includes(data.user.rol)) 
        window.location.href = "/panel-guia";
      else window.location.href = "/experiencias";
    } catch { setError("Error de conexión con el servidor"); }
    finally { setLoading(false); }
  };

  const isAdmin = rol === "admin";
  const colors = {
    turista: { primary: "#2563eb", light: "#eff6ff", border: "#bfdbfe", gradient: "linear-gradient(135deg,#2563eb,#0ea5e9)" },
    admin: { primary: "#7c3aed", light: "#f5f3ff", border: "#c4b5fd", gradient: "linear-gradient(135deg,#7c3aed,#4f46e5)" },
  };
  const c = colors[rol];

  return (
    <div style={styles.page}>
      <div style={{ ...styles.topBar, background: c.gradient }} />
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={{ ...styles.logoBox, background: c.gradient }}>
            <img src={ROLES.find(r => r.id === rol)?.icon} alt={rol} style={{ width: 60, height: 60, objectFit: "contain" }} />
          </div>
          <h1 style={styles.title}>SucreGO</h1>
          <p style={styles.subtitle}>Plataforma de Experiencias Culturales</p>
        </div>

        {/* Selector de rol */}
        <div style={styles.rolSelector}>
          {ROLES.map((r) => (
            <button key={r.id} type="button"
              onClick={() => { setRol(r.id); setError(""); }}
              style={{
                ...styles.rolBtn,
                background: rol === r.id ? c.light : "rgb(246, 68, 9)",
                borderColor: rol === r.id ? c.primary : "rgb(237, 30, 11)",
                color: rol === r.id ? c.primary : "#020d1c",
              }}>

              <img src={r.icon} alt={r.label} style={{ width: 40, height: 40, objectFit: "contain" }} />
              <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>{r.label}</span>
            </button>
          ))}
        </div>

        <div style={{ ...styles.infoBox, background: c.light, borderColor: c.border }}>
          <span style={{ fontSize: 13, color: c.primary }}>
            {ROLES.find(r => r.id === rol)?.desc}
          </span>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Correo electrónico</label>
            <div style={styles.inputWrap}>
              <span style={styles.ico}>✉️</span>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                placeholder="ejemplo@correo.com" required style={styles.input}
                onFocus={(e) => (e.target.style.borderColor = c.primary)}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")} />
            </div>
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Contraseña</label>
            <div style={styles.inputWrap}>
              <span style={styles.ico}>🔒</span>
              <input type={showPassword ? "text" : "password"} name="password"
                value={form.password} onChange={handleChange}
                placeholder="••••••••" required style={{ ...styles.input, paddingRight: 44 }}
                onFocus={(e) => (e.target.style.borderColor = c.primary)}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>
          {error && <div style={styles.errorBox}><span>⚠️</span> {error}</div>}
          <button type="submit" disabled={loading}
            style={{ ...styles.submitBtn, background: c.gradient, opacity: loading ? 0.7 : 1 }}>
            {loading ? "Ingresando..." : `Entrar como ${ROLES.find(r => r.id === rol)?.label}`}
          </button>
        </form>

        <div style={styles.footer}>
          <span style={styles.footerText}>¿No tienes cuenta? </span>
          <a href="/register" style={{ ...styles.link, color: c.primary }}>Regístrate aquí</a>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "flex-end", backgroundImage: `url(${fondoImg})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat", fontFamily: "'Segoe UI',system-ui,sans-serif", padding: "1rem" },
  topBar: { position: "fixed", top: 0, left: 0, right: 0, height: 4 },
  card: { background: "rgba(255,255,255,0.15)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: "1.5px solid rgba(255,255,255,0.35)", borderRadius: 22, boxShadow: "0 10px 48px rgba(0,0,0,0.3)", padding: "2.25rem 2rem", width: "100%", maxWidth: 420, position: "relative", zIndex: 1 },
  header: { textAlign: "center", marginBottom: "1.5rem" },
  logoBox: { width: 58, height: 58, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.9rem", boxShadow: "0 4px 18px rgba(0,0,0,0.18)", transition: "background 0.4s" },
  title: { fontSize: "1.45rem", fontWeight: 700, color: "#1e293b", margin: "0 0 0.2rem", letterSpacing: "-0.02em" },
  subtitle: { fontSize: "0.8rem", color: "#64748b", margin: 0 },
  rolSelector: { display: "flex", gap: 8, marginBottom: "1rem" },
  rolBtn: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "0.7rem 0.5rem", border: "2px solid", borderRadius: 12, cursor: "pointer", transition: "all 0.2s" },
  infoBox: { border: "1.5px solid", borderRadius: 10, padding: "0.65rem 0.9rem", marginBottom: "1.25rem", transition: "all 0.3s", textAlign: "center" },
  form: { display: "flex", flexDirection: "column", gap: "1.1rem" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "0.35rem" },
  label: { fontSize: "0.82rem", fontWeight: 600, color: "#374151" },
  inputWrap: { position: "relative", display: "flex", alignItems: "center" },
  ico: { position: "absolute", left: 11, fontSize: 14, pointerEvents: "none" },
  input: { width: "100%", padding: "0.68rem 0.75rem 0.68rem 2.4rem", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: "0.92rem", color: "#1e293b", background: "#f8fafc", outline: "none", transition: "border-color 0.2s", boxSizing: "border-box" },
  eyeBtn: { position: "absolute", right: 10, background: "none", border: "none", cursor: "pointer", fontSize: 15, padding: "2px 4px" },
  errorBox: { display: "flex", alignItems: "center", gap: 7, background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", borderRadius: 8, padding: "0.6rem 0.85rem", fontSize: "0.84rem" },
  submitBtn: { width: "100%", padding: "0.8rem", color: "#fff", border: "none", borderRadius: 10, fontSize: "0.97rem", fontWeight: 600, boxShadow: "0 4px 14px rgba(0,0,0,0.2)", cursor: "pointer", transition: "opacity 0.2s", marginTop: 4 },
  footer: { textAlign: "center", marginTop: "1.4rem" },
  footerText: { fontSize: "0.855rem", color: "#64748b" },
  link: { fontSize: "0.855rem", fontWeight: 600, textDecoration: "none" },
};
