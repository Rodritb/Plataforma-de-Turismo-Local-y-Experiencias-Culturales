import { useState, useEffect } from "react";

import iconAdmin from "../assets/iconos/administrator.jpg";
import iconGuiaTuristico from "../assets/iconos/guia_turistico.jpg";
import iconGuiaGastronomico from "../assets/iconos/guia_gastronomico.png";
import iconTurista from "../assets/iconos/turista.jpg";
import iconCorreo from "../assets/iconos/correo.jpg";
import iconTarjeta from "../assets/iconos/tarjeta.png";

export default function MiPerfil() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { window.location.href = "/login"; return; }
    setUser(JSON.parse(stored));
  }, []);

  function cerrarSesion() {
    localStorage.clear();
    window.location.href = "/login";
  }

  if (!user) return null;

  const rolLabel = {
    viajero: "🧳 Viajero",
    turista: "Turista",
    guia: "Guía local",
    guia_gastronomico: "Guía gastronómico",
    admin: "Administrador",
  };

  const rolIcon = {
    admin: iconAdmin,
    guia: iconGuiaTuristico,
    guia_gastronomico: iconGuiaGastronomico,
    viajero: iconTurista,
    turista: iconTurista,
  };

  const userIcon = rolIcon[user.rol] || iconTurista;

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
        <button onClick={cerrarSesion} style={styles.logoutBtn}>
          🚪 Cerrar sesión
        </button>
      </div>

      <div style={styles.container}>
        {/* Tarjeta de perfil */}
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

          {/* Datos de solo lectura */}
          <div>
            <h3 style={styles.sectionTitle}>Información de la cuenta</h3>
            <p style={styles.readonlyNote}>
              🔒 Tus datos son de solo lectura. Contacta al administrador para realizar cambios.
            </p>

            {[
              { label: "Nombre completo", value: user.nombre, icon: iconTurista },
              { label: "Correo electrónico", value: user.email, icon: iconCorreo },
              { label: "Tipo de cuenta", value: rolLabel[user.rol] || user.rol, icon: iconTarjeta },
            ].map((item) => (
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

        {/* Info de permisos */}
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
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#111",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },

  /* Header negro con acento amarillo */
  header: {
    background: "#000",
    borderBottom: "3px solid #f5c518",
    padding: "1rem 2rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  headerTitle: { fontSize: "1.1rem", fontWeight: 700, color: "#f5c518", margin: 0 },
  headerSub: { fontSize: "0.78rem", color: "#aaa", margin: 0 },
  logoutBtn: {
    background: "transparent",
    border: "1.5px solid #f5c518",
    color: "#f5c518",
    borderRadius: 8,
    padding: "0.45rem 1rem",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: 600,
    transition: "background 0.2s",
  },

  container: {
    maxWidth: 560,
    margin: "0 auto",
    padding: "2rem 1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
  },

  /* Tarjeta principal */
  card: {
    background: "#1a1a1a",
    borderRadius: 18,
    border: "1px solid #333",
    padding: "1.75rem",
  },
  avatarBox: { display: "flex", alignItems: "center", gap: 16, marginBottom: "1.25rem" },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    background: "#f5c518",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarImg: {
    width: 36,
    height: 36,
    objectFit: "contain",
    filter: "invert(0%)",  /* iconos ya son negros sobre fondo amarillo */
  },
  userName: { fontSize: "1.2rem", fontWeight: 700, color: "#fff", margin: "0 0 4px" },
  rolBadge: {
    display: "inline-block",
    background: "#f5c518",
    color: "#111",
    borderRadius: 20,
    padding: "0.2rem 0.75rem",
    fontSize: "0.8rem",
    fontWeight: 700,
  },
  divider: { height: 1, background: "#2a2a2a", margin: "0 0 1.25rem" },

  sectionTitle: { fontSize: "0.95rem", fontWeight: 700, color: "#f5c518", margin: "0 0 0.5rem" },
  readonlyNote: {
    background: "#222",
    border: "1px solid #444",
    color: "#aaa",
    borderRadius: 8,
    padding: "0.6rem 0.85rem",
    fontSize: "0.82rem",
    marginBottom: "1rem",
  },
  dataRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    padding: "0.75rem 0",
    borderBottom: "1px solid #222",
  },
  dataIcon: { width: 22, height: 22, objectFit: "contain", marginTop: 2, filter: "invert(1)" },
  dataLabel: {
    fontSize: "0.76rem",
    color: "#888",
    margin: "0 0 2px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  dataValue: { fontSize: "0.92rem", color: "#fff", margin: 0, fontWeight: 500 },

  /* Tarjeta de permisos */
  permsCard: {
    background: "#1a1a1a",
    borderRadius: 18,
    border: "1px solid #333",
    padding: "1.5rem 1.75rem",
  },
  permsTitle: { fontSize: "0.95rem", fontWeight: 700, color: "#f5c518", margin: "0 0 1rem" },
  permsList: { display: "flex", flexDirection: "column", gap: "0.6rem" },
  permItem: { display: "flex", alignItems: "center", gap: 10, fontSize: "0.875rem" },
};
