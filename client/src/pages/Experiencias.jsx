import { useState, useEffect } from "react";
import vistaImg from "../assets/vista.jpg";

const API = "http://localhost:3000/api/experiencias";
const API_RESERVAS = "http://localhost:3000/api/reservas";

export default function Experiencias() {
  const [experiencias, setExperiencias] = useState([]);
  const [categoria, setCategoria] = useState("todas");
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState("recientes");
  const [loading, setLoading] = useState(true);

  // Modal de reserva
  const [modalExp, setModalExp] = useState(null); // experiencia seleccionada
  const [form, setForm] = useState({ fecha: "", num_personas: 1, comentario: "" });
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");

  useEffect(() => { cargar(); }, [categoria]);

  async function cargar() {
    setLoading(true);
    try {
      const url = categoria === "todas" ? API : `${API}?categoria=${categoria}`;
      const res = await fetch(url);
      const data = await res.json();
      setExperiencias(data);
    } catch { setExperiencias([]); }
    finally { setLoading(false); }
  }

  function cerrarSesion() {
    localStorage.clear();
    window.location.href = "/login";
  }

  function abrirModal(exp) {
    setModalExp(exp);
    setForm({ fecha: "", num_personas: 1, comentario: "" });
    setMensaje("");
  }

  function cerrarModal() {
    setModalExp(null);
    setMensaje("");
  }

  async function enviarReserva() {
    if (!form.fecha) { setMensaje("Por favor selecciona una fecha."); return; }
    if (form.num_personas < 1) { setMensaje("Mínimo 1 persona."); return; }
    setEnviando(true);
    setMensaje("");
    try {
      const res = await fetch(API_RESERVAS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          experiencia_id: modalExp.id,
          fecha: form.fecha,
          num_personas: form.num_personas,
          comentario: form.comentario
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMensaje("✅ " + data.message);
        setTimeout(() => cerrarModal(), 2000);
      } else {
        setMensaje("❌ " + data.message);
      }
    } catch {
      setMensaje("❌ Error de conexión");
    } finally {
      setEnviando(false);
    }
  }

  // Filtrar por búsqueda
  const filtradas = experiencias.filter((exp) => {
    const texto = busqueda.toLowerCase();
    return (
      exp.titulo?.toLowerCase().includes(texto) ||
      exp.descripcion?.toLowerCase().includes(texto) ||
      exp.guia_nombre?.toLowerCase().includes(texto)
    );
  });

  // Ordenar
  const ordenadas = [...filtradas].sort((a, b) => {
    if (orden === "precio_asc") return a.precio - b.precio;
    if (orden === "precio_desc") return b.precio - a.precio;
    if (orden === "duracion") return a.duracion - b.duracion;
    if (orden === "capacidad") return b.capacidad - a.capacidad;
    return b.id - a.id;
  });

  const catColor = {
    tour_turistico: { bg: "#eff6ff", color: "#2563eb", label: "🗺️ Tour Turístico" },
    gastronomia: { bg: "#fff7ed", color: "#d97706", label: "🍽️ Gastronomía" },
  };

  // Fecha mínima = hoy
  const hoy = new Date().toISOString().split("T")[0];

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={{ fontSize: 22 }}>🌄</span>
          <div>
            <h1 style={styles.headerTitle}>Turismo Local Sucre</h1>
            <p style={styles.headerSub}>Descubre experiencias únicas</p>
          </div>
        </div>
        <div style={styles.headerRight}>
          {user?.rol === "admin" && (
            <a href="/admin/usuarios" style={styles.navBtn}>🛡️ Admin</a>
          )}
          {(user?.rol === "guia_turistico" || user?.rol === "guia_gastronomico") && (
            <a href="/panel-guia" style={styles.navBtn}>📋 Mi Panel</a>
          )}
          <a href="/mi-perfil" style={styles.navBtn}>👤 Mi Perfil</a>
          <button onClick={cerrarSesion} style={styles.logoutBtn}>🚪 Salir</button>
        </div>
      </div>

      {/* Hero */}
      <div style={styles.hero}>
        <h2 style={styles.heroTitle}>Explora Sucre, Bolivia</h2>
        <p style={styles.heroSub}>Tours culturales, gastronómicos y experiencias únicas</p>
        <div style={styles.searchWrap}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Buscar experiencias, guías..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={styles.searchInput}
          />
          {busqueda && (
            <button onClick={() => setBusqueda("")} style={styles.clearBtn}>✕</button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div style={styles.container}>
        <div style={styles.filtrosRow}>
          <div style={styles.filtros}>
            {[
              { id: "todas", label: "✨ Todas", color: "#7c3aed" },
              { id: "tour_turistico", label: "🗺️ Tours Turísticos", color: "#2563eb" },
              { id: "gastronomia", label: "🍽️ Gastronomía", color: "#d97706" },
            ].map((f) => (
              <button key={f.id} onClick={() => setCategoria(f.id)}
                style={{
                  ...styles.filtroBtn,
                  background: categoria === f.id ? f.color : "#f8fafc",
                  color: categoria === f.id ? "#fff" : "#64748b",
                  borderColor: categoria === f.id ? f.color : "#e2e8f0",
                }}>
                {f.label}
              </button>
            ))}
          </div>
          <div style={styles.ordenWrap}>
            <span style={styles.ordenLabel}>Ordenar:</span>
            <select value={orden} onChange={(e) => setOrden(e.target.value)} style={styles.ordenSelect}>
              <option value="recientes">🕐 Más recientes</option>
              <option value="precio_asc">💰 Menor precio</option>
              <option value="precio_desc">💎 Mayor precio</option>
              <option value="duracion">⏱️ Menor duración</option>
              <option value="capacidad">👥 Mayor capacidad</option>
            </select>
          </div>
        </div>

        {busqueda && (
          <p style={styles.resultadoTexto}>
            {ordenadas.length} resultado(s) para "<strong>{busqueda}</strong>"
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div style={styles.empty}>Cargando experiencias...</div>
        ) : ordenadas.length === 0 ? (
          <div style={styles.empty}>
            <p style={{ fontSize: "3rem" }}>🏔️</p>
            <p>{busqueda ? `No se encontraron resultados para "${busqueda}"` : "No hay experiencias disponibles aún"}</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {ordenadas.map((exp) => (
              <div key={exp.id} style={styles.card}>
                <div style={styles.cardImg}>
                  {exp.imagen_url ? (
                    <img src={exp.imagen_url} alt={exp.titulo}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={styles.cardImgPlaceholder}>
                      {exp.categoria === "tour_turistico" ? "🗺️" : "🍽️"}
                    </div>
                  )}
                  <span style={{
                    ...styles.catBadge,
                    background: catColor[exp.categoria]?.bg,
                    color: catColor[exp.categoria]?.color,
                  }}>
                    {catColor[exp.categoria]?.label}
                  </span>
                </div>
                <div style={styles.cardBody}>
                  <h3 style={styles.cardTitle}>{exp.titulo}</h3>
                  <p style={styles.cardDesc}>{exp.descripcion}</p>
                  <div style={styles.cardMeta}>
                    <span>⏱️ {exp.duracion}h</span>
                    <span>👥 Máx. {exp.capacidad} personas</span>
                    <span>👤 {exp.guia_nombre}</span>
                  </div>
                  <div style={styles.cardFooter}>
                    <span style={styles.precio}>Bs. {exp.precio}</span>
                    {user?.rol === "turista" && (
                      <button style={styles.reservarBtn} onClick={() => abrirModal(exp)}>
                        🎫 Reservar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Reserva */}
      {modalExp && (
        <div style={styles.overlay} onClick={cerrarModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            {/* Header del modal */}
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>🎫 Solicitar Reserva</h3>
                <p style={styles.modalSub}>{modalExp.titulo}</p>
              </div>
              <button onClick={cerrarModal} style={styles.closeBtn}>✕</button>
            </div>

            {/* Info de la experiencia */}
            <div style={styles.modalInfo}>
              <span>⏱️ {modalExp.duracion}h</span>
              <span>👥 Máx. {modalExp.capacidad} personas</span>
              <span style={styles.modalPrecio}>Bs. {modalExp.precio} / persona</span>
            </div>

            {/* Formulario */}
            <div style={styles.modalBody}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>📅 Fecha deseada *</label>
                <input
                  type="date"
                  min={hoy}
                  value={form.fecha}
                  onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                  style={styles.input}
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>👥 Número de personas *</label>
                <input
                  type="number"
                  min={1}
                  max={modalExp.capacidad}
                  value={form.num_personas}
                  onChange={(e) => setForm({ ...form, num_personas: parseInt(e.target.value) })}
                  style={styles.input}
                />
                <span style={styles.hint}>Máximo {modalExp.capacidad} personas</span>
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>💬 Comentario o nota (opcional)</label>
                <textarea
                  placeholder="Ej: Somos un grupo familiar, necesitamos guía en inglés..."
                  value={form.comentario}
                  onChange={(e) => setForm({ ...form, comentario: e.target.value })}
                  style={styles.textarea}
                  rows={3}
                />
              </div>

              {/* Total estimado */}
              <div style={styles.totalBox}>
                <span>Total estimado:</span>
                <span style={styles.totalPrecio}>
                  Bs. {(modalExp.precio * form.num_personas).toFixed(2)}
                </span>
              </div>

              {mensaje && (
                <div style={{
                  ...styles.mensajeBox,
                  background: mensaje.startsWith("✅") ? "#f0fdf4" : "#fef2f2",
                  borderColor: mensaje.startsWith("✅") ? "#86efac" : "#fecaca",
                  color: mensaje.startsWith("✅") ? "#15803d" : "#b91c1c",
                }}>
                  {mensaje}
                </div>
              )}

              <button
                onClick={enviarReserva}
                disabled={enviando}
                style={{ ...styles.submitBtn, opacity: enviando ? 0.7 : 1 }}
              >
                {enviando ? "Enviando..." : "📨 Enviar Solicitud"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f8fafc", fontFamily: "'Segoe UI',system-ui,sans-serif" },
  header: { background: "linear-gradient(135deg,#1e3a5f,#2563eb)", padding: "1rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 12px rgba(0,0,0,0.2)" },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  headerTitle: { fontSize: "1.1rem", fontWeight: 700, color: "#fff", margin: 0 },
  headerSub: { fontSize: "0.78rem", color: "rgba(255,255,255,0.75)", margin: 0 },
  headerRight: { display: "flex", alignItems: "center", gap: 8 },
  navBtn: { background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", borderRadius: 8, padding: "0.4rem 0.85rem", fontSize: "0.82rem", fontWeight: 600, textDecoration: "none", cursor: "pointer" },
  logoutBtn: { background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", borderRadius: 8, padding: "0.4rem 0.85rem", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" },
  hero: { backgroundImage: "url(" + vistaImg + ")", backgroundSize: "cover", backgroundPosition: "center", padding: "3rem 2rem 2rem" },
  heroTitle: { fontSize: "2rem", fontWeight: 800, color: "#fff", margin: "0 0 0.5rem", letterSpacing: "-0.02em" },
  heroSub: { fontSize: "1rem", color: "rgba(255,255,255,0.85)", margin: "0 0 1.5rem" },
  searchWrap: { display: "flex", alignItems: "center", background: "rgba(255,255,255,0.95)", borderRadius: 12, padding: "0.6rem 1rem", maxWidth: 500, gap: 8, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, border: "none", outline: "none", fontSize: "0.95rem", background: "transparent", color: "#1e293b" },
  clearBtn: { background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 14, padding: "0 4px" },
  container: { maxWidth: 1100, margin: "0 auto", padding: "2rem 1.5rem" },
  filtrosRow: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: "1.5rem" },
  filtros: { display: "flex", gap: 10, flexWrap: "wrap" },
  filtroBtn: { padding: "0.6rem 1.2rem", border: "2px solid", borderRadius: 20, fontSize: "0.88rem", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" },
  ordenWrap: { display: "flex", alignItems: "center", gap: 8 },
  ordenLabel: { fontSize: "0.85rem", color: "#64748b", fontWeight: 600 },
  ordenSelect: { padding: "0.5rem 0.85rem", border: "2px solid #e2e8f0", borderRadius: 10, fontSize: "0.85rem", color: "#1e293b", background: "#fff", cursor: "pointer", outline: "none" },
  resultadoTexto: { fontSize: "0.88rem", color: "#64748b", marginBottom: "1rem" },
  empty: { textAlign: "center", color: "#94a3b8", padding: "4rem", fontSize: "1rem" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "1.5rem" },
  card: { background: "#fff", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", overflow: "hidden", transition: "transform 0.2s, box-shadow 0.2s" },
  cardImg: { height: 180, position: "relative", background: "#f1f5f9", overflow: "hidden" },
  cardImgPlaceholder: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "4rem", background: "linear-gradient(135deg,#f0f4ff,#e0e7ff)" },
  catBadge: { position: "absolute", top: 10, left: 10, padding: "0.25rem 0.7rem", borderRadius: 20, fontSize: "0.75rem", fontWeight: 600 },
  cardBody: { padding: "1.25rem" },
  cardTitle: { fontSize: "1rem", fontWeight: 700, color: "#1e293b", margin: "0 0 0.5rem" },
  cardDesc: { fontSize: "0.85rem", color: "#64748b", margin: "0 0 0.75rem", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" },
  cardMeta: { display: "flex", flexWrap: "wrap", gap: 8, fontSize: "0.78rem", color: "#94a3b8", marginBottom: "0.75rem" },
  cardFooter: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  precio: { fontSize: "1.1rem", fontWeight: 700, color: "#2563eb" },
  reservarBtn: { background: "linear-gradient(135deg,#2563eb,#0ea5e9)", color: "#fff", border: "none", borderRadius: 8, padding: "0.5rem 1rem", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" },
  // Modal
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" },
  modal: { background: "#fff", borderRadius: 20, width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.3)", overflow: "hidden" },
  modalHeader: { background: "linear-gradient(135deg,#1e3a5f,#2563eb)", padding: "1.25rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  modalTitle: { color: "#fff", margin: 0, fontSize: "1.1rem", fontWeight: 700 },
  modalSub: { color: "rgba(255,255,255,0.8)", margin: "0.25rem 0 0", fontSize: "0.85rem" },
  closeBtn: { background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" },
  modalInfo: { display: "flex", gap: 16, padding: "0.85rem 1.5rem", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontSize: "0.83rem", color: "#64748b", flexWrap: "wrap" },
  modalPrecio: { color: "#2563eb", fontWeight: 700 },
  modalBody: { padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1rem" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "0.3rem" },
  label: { fontSize: "0.82rem", fontWeight: 600, color: "#374151" },
  input: { padding: "0.65rem 0.85rem", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: "0.92rem", color: "#1e293b", outline: "none", background: "#f8fafc" },
  textarea: { padding: "0.65rem 0.85rem", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: "0.88rem", color: "#1e293b", outline: "none", background: "#f8fafc", resize: "vertical", fontFamily: "inherit" },
  hint: { fontSize: "0.75rem", color: "#94a3b8" },
  totalBox: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#eff6ff", borderRadius: 10, padding: "0.75rem 1rem", border: "1px solid #bfdbfe" },
  totalPrecio: { fontSize: "1.1rem", fontWeight: 700, color: "#2563eb" },
  mensajeBox: { padding: "0.7rem 1rem", borderRadius: 10, border: "1px solid", fontSize: "0.88rem", fontWeight: 500 },
  submitBtn: { width: "100%", padding: "0.85rem", background: "linear-gradient(135deg,#2563eb,#0ea5e9)", color: "#fff", border: "none", borderRadius: 10, fontSize: "0.97rem", fontWeight: 700, cursor: "pointer" },
};
