import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import vistaImg from "../assets/vista.jpg";

const API = "http://localhost:3000/api/experiencias";

export default function Experiencias() {
  const [experiencias, setExperiencias] = useState([]);
  const [categoria, setCategoria] = useState("todas");
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState("recientes");
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState(null);

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const navigate = useNavigate();

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

  function cerrarSesion() { localStorage.clear(); window.location.href = "/login"; }

  const filtradas = experiencias.filter((exp) => {
    const texto = busqueda.toLowerCase();
    return exp.titulo?.toLowerCase().includes(texto) || exp.descripcion?.toLowerCase().includes(texto) || exp.guia_nombre?.toLowerCase().includes(texto);
  });

  const ordenadas = [...filtradas].sort((a, b) => {
    if (orden === "precio_asc") return a.precio - b.precio;
    if (orden === "precio_desc") return b.precio - a.precio;
    if (orden === "duracion") return a.duracion - b.duracion;
    if (orden === "capacidad") return b.capacidad - a.capacidad;
    return b.id - a.id;
  });

  const catColor = {
    tour_turistico: { color: "#2563eb", label: "Tour Turístico" },
    gastronomia:    { color: "#d97706", label: "Gastronomía" },
  };

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <span style={{ fontSize: 22 }}>🌄</span>
          <div>
            <h1 style={s.headerTitle}> SucreGO</h1>
            <p style={s.headerSub}>Descubre experiencias únicas</p>
          </div>
        </div>
        <div style={s.headerRight}>
          {user?.rol === "admin" && <a href="/admin/usuarios" style={s.navBtn}>🛡️ Admin</a>}
          {(user?.rol === "guia_turistico" || user?.rol === "guia_gastronomico") && <a href="/panel-guia" style={s.navBtn}>📋 Mi Panel</a>}
          <a href="/mi-perfil" style={s.navBtn}>👤 Mi Perfil</a>
          <button onClick={cerrarSesion} style={s.logoutBtn}>🚪 Salir</button>
        </div>
      </div>

      {/* Hero */}
      <div style={s.hero}>
        <h2 style={s.heroTitle}>Explora Sucre, Bolivia</h2>
        <p style={s.heroSub}>Tours culturales, gastronómicos y experiencias únicas</p>
        <div style={s.searchWrap}>
          <span style={{ fontSize: 16 }}>🔍</span>
          <input
            type="text"
            placeholder="Buscar experiencias, guías..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={s.searchInput}
          />
          {busqueda && <button onClick={() => setBusqueda("")} style={s.clearBtn}>✕</button>}
        </div>
      </div>

      {/* Filtros */}
      <div style={s.container}>
        <div style={s.filtrosRow}>
          <div style={s.filtros}>
            {[
              { id: "todas",          label: "Todas",           color: "#7c3aed" },
              { id: "tour_turistico", label: "Tours Turísticos", color: "#2563eb" },
              { id: "gastronomia",    label: "Gastronomía",      color: "#d97706" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setCategoria(f.id)}
                style={{
                  ...s.filtroBtn,
                  background:   categoria === f.id ? f.color : "#fff",
                  color:        categoria === f.id ? "#fff"   : "#64748b",
                  borderColor:  categoria === f.id ? f.color  : "#e2e8f0",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div style={s.ordenWrap}>
            <span style={s.ordenLabel}>Ordenar:</span>
            <select value={orden} onChange={(e) => setOrden(e.target.value)} style={s.ordenSelect}>
              <option value="recientes">Más recientes</option>
              <option value="precio_asc">Menor precio</option>
              <option value="precio_desc">Mayor precio</option>
              <option value="duracion">Menor duración</option>
              <option value="capacidad">Mayor capacidad</option>
            </select>
          </div>
        </div>

        {busqueda && (
          <p style={s.resultadoTexto}>
            {ordenadas.length} resultado(s) para "<strong>{busqueda}</strong>"
          </p>
        )}

        {/* Grid estilo CBN */}
        {loading ? (
          <div style={s.empty}>Cargando experiencias...</div>
        ) : ordenadas.length === 0 ? (
          <div style={s.empty}>
            <p style={{ fontSize: "1.5rem", marginBottom: 8 }}>Sin resultados</p>
            <p style={{ color: "#94a3b8" }}>
              {busqueda
                ? `No se encontraron resultados para "${busqueda}"`
                : "No hay experiencias disponibles aún"}
            </p>
          </div>
        ) : (
          <div style={s.grid}>
            {ordenadas.map((exp) => {
              const isHovered = hoveredId === exp.id;
              const cat = catColor[exp.categoria];
              return (
                <div
                  key={exp.id}
                  style={{
                    ...s.card,
                    transform:  isHovered ? "translateY(-6px)" : "translateY(0)",
                    boxShadow:  isHovered
                      ? "0 20px 50px rgba(0,0,0,0.25)"
                      : "0 2px 16px rgba(0,0,0,0.1)",
                  }}
                  onMouseEnter={() => setHoveredId(exp.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => navigate(`/experiencias/${exp.id}`)}
                >
                  {/* Imagen full */}
                  <div style={s.cardImg}>
                    {exp.imagen_url ? (
                      <img
                        src={exp.imagen_url}
                        alt={exp.titulo}
                        style={{
                          width: "100%", height: "100%", objectFit: "cover",
                          transition: "transform 0.4s",
                          transform: isHovered ? "scale(1.07)" : "scale(1)",
                        }}
                      />
                    ) : (
                      <div style={{
                        width: "100%", height: "100%",
                        background: "linear-gradient(135deg,#1e3a5f,#2563eb)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontSize: "3rem"
                      }}>
                        {exp.categoria === "tour_turistico" ? "🗺️" : "🍽️"}
                      </div>
                    )}

                    {/* Gradiente inferior siempre visible */}
                    <div style={{
                      position: "absolute", inset: 0,
                      background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)",
                    }} />

                    {/* Badge categoría */}
                    <span style={{
                      ...s.catBadge,
                      background: cat?.color + "22",
                      color: cat?.color,
                      border: `1px solid ${cat?.color}55`,
                    }}>
                      {cat?.label}
                    </span>

                    {/* Nombre sobre la imagen */}
                    <div style={s.cardOverlayName}>
                      <h3 style={s.cardTitle}>{exp.titulo}</h3>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "#f1f5f9", fontFamily: "'Segoe UI',system-ui,sans-serif" },

  header: {
    background: "linear-gradient(135deg,#1e3a5f,#2563eb)",
    padding: "1rem 2rem", display: "flex", alignItems: "center",
    justifyContent: "space-between", boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
  },
  headerLeft:  { display: "flex", alignItems: "center", gap: 12 },
  headerTitle: { fontSize: "1.1rem", fontWeight: 700, color: "#fff", margin: 0 },
  headerSub:   { fontSize: "0.78rem", color: "rgba(255,255,255,0.75)", margin: 0 },
  headerRight: { display: "flex", alignItems: "center", gap: 8 },
  navBtn: {
    background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
    color: "#fff", borderRadius: 8, padding: "0.4rem 0.85rem",
    fontSize: "0.82rem", fontWeight: 600, textDecoration: "none", cursor: "pointer",
  },
  logoutBtn: {
    background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
    color: "#fff", borderRadius: 8, padding: "0.4rem 0.85rem",
    fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
  },

  hero: {
    backgroundImage: "url(" + vistaImg + ")", backgroundSize: "cover",
    backgroundPosition: "center", padding: "3rem 2rem 2rem",
  },
  heroTitle:  { fontSize: "2rem", fontWeight: 800, color: "#fff", margin: "0 0 0.5rem", letterSpacing: "-0.02em" },
  heroSub:    { fontSize: "1rem", color: "rgba(255,255,255,0.85)", margin: "0 0 1.5rem" },
  searchWrap: {
    display: "flex", alignItems: "center",
    background: "rgba(255,255,255,0.95)", borderRadius: 12,
    padding: "0.6rem 1rem", maxWidth: 500, gap: 8,
    boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
  },
  searchInput: { flex: 1, border: "none", outline: "none", fontSize: "0.95rem", background: "transparent", color: "#1e293b" },
  clearBtn:    { background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 14 },

  container:     { maxWidth: 1200, margin: "0 auto", padding: "2rem 1.5rem" },
  filtrosRow:    { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: "2rem" },
  filtros:       { display: "flex", gap: 10, flexWrap: "wrap" },
  filtroBtn:     { padding: "0.55rem 1.2rem", border: "2px solid", borderRadius: 20, fontSize: "0.88rem", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" },
  ordenWrap:     { display: "flex", alignItems: "center", gap: 8 },
  ordenLabel:    { fontSize: "0.85rem", color: "#64748b", fontWeight: 600 },
  ordenSelect:   { padding: "0.5rem 0.85rem", border: "2px solid #e2e8f0", borderRadius: 10, fontSize: "0.85rem", color: "#1e293b", background: "#fff", cursor: "pointer", outline: "none" },
  resultadoTexto:{ fontSize: "0.88rem", color: "#64748b", marginBottom: "1rem" },

  empty: { textAlign: "center", color: "#94a3b8", padding: "4rem", fontSize: "1rem" },

  /* Grid: 3 columnas fijas como CBN */
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
    gap: "1.5rem",
  },

  /* Card: solo imagen */
  card: {
    borderRadius: 16, overflow: "hidden",
    cursor: "pointer", position: "relative",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
  },
  cardImg: {
    height: 280, position: "relative", overflow: "hidden",
    background: "#e2e8f0",
  },
  catBadge: {
    position: "absolute", top: 14, left: 14,
    padding: "0.25rem 0.75rem", borderRadius: 20,
    fontSize: "0.72rem", fontWeight: 700,
    backdropFilter: "blur(6px)",
    background: "rgba(255,255,255,0.15)",
    color: "#fff", border: "1px solid rgba(255,255,255,0.35)",
  },
  cardOverlayName: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    padding: "1rem 1.25rem",
  },
  cardTitle: {
    color: "#fff", margin: 0,
    fontSize: "1.15rem", fontWeight: 700,
    textShadow: "0 1px 4px rgba(0,0,0,0.5)",
    letterSpacing: "-0.01em",
  },
};
