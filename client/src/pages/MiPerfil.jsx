import { useState, useEffect } from "react";
import iconAdmin from "../assets/iconos/administrator.jpg";
import iconGuiaTuristico from "../assets/iconos/guia_turistico.jpg";
import iconGuiaGastronomico from "../assets/iconos/guia_gastronomico.png";
import iconTurista from "../assets/iconos/turista.jpg";
import iconCorreo from "../assets/iconos/correo.jpg";
import iconTarjeta from "../assets/iconos/tarjeta.png";

const API_RESERVAS = `${import.meta.env.VITE_API_URL}/api/reservas`;

export default function MiPerfil() {
  const [user, setUser]         = useState(null);
  const [reservas, setReservas] = useState([]);
  const [tabActiva, setTabActiva] = useState("perfil");

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { window.location.href = "/login"; return; }
    const u = JSON.parse(stored);
    setUser(u);
    if (u.rol === "turista") cargarReservas();
  }, []);

  async function cargarReservas() {
    try {
      const res  = await fetch(`${API_RESERVAS}/mis-reservas`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      setReservas(Array.isArray(data) ? data : []);
    } catch { setReservas([]); }
  }

  function cerrarSesion() {
    localStorage.clear();
    window.location.href = "/login";
  }

  if (!user) return null;

  const rolLabel = {
    viajero:           "🧳 Viajero",
    turista:           "Turista",
    guia:              "Guía local",
    guia_gastronomico: "Guía gastronómico",
    admin:             "Administrador",
  };

  const rolIcon = {
    admin:             iconAdmin,
    guia:              iconGuiaTuristico,
    guia_gastronomico: iconGuiaGastronomico,
    viajero:           iconTurista,
    turista:           iconTurista,
  };

  const userIcon = rolIcon[user.rol] || iconTurista;

  const estadoConfig = {
    pendiente:      { color: "#f5c518", label: "⏳ Pendiente",        desc: "Esperando respuesta del guía" },
    aceptada:       { color: "#3b82f6", label: "✅ Aceptada",         desc: "¡Realiza tu pago para confirmar!" },
    pago_enviado:   { color: "#a855f7", label: "📤 Pago enviado",     desc: "El guía está revisando tu comprobante" },
    pagado:         { color: "#22c55e", label: "💚 Pagado",           desc: "Reserva confirmada y pagada" },
    rechazada:      { color: "#ef4444", label: "❌ Rechazada",        desc: "El guía rechazó la solicitud" },
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={{ fontSize: 22, color: "#f5c518" }}>🌄</span>
          <div>
            <h1 style={styles.headerTitle}>SucreGo</h1>
            <p style={styles.headerSub}>Mi perfil</p>
          </div>
        </div>
        <button onClick={cerrarSesion} style={styles.logoutBtn}>🚪 Cerrar sesión</button>
      </div>

      <div style={styles.container}>

        {/* Tabs — solo turista ve reservas */}
        {user.rol === "turista" && (
          <div style={styles.tabs}>
            <button
              onClick={() => setTabActiva("perfil")}
              style={{ ...styles.tab, ...(tabActiva === "perfil" ? styles.tabActiva : {}) }}
            >👤 Mi perfil</button>
            <button
              onClick={() => { setTabActiva("reservas"); cargarReservas(); }}
              style={{ ...styles.tab, ...(tabActiva === "reservas" ? styles.tabActiva : {}) }}
            >🎫 Mis reservas</button>
          </div>
        )}

        {/* ── TAB PERFIL ── */}
        {tabActiva === "perfil" && (
          <>
            <div style={styles.card}>
              <div style={styles.avatarBox}>
                <div style={styles.avatarCircle}>
                  <img src={userIcon} alt={rolLabel[user.rol]} style={styles.avatarImg} />
                </div>
                <div>
                  <h2 style={styles.userName}>{user.nombre}</h2>
                  <span style={styles.rolBadge}>{rolLabel[user.rol] || user.rol}</span>
                </div>
              </div>
              <div style={styles.divider} />
              <div>
                <h3 style={styles.sectionTitle}>Información de la cuenta</h3>
                <p style={styles.readonlyNote}>
                  🔒 Tus datos son de solo lectura. Contacta al administrador para realizar cambios.
                </p>
                {[
                  { label: "Nombre completo",    value: user.nombre,                     icon: iconTurista },
                  { label: "Correo electrónico", value: user.email,                      icon: iconCorreo  },
                  { label: "Tipo de cuenta",     value: rolLabel[user.rol] || user.rol,  icon: iconTarjeta },
                ].map(item => (
                  <div key={item.label} style={styles.dataRow}>
                    <img src={item.icon} alt="" style={styles.dataIcon} />
                    <div>
                      <p style={styles.dataLabel}>{item.label}</p>
                      <p style={styles.dataValue}>{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.permsCard}>
              <h3 style={styles.permsTitle}>¿Qué puedes hacer?</h3>
              <div style={styles.permsList}>
                {[
                  { icon: "✅", text: "Ver experiencias turísticas disponibles" },
                  { icon: "✅", text: "Reservar actividades" },
                  { icon: "✅", text: "Ver tu historial de reservas" },
                  { icon: "✅", text: "Dejar reseñas y calificaciones" },
                  { icon: "❌", text: "Gestionar otros usuarios (solo admin)" },
                  { icon: "❌", text: "Crear o eliminar experiencias (solo admin)" },
                ].map((p, i) => (
                  <div key={i} style={styles.permItem}>
                    <span>{p.icon}</span>
                    <span style={{ color: p.icon === "✅" ? "#f5c518" : "#555" }}>{p.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── TAB RESERVAS ── */}
        {tabActiva === "reservas" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {reservas.length === 0 ? (
              <div style={styles.empty}>
                <p style={{ fontSize: "2.5rem", margin: 0 }}>🎫</p>
                <p style={{ color: "#aaa", margin: "0.5rem 0 0" }}>No tienes reservas aún</p>
                <a href="/experiencias" style={{ ...styles.btnIr, display: "inline-block", marginTop: 12, textDecoration: "none" }}>
                  Ver experiencias
                </a>
              </div>
            ) : reservas.map(r => {
              const est = estadoConfig[r.estado] || estadoConfig.pendiente;
              return (
                <div key={r.id} style={styles.reservaCard}>
                  <div style={styles.reservaHeader}>
                    <div>
                      <h3 style={styles.reservaTitulo}>{r.experiencia_titulo}</h3>
                      <p style={styles.reservaFecha}>
                        Reservado el {new Date(r.created_at).toLocaleDateString("es-BO")}
                      </p>
                    </div>
                    <span style={{ ...styles.estadoBadge, color: est.color, borderColor: est.color }}>
                      {est.label}
                    </span>
                  </div>

                  <div style={styles.reservaInfo}>
                    <div style={styles.infoItem}>
                      <span style={styles.infoLabel}>📅 Fecha deseada</span>
                      <span style={styles.infoVal}>{new Date(r.fecha + "T00:00:00").toLocaleDateString("es-BO")}</span>
                    </div>
                    <div style={styles.infoItem}>
                      <span style={styles.infoLabel}>👥 Personas</span>
                      <span style={styles.infoVal}>{r.num_personas}</span>
                    </div>
                    <div style={styles.infoItem}>
                      <span style={styles.infoLabel}>💰 Total</span>
                      <span style={{ ...styles.infoVal, color: "#f5c518", fontWeight: 700 }}>
                        Bs. {(r.precio * r.num_personas).toFixed(2)}
                      </span>
                    </div>
                    <div style={styles.infoItem}>
                      <span style={styles.infoLabel}>🏷️ Estado</span>
                      <span style={{ ...styles.infoVal, color: est.color }}>{est.desc}</span>
                    </div>
                  </div>

                  {/* Botón pagar — solo si está aceptada */}
                  {r.estado === "aceptada" && (
                    <a
                      href={`/pago/${r.id}`}
                      style={{ ...styles.btnPagar, display: "block", textDecoration: "none", textAlign: "center" }}
                    >
                      💳 Ir a pagar
                    </a>
                  )}

                  {r.estado === "pago_enviado" && (
                    <div style={styles.pagoEnviadoBox}>
                      📤 Comprobante enviado — esperando confirmación del guía
                    </div>
                  )}

                  {r.estado === "pagado" && (
                    <div style={styles.pagadoBox}>
                      ✅ Pago confirmado — ¡nos vemos pronto!
                    </div>
                  )}

                  {r.motivo_rechazo && (
                    <div style={styles.rechazadoBox}>
                      <strong>Motivo:</strong> {r.motivo_rechazo}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}

const YELLOW = "#f5c518";

const styles = {
  page:        { minHeight: "100vh", background: "#111", fontFamily: "'Segoe UI', system-ui, sans-serif" },
  header:      { background: "#000", borderBottom: "3px solid #f5c518", padding: "1rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between" },
  headerLeft:  { display: "flex", alignItems: "center", gap: 12 },
  headerTitle: { fontSize: "1.1rem", fontWeight: 700, color: YELLOW, margin: 0 },
  headerSub:   { fontSize: "0.78rem", color: "#aaa", margin: 0 },
  logoutBtn:   { background: "transparent", border: "1.5px solid #f5c518", color: YELLOW, borderRadius: 8, padding: "0.45rem 1rem", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 },
  container:   { maxWidth: 600, margin: "0 auto", padding: "2rem 1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" },
  tabs:        { display: "flex", gap: 4, background: "#1a1a1a", borderRadius: 12, padding: 4 },
  tab:         { flex: 1, padding: "0.65rem 1rem", border: "none", borderRadius: 10, fontSize: "0.88rem", fontWeight: 600, cursor: "pointer", background: "transparent", color: "#aaa" },
  tabActiva:   { background: "#2a2a2a", color: YELLOW },
  card:        { background: "#1a1a1a", borderRadius: 18, border: "1px solid #333", padding: "1.75rem" },
  avatarBox:   { display: "flex", alignItems: "center", gap: 16, marginBottom: "1.25rem" },
  avatarCircle:{ width: 64, height: 64, borderRadius: "50%", background: YELLOW, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  avatarImg:   { width: 36, height: 36, objectFit: "contain" },
  userName:    { fontSize: "1.2rem", fontWeight: 700, color: "#fff", margin: "0 0 4px" },
  rolBadge:    { display: "inline-block", background: YELLOW, color: "#111", borderRadius: 20, padding: "0.2rem 0.75rem", fontSize: "0.8rem", fontWeight: 700 },
  divider:     { height: 1, background: "#2a2a2a", margin: "0 0 1.25rem" },
  sectionTitle:{ fontSize: "0.95rem", fontWeight: 700, color: YELLOW, margin: "0 0 0.5rem" },
  readonlyNote:{ background: "#222", border: "1px solid #444", color: "#aaa", borderRadius: 8, padding: "0.6rem 0.85rem", fontSize: "0.82rem", marginBottom: "1rem" },
  dataRow:     { display: "flex", alignItems: "flex-start", gap: 12, padding: "0.75rem 0", borderBottom: "1px solid #222" },
  dataIcon:    { width: 22, height: 22, objectFit: "contain", marginTop: 2, filter: "invert(1)" },
  dataLabel:   { fontSize: "0.76rem", color: "#888", margin: "0 0 2px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" },
  dataValue:   { fontSize: "0.92rem", color: "#fff", margin: 0, fontWeight: 500 },
  permsCard:   { background: "#1a1a1a", borderRadius: 18, border: "1px solid #333", padding: "1.5rem 1.75rem" },
  permsTitle:  { fontSize: "0.95rem", fontWeight: 700, color: YELLOW, margin: "0 0 1rem" },
  permsList:   { display: "flex", flexDirection: "column", gap: "0.6rem" },
  permItem:    { display: "flex", alignItems: "center", gap: 10, fontSize: "0.875rem" },
  empty:       { textAlign: "center", padding: "3rem", background: "#1a1a1a", border: "1px solid #333", borderRadius: 16 },
  btnIr:       { background: YELLOW, color: "#111", border: "none", borderRadius: 10, padding: "0.65rem 1.5rem", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer" },
  reservaCard: { background: "#1a1a1a", border: "1px solid #333", borderRadius: 16, padding: "1.25rem" },
  reservaHeader:{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem", gap: 8 },
  reservaTitulo:{ fontSize: "1rem", fontWeight: 700, color: "#fff", margin: "0 0 4px" },
  reservaFecha: { fontSize: "0.76rem", color: "#666", margin: 0 },
  estadoBadge:  { padding: "0.25rem 0.75rem", borderRadius: 20, fontSize: "0.78rem", fontWeight: 600, border: "1px solid", background: "#111", whiteSpace: "nowrap", flexShrink: 0 },
  reservaInfo:  { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", background: "#222", borderRadius: 10, padding: "0.75rem", marginBottom: "0.85rem" },
  infoItem:     { display: "flex", flexDirection: "column", gap: 3 },
  infoLabel:    { fontSize: "0.72rem", color: "#666", fontWeight: 600 },
  infoVal:      { fontSize: "0.88rem", color: "#e5e5e5", fontWeight: 500 },
  btnPagar:     { background: YELLOW, color: "#111", border: "none", borderRadius: 10, padding: "0.75rem", fontSize: "0.95rem", fontWeight: 800, cursor: "pointer" },
  pagoEnviadoBox:{ background: "#1a0f2a", border: "1px solid #a855f7", color: "#c084fc", borderRadius: 10, padding: "0.65rem 0.9rem", fontSize: "0.84rem" },
  pagadoBox:    { background: "#0f2a1a", border: "1px solid #22c55e", color: "#4ade80", borderRadius: 10, padding: "0.65rem 0.9rem", fontSize: "0.84rem" },
  rechazadoBox: { background: "#1a1a1a", border: "1px solid #ef4444", color: "#ef4444", borderRadius: 10, padding: "0.5rem 0.75rem", fontSize: "0.78rem", marginTop: 8 },
};
