import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API          = `${import.meta.env.VITE_API_URL}/api/experiencias`;
const API_RESERVAS = `${import.meta.env.VITE_API_URL}/api/reservas`;
const API_MENU     = `${import.meta.env.VITE_API_URL}/api/menu`;

export default function DetalleExperiencia() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [exp, setExp]           = useState(null);
  const [loading, setLoading]   = useState(true);
  const [form, setForm]         = useState({ fecha: "", num_personas: 1, comentario: "" });
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje]   = useState("");
  const [menuItems, setMenuItems] = useState([]);
  const [pedido, setPedido]       = useState({});

  const user  = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");
  const hoy   = new Date().toISOString().split("T")[0];

  useEffect(() => {
    fetch(`${API}/${id}`)
      .then(r => r.json())
      .then(data => { setExp(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (exp?.categoria === "gastronomia" && exp?.id) {
      fetch(`${API_MENU}/${exp.id}`)
        .then(r => r.json())
        .then(data => setMenuItems(Array.isArray(data) ? data : []))
        .catch(() => setMenuItems([]));
    }
  }, [exp]);

  const cambiarCantidad = (itemId, delta) => {
    setPedido(p => ({ ...p, [itemId]: Math.max(0, (p[itemId] || 0) + delta) }));
  };

  const totalPedido = menuItems.reduce(
    (sum, item) => sum + (pedido[item.id] || 0) * parseFloat(item.precio), 0
  );

  async function enviarReserva() {
    if (!form.fecha) { setMensaje("Por favor selecciona una fecha."); return; }
    setEnviando(true); setMensaje("");
    try {
      const res = await fetch(API_RESERVAS, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          experiencia_id: exp.id,
          fecha:          form.fecha,
          num_personas:   exp.categoria === "gastronomia" ? 1 : form.num_personas,
          comentario:     form.comentario,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        navigate(`/pago/${data.id}`);
      } else {
        setMensaje("❌ " + data.message);
      }
    } catch { setMensaje("❌ Error de conexión"); }
    finally { setEnviando(false); }
  }

  const catInfo = {
    tour_turistico: { label: "Tour Turístico" },
    gastronomia:    { label: "Gastronomía" },
  };

  if (loading) return (
    <div style={s.centrado}>
      <div style={s.spinner} />
      <p style={{ color: "#f5c518", marginTop: 12 }}>Cargando...</p>
    </div>
  );

  if (!exp || exp.message) return (
    <div style={s.centrado}>
      <p style={{ fontSize: "1.2rem", color: "#f5c518" }}>Experiencia no encontrada.</p>
      <button onClick={() => navigate("/experiencias")} style={s.btnVolverAlt}>← Volver</button>
    </div>
  );

  const cat           = catInfo[exp.categoria] || { label: exp.categoria };
  const esGastronomia = exp.categoria === "gastronomia";
  const totalEstimado = esGastronomia
    ? totalPedido.toFixed(2)
    : (parseFloat(exp.precio) * form.num_personas).toFixed(2);

  return (
    <div style={s.page}>
      <div style={s.hero}>
        <div style={s.heroYellow}>
          <div style={s.heroCurve} />
          <div style={s.heroTextBlock}>
            <p style={s.heroSub}>Turismo Local Sucre</p>
            <h1 style={s.heroTitle}>{exp.titulo}</h1>
            <span style={s.heroBadge}>{cat.label}</span>
          </div>
        </div>
        <div style={s.heroImgWrap}>
          {exp.imagen_url
            ? <img src={exp.imagen_url} alt={exp.titulo} style={s.heroImg} />
            : <div style={{ ...s.heroImg, background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "6rem" }}>{esGastronomia ? "🍽️" : "🗺️"}</div>
          }
          <div style={s.heroImgOverlay} />
        </div>
        <button onClick={() => navigate("/experiencias")} style={s.btnVolver}>← Volver</button>
      </div>

      <div style={s.body}>
        <div style={s.colMain}>

          <div style={s.statsRow}>
            {esGastronomia ? (
              <>
                <div style={s.statBox}><span style={s.statVal}>🍽️</span><span style={s.statLabel}>ver carta abajo</span></div>
                <div style={s.statDivider} />
                <div style={s.statBox}><span style={s.statVal}>{exp.duracion}h</span><span style={s.statLabel}>duración</span></div>
                <div style={s.statDivider} />
                <div style={s.statBox}><span style={s.statVal}>{exp.capacidad}</span><span style={s.statLabel}>personas máx.</span></div>
              </>
            ) : (
              <>
                <div style={s.statBox}><span style={s.statVal}>Bs. {exp.precio}</span><span style={s.statLabel}>por persona</span></div>
                <div style={s.statDivider} />
                <div style={s.statBox}><span style={s.statVal}>{exp.duracion}h</span><span style={s.statLabel}>duración</span></div>
                <div style={s.statDivider} />
                <div style={s.statBox}><span style={s.statVal}>{exp.capacidad}</span><span style={s.statLabel}>personas máx.</span></div>
              </>
            )}
          </div>

          <div style={s.section}>
            <h2 style={s.sectionTitle}>Sobre esta experiencia</h2>
            <p style={s.sectionText}>{exp.descripcion}</p>
          </div>

          {esGastronomia && (
            <div style={s.section}>
              <h2 style={s.sectionTitle}>🍽️ Carta del lugar</h2>
              {menuItems.length === 0
                ? <p style={{ color: "#666", fontSize: "0.9rem" }}>Este local aún no ha publicado su carta.</p>
                : <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                    {menuItems.map(item => (
                      <div key={item.id} style={sc.platoCard}>
                        {item.imagen_url && <img src={item.imagen_url} alt={item.nombre} style={sc.platoImg} onError={e => e.target.style.display="none"} />}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={sc.platoNombre}>{item.nombre}</p>
                          {item.descripcion && <p style={sc.platoDesc}>{item.descripcion}</p>}
                          {item.ingredientes && <p style={sc.platoIngr}>🧂 {item.ingredientes}</p>}
                          <p style={sc.platoPrecio}>Bs. {item.precio}</p>
                        </div>
                        <div style={sc.counter}>
                          <button onClick={() => cambiarCantidad(item.id, -1)} style={sc.cBtn}>−</button>
                          <span style={sc.cVal}>{pedido[item.id] || 0}</span>
                          <button onClick={() => cambiarCantidad(item.id, +1)} style={sc.cBtn}>+</button>
                        </div>
                      </div>
                    ))}
                  </div>
              }
              {totalPedido > 0 && (
                <div style={{ ...s.totalBox, marginTop: "1rem" }}>
                  <span style={{ color: "#aaa", fontSize: "0.88rem" }}>Subtotal seleccionado</span>
                  <span style={s.totalPrecio}>Bs. {totalPedido.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          <div style={s.section}>
            <h2 style={s.sectionTitle}>Detalles</h2>
            <div style={s.detallesGrid}>
              {[
                { icon: "📁", label: "Categoría",       val: cat.label },
                { icon: "⏱️", label: "Duración",        val: `${exp.duracion} hora${exp.duracion != 1 ? "s" : ""}` },
                { icon: "👥", label: "Capacidad máxima", val: `${exp.capacidad} personas` },
                ...(!esGastronomia ? [{ icon: "💰", label: "Precio/persona", val: `Bs. ${exp.precio}`, accent: true }] : []),
                { icon: "🕒", label: "Horario",   val: exp.horarios  || "No definido" },
                { icon: "📍", label: "Dirección", val: exp.servicios || "No definido" },
              ].map((d, i) => (
                <div key={i} style={s.detalleItem}>
                  <span style={s.detalleIcon}>{d.icon}</span>
                  <div>
                    <span style={s.detalleLabel}>{d.label}</span>
                    <span style={{ ...s.detalleVal, ...(d.accent ? { color: "#f5c518", fontWeight: 700 } : {}) }}>{d.val}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={s.section}>
            <h2 style={s.sectionTitle}>Tu guía</h2>
            <div style={s.guiaRow}>
              <div style={s.guiaAvatar}>{exp.guia_nombre?.charAt(0).toUpperCase()}</div>
              <div>
                <p style={s.guiaNombre}>{exp.guia_nombre}</p>
                <p style={s.guiaRol}>{cat.label}</p>
              </div>
            </div>
          </div>

        </div>

        <div style={s.colSide}>
          <div style={s.reservaCard}>
            <div style={s.reservaHeader}>
              {esGastronomia ? (
                <><span style={s.reservaHeaderPrecio}>Bs. {totalPedido > 0 ? totalPedido.toFixed(2) : "0.00"}</span><span style={s.reservaHeaderLabel}>/ tu pedido</span></>
              ) : (
                <><span style={s.reservaHeaderPrecio}>Bs. {exp.precio}</span><span style={s.reservaHeaderLabel}>/ persona</span></>
              )}
            </div>

            {user?.rol === "turista" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Fecha deseada *</label>
                  <input type="date" min={hoy} value={form.fecha}
                    onChange={e => setForm({ ...form, fecha: e.target.value })} style={s.input} />
                </div>

                {!esGastronomia && (
                  <div style={s.fieldGroup}>
                    <label style={s.label}>Número de personas *</label>
                    <div style={s.counterRow}>
                      <button onClick={() => setForm(f => ({ ...f, num_personas: Math.max(1, f.num_personas - 1) }))} style={s.counterBtn}>−</button>
                      <span style={s.counterVal}>{form.num_personas}</span>
                      <button onClick={() => setForm(f => ({ ...f, num_personas: Math.min(exp.capacidad, f.num_personas + 1) }))} style={s.counterBtn}>+</button>
                    </div>
                    <span style={s.hint}>Máximo {exp.capacidad} personas</span>
                  </div>
                )}

                {esGastronomia && totalPedido === 0 && menuItems.length > 0 && (
                  <div style={{ background: "#1a1a1a", border: "1px solid #f5c518", borderRadius: 10, padding: "0.7rem 0.9rem", fontSize: "0.82rem", color: "#f5c518" }}>
                    ⬆️ Selecciona platos de la carta para ver tu total
                  </div>
                )}

                <div style={s.fieldGroup}>
                  <label style={s.label}>Comentario (opcional)</label>
                  <textarea
                    placeholder={esGastronomia ? "Ej: Alergia a mariscos, mesa para 4..." : "Ej: Somos un grupo familiar..."}
                    value={form.comentario}
                    onChange={e => setForm({ ...form, comentario: e.target.value })}
                    style={s.textarea} rows={3} />
                </div>

                <div style={s.totalBox}>
                  <span style={{ color: "#aaa", fontSize: "0.88rem" }}>Total estimado</span>
                  <span style={s.totalPrecio}>Bs. {totalEstimado}</span>
                </div>

                {mensaje && (
                  <div style={{ padding: "0.7rem 1rem", borderRadius: 10, border: "1px solid #ef4444", background: "#2a0f0f", color: "#f87171", fontSize: "0.85rem" }}>
                    {mensaje}
                  </div>
                )}

                <button onClick={enviarReserva} disabled={enviando}
                  style={{ ...s.submitBtn, opacity: enviando ? 0.7 : 1 }}>
                  {enviando ? "Procesando..." : "💳 Reservar y pagar"}
                </button>

                <p style={s.reservaNota}>Al continuar serás redirigido a la pantalla de pago con QR.</p>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "1rem 0" }}>
                <p style={{ color: "#aaa", fontSize: "0.9rem", marginBottom: 12 }}>Debes iniciar sesión como turista para reservar.</p>
                <a href="/login" style={{ ...s.submitBtn, display: "inline-block", textDecoration: "none", padding: "0.7rem 1.5rem" }}>Iniciar sesión</a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const YELLOW = "#f5c518";
const DARK   = "#111111";
const CARD   = "#1a1a1a";
const BORDER = "#2a2a2a";

const sc = {
  platoCard:   { display: "flex", alignItems: "center", gap: "1rem", background: "#222", borderRadius: 12, padding: "0.9rem", border: "1px solid #2a2a2a" },
  platoImg:    { width: 140, height: 110, objectFit: "cover", borderRadius: 10, flexShrink: 0 },
  platoNombre: { margin: 0, fontWeight: 700, color: "#fff", fontSize: "0.95rem" },
  platoDesc:   { margin: "3px 0 0", color: "#aaa", fontSize: "0.8rem" },
  platoIngr:   { margin: "3px 0 0", color: "#888", fontSize: "0.75rem" },
  platoPrecio: { margin: "6px 0 0", color: YELLOW, fontWeight: 800, fontSize: "0.9rem" },
  counter:     { display: "flex", alignItems: "center", gap: 6, flexShrink: 0 },
  cBtn:        { width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${YELLOW}`, background: "none", color: YELLOW, fontSize: "1.1rem", fontWeight: 700, cursor: "pointer" },
  cVal:        { minWidth: 28, textAlign: "center", fontWeight: 700, color: "#fff", fontSize: "1rem" },
};

const s = {
  page:      { minHeight: "100vh", background: DARK, fontFamily: "'Segoe UI', system-ui, sans-serif", color: "#fff" },
  centrado:  { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", gap: 16, background: DARK },
  spinner:   { width: 36, height: 36, border: "3px solid #333", borderTop: `3px solid ${YELLOW}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  btnVolverAlt: { marginTop: 8, padding: "0.6rem 1.4rem", background: YELLOW, color: "#111", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700 },
  hero:      { position: "relative", display: "flex", height: 460, overflow: "hidden" },
  heroYellow:{ position: "relative", width: "42%", background: YELLOW, display: "flex", alignItems: "flex-end", padding: "2.5rem 2rem 2.5rem 2.5rem", zIndex: 2, flexShrink: 0 },
  heroCurve: { position: "absolute", top: 0, right: -60, width: 120, height: "100%", background: YELLOW, borderRadius: "0 60% 60% 0", zIndex: 1 },
  heroTextBlock: { position: "relative", zIndex: 2 },
  heroSub:   { fontSize: "0.82rem", fontWeight: 600, color: "#333", letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 8px" },
  heroTitle: { fontSize: "2.8rem", fontWeight: 900, color: "#111", margin: "0 0 16px", lineHeight: 1.1 },
  heroBadge: { display: "inline-block", background: "#111", color: YELLOW, padding: "0.3rem 1rem", borderRadius: 20, fontSize: "0.75rem", fontWeight: 700 },
  heroImgWrap:    { flex: 1, position: "relative" },
  heroImg:        { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  heroImgOverlay: { position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(245,197,24,0.15) 0%, transparent 40%)" },
  btnVolver: { position: "absolute", top: 20, left: 20, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", border: `1px solid ${YELLOW}`, color: YELLOW, borderRadius: 10, padding: "0.45rem 1.1rem", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", zIndex: 10 },
  body:      { maxWidth: 1100, margin: "0 auto", padding: "2rem 1.5rem", display: "grid", gridTemplateColumns: "1fr 360px", gap: "2rem", alignItems: "start" },
  colMain:   { display: "flex", flexDirection: "column", gap: "1.25rem" },
  colSide:   { position: "sticky", top: 24 },
  statsRow:  { display: "flex", alignItems: "center", background: CARD, borderRadius: 16, padding: "1.5rem", border: `1px solid ${BORDER}` },
  statBox:   { flex: 1, textAlign: "center" },
  statVal:   { display: "block", fontSize: "1.6rem", fontWeight: 800, color: YELLOW },
  statLabel: { display: "block", fontSize: "0.78rem", color: "#777", marginTop: 4 },
  statDivider: { width: 1, height: 48, background: BORDER, margin: "0 1rem" },
  section:      { background: CARD, borderRadius: 16, padding: "1.5rem", border: `1px solid ${BORDER}` },
  sectionTitle: { fontSize: "1rem", fontWeight: 700, color: YELLOW, margin: "0 0 1rem" },
  sectionText:  { fontSize: "0.95rem", color: "#bbb", lineHeight: 1.75, margin: 0 },
  detallesGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" },
  detalleItem:  { display: "flex", alignItems: "center", gap: 12, background: "#222", borderRadius: 12, padding: "0.85rem", border: `1px solid ${BORDER}` },
  detalleIcon:  { fontSize: "1.4rem" },
  detalleLabel: { display: "block", fontSize: "0.72rem", color: "#777", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" },
  detalleVal:   { display: "block", fontSize: "0.92rem", color: "#e5e5e5", fontWeight: 600, marginTop: 2 },
  guiaRow:    { display: "flex", alignItems: "center", gap: 14 },
  guiaAvatar: { width: 48, height: 48, borderRadius: "50%", background: YELLOW, color: "#111", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", fontWeight: 800, flexShrink: 0 },
  guiaNombre: { margin: 0, fontWeight: 700, color: "#fff", fontSize: "1rem" },
  guiaRol:    { margin: "3px 0 0", fontSize: "0.8rem", color: "#777" },
  reservaCard:   { background: CARD, borderRadius: 20, padding: "1.5rem", border: `1px solid ${BORDER}`, boxShadow: "0 8px 32px rgba(0,0,0,0.5)" },
  reservaHeader: { display: "flex", alignItems: "baseline", gap: 6, paddingBottom: "1.25rem", marginBottom: "1.25rem", borderBottom: `1px solid ${BORDER}` },
  reservaHeaderPrecio: { fontSize: "2rem", fontWeight: 800, color: YELLOW },
  reservaHeaderLabel:  { fontSize: "0.88rem", color: "#777" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "0.35rem" },
  label:      { fontSize: "0.8rem", fontWeight: 600, color: "#aaa" },
  input:      { padding: "0.65rem 0.9rem", border: `1.5px solid ${BORDER}`, borderRadius: 10, fontSize: "0.92rem", color: "#fff", outline: "none", background: "#222", colorScheme: "dark" },
  textarea:   { padding: "0.65rem 0.9rem", border: `1.5px solid ${BORDER}`, borderRadius: 10, fontSize: "0.88rem", color: "#fff", outline: "none", background: "#222", resize: "vertical", fontFamily: "inherit" },
  hint:       { fontSize: "0.73rem", color: "#666" },
  counterRow: { display: "flex", alignItems: "center", border: `1.5px solid ${BORDER}`, borderRadius: 10, overflow: "hidden", background: "#222" },
  counterBtn: { width: 44, height: 44, border: "none", background: "none", fontSize: "1.2rem", cursor: "pointer", color: YELLOW, fontWeight: 700 },
  counterVal: { flex: 1, textAlign: "center", fontWeight: 700, fontSize: "1rem", color: "#fff" },
  totalBox:   { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#222", borderRadius: 12, padding: "0.85rem 1rem", border: `1px solid ${BORDER}` },
  totalPrecio:{ fontSize: "1.2rem", fontWeight: 800, color: YELLOW },
  submitBtn:  { width: "100%", padding: "0.9rem", background: YELLOW, color: "#111", border: "none", borderRadius: 12, fontSize: "0.97rem", fontWeight: 800, cursor: "pointer" },
  reservaNota:{ textAlign: "center", fontSize: "0.75rem", color: "#666", margin: 0 },
};
