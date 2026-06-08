import { useState } from "react";
import fondoImg from "../assets/paisaje.png";

const API_URL = "http://localhost:3000/api/auth/register";

const ROLES = [
  { id: "turista", label: "Turista", icon: "🧳", desc: "Quiero explorar y reservar experiencias turísticas" },
  { id: "guia_turistico", label: "Guía Turístico", icon: "🗺️", desc: "Ofrezco recorridos y tours culturales" },
  { id: "guia_gastronomico", label: "Guía Gastronómico", icon: "🍽️", desc: "Ofrezco experiencias de cocina y gastronomía" },
  { id: "anfitrion", label: "Anfitrión", icon: "🏨", desc: "Recibo turistas y ofrezco servicios locales" },
];

export default function Register() {
  const [form, setForm] = useState({ nombre: "", email: "", password: "", confirmar: "" });
  const [rol, setRol] = useState("turista");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); setError(""); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmar) { setError("Las contraseñas no coinciden"); return; }
    if (form.password.length < 6) { setError("Mínimo 6 caracteres"); return; }
    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: form.nombre, email: form.email, password: form.password, rol }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Error al registrarse"); return; }
      setSuccess("¡Cuenta creada! Redirigiendo...");
      setTimeout(() => { window.location.href = "/login"; }, 2000);
    } catch { setError("Error de conexión"); }
    finally { setLoading(false); }
  };

  const rolActual = ROLES.find(r => r.id === rol);
  const colores = {
    turista: "#2563eb", guia_turistico: "#0891b2",
    guia_gastronomico: "#d97706", anfitrion: "#059669",
  };
  const color = colores[rol] || "#2563eb";

  return (
    <div style={styles.page}>
      <div style={{ ...styles.topBar, background: `linear-gradient(90deg,${color},#0ea5e9)` }} />
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={{ ...styles.logoBox, background: `linear-gradient(135deg,${color},#0ea5e9)` }}>
            <span style={{ fontSize: 24 }}>{rolActual?.icon}</span>
          </div>
          <h1 style={styles.title}>Crear cuenta</h1>
          <p style={styles.subtitle}>Plataforma de Turismo Local</p>
        </div>

        {/* Selector de rol */}
        <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "0.5rem" }}>
          ¿Cómo quieres registrarte?
        </p>
        <div style={styles.rolGrid}>
          {ROLES.map((r) => (
            <button key={r.id} type="button"
              onClick={() => { setRol(r.id); setError(""); }}
              style={{
                ...styles.rolBtn,
                borderColor: rol === r.id ? color : "#e2e8f0",
                background: rol === r.id ? `${color}15` : "#f8fafc",
                color: rol === r.id ? color : "#64748b",
              }}>
              <span style={{ fontSize: 20 }}>{r.icon}</span>
              <span style={{ fontSize: "0.78rem", fontWeight: 600, textAlign: "center", lineHeight: 1.2 }}>{r.label}</span>
            </button>
          ))}
        </div>

        <div style={{ ...styles.infoBox, background: `${color}10`, borderColor: `${color}40` }}>
          <span style={{ fontSize: 13, color }}>{rolActual?.desc}</span>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {[
            { label: "Nombre completo", name: "nombre", type: "text", placeholder: "Ej. Juan Pérez", ico: "👤" },
            { label: "Correo electrónico", name: "email", type: "email", placeholder: "ejemplo@correo.com", ico: "✉️" },
            { label: "Contraseña", name: "password", type: showPassword ? "text" : "password", placeholder: "Mínimo 6 caracteres", ico: "🔒" },
            { label: "Confirmar contraseña", name: "confirmar", type: showPassword ? "text" : "password", placeholder: "Repite tu contraseña", ico: "🔐" },
          ].map((f) => (
            <div key={f.name} style={styles.fieldGroup}>
              <label style={styles.label}>{f.label}</label>
              <div style={styles.inputWrap}>
                <span style={styles.ico}>{f.ico}</span>
                <input type={f.type} name={f.name} value={form[f.name]} onChange={handleChange}
                  placeholder={f.placeholder} required style={styles.input}
                  onFocus={(e) => (e.target.style.borderColor = color)}
                  onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")} />
                {f.name === "password" && (
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                )}
              </div>
              {f.name === "confirmar" && form.confirmar && form.confirmar !== form.password && (
                <span style={{ fontSize: "0.78rem", color: "#ef4444" }}>Las contraseñas no coinciden</span>
              )}
            </div>
          ))}

          {error && <div style={styles.errorBox}>⚠️ {error}</div>}
          {success && <div style={styles.successBox}>✅ {success}</div>}

          <button type="submit" disabled={loading}
            style={{ ...styles.submitBtn, background: `linear-gradient(135deg,${color},#0ea5e9)`, opacity: loading ? 0.7 : 1 }}>
            {loading ? "Creando cuenta..." : `Registrarme como ${rolActual?.label}`}
          </button>
        </form>

        <div style={styles.footer}>
          <span style={{ fontSize: "0.855rem", color: "#64748b" }}>¿Ya tienes cuenta? </span>
          <a href="/login" style={{ fontSize: "0.855rem", color, fontWeight: 600, textDecoration: "none" }}>Inicia sesión</a>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "flex-end", backgroundImage: "url(" + fondoImg + ")", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat", fontFamily: "'Segoe UI',system-ui,sans-serif", padding: "1rem 3rem 1rem 1rem" },
  topBar: { position: "fixed", top: 0, left: 0, right: 0, height: 4 },
  card: { background: "rgba(255,255,255,0.15)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: "1.5px solid rgba(255,255,255,0.35)", borderRadius: 22, boxShadow: "0 10px 48px rgba(0,0,0,0.3)", padding: "2rem 1.75rem", width: "100%", maxWidth: 440 },
  header: { textAlign: "center", marginBottom: "1.25rem" },
  logoBox: { width: 56, height: 56, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.8rem", boxShadow: "0 4px 16px rgba(0,0,0,0.18)", transition: "background 0.4s" },
  title: { fontSize: "1.4rem", fontWeight: 700, color: "#1e293b", margin: "0 0 0.2rem" },
  subtitle: { fontSize: "0.8rem", color: "#64748b", margin: 0 },
  rolGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: "1rem" },
  rolBtn: { display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: "0.75rem 0.5rem", border: "2px solid", borderRadius: 12, cursor: "pointer", transition: "all 0.2s" },
  infoBox: { border: "1.5px solid", borderRadius: 10, padding: "0.6rem 0.85rem", marginBottom: "1.1rem", textAlign: "center" },
  form: { display: "flex", flexDirection: "column", gap: "0.9rem" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "0.3rem" },
  label: { fontSize: "0.82rem", fontWeight: 600, color: "#374151" },
  inputWrap: { position: "relative", display: "flex", alignItems: "center" },
  ico: { position: "absolute", left: 11, fontSize: 14, pointerEvents: "none" },
  input: { width: "100%", padding: "0.65rem 0.75rem 0.65rem 2.4rem", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: "0.9rem", color: "#1e293b", background: "#f8fafc", outline: "none", transition: "border-color 0.2s", boxSizing: "border-box" },
  eyeBtn: { position: "absolute", right: 10, background: "none", border: "none", cursor: "pointer", fontSize: 15, padding: "2px 4px" },
  errorBox: { background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", borderRadius: 8, padding: "0.6rem 0.85rem", fontSize: "0.84rem" },
  successBox: { background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", borderRadius: 8, padding: "0.6rem 0.85rem", fontSize: "0.84rem" },
  submitBtn: { width: "100%", padding: "0.8rem", color: "#fff", border: "none", borderRadius: 10, fontSize: "0.95rem", fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 14px rgba(0,0,0,0.2)", marginTop: 4 },
  footer: { textAlign: "center", marginTop: "1.25rem" },
};
