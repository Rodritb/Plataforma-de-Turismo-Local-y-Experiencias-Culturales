import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import qrImage from "../assets/iconos/qr-pago.jpeg";

const API_RESERVAS = "http://localhost:3000/api/reservas";

export default function PagoReserva() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [reserva, setReserva]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [comprobante, setComprobante] = useState(null);
  const [preview, setPreview]         = useState(null);
  const [enviando, setEnviando]       = useState(false);
  const [mensaje, setMensaje]         = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch(`${API_RESERVAS}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => { setReserva(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  function seleccionarArchivo(e) {
    const file = e.target.files[0];
    if (!file) return;
    setComprobante(file);
    setPreview(URL.createObjectURL(file));
  }

  async function enviarComprobante() {
    if (!comprobante) { setMensaje("WARN:Selecciona una imagen del comprobante"); return; }
    setEnviando(true); setMensaje("");
    try {
      const fd = new FormData();
      fd.append("comprobante", comprobante);
      const res  = await fetch(`${API_RESERVAS}/${id}/comprobante`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (res.ok) {
        setMensaje("OK:Comprobante enviado. El guia confirmara tu pago pronto.");
        setTimeout(() => navigate("/mi-perfil"), 3000);
      } else {
        setMensaje("ERR:" + data.message);
      }
    } catch { setMensaje("ERR:Error de conexion"); }
    finally { setEnviando(false); }
  }

  if (loading) return (
    <div style={s.centrado}>
      <div style={s.spinner} />
      <p style={{ color: "#f5c518", marginTop: 12 }}>Cargando reserva...</p>
    </div>
  );

  if (!reserva || reserva.message) return (
    <div style={s.centrado}>
      <p style={{ color: "#f5c518" }}>Reserva no encontrada.</p>
      <button onClick={() => navigate("/mi-perfil")} style={s.btnVolver}>Volver</button>
    </div>
  );

  const total = (reserva.precio * reserva.num_personas).toFixed(2);

  const msgColor = mensaje.startsWith("OK:")
    ? { bg: "#0f2a1a", border: "#22c55e", color: "#4ade80" }
    : mensaje.startsWith("WARN:")
    ? { bg: "#1a1500", border: "#f5c518", color: "#f5c518" }
    : { bg: "#2a0f0f", border: "#ef4444", color: "#f87171" };

  return (
    <div style={s.page}>

      <div style={s.header}>
        <div style={s.headerLeft}>
          <span style={{ fontSize: 22, color: "#f5c518" }}>💳</span>
          <div>
            <h1 style={s.headerTitle}>Pago de reserva</h1>
            <p style={s.headerSub}>{reserva.experiencia_titulo}</p>
          </div>
        </div>
        <button onClick={() => navigate("/mi-perfil")} style={s.btnVolverHead}>Volver</button>
      </div>

      <div style={s.container}>

        <div style={s.card}>
          <h2 style={s.cardTitle}>Resumen de tu reserva</h2>
          <div style={s.resumenGrid}>
            <div style={s.resumenItem}>
              <span style={s.resumenLabel}>Local / Tour</span>
              <span style={s.resumenVal}>{reserva.experiencia_titulo}</span>
            </div>
            <div style={s.resumenItem}>
              <span style={s.resumenLabel}>Fecha</span>
              <span style={s.resumenVal}>
                {new Date(reserva.fecha + "T00:00:00").toLocaleDateString("es-BO")}
              </span>
            </div>
            <div style={s.resumenItem}>
              <span style={s.resumenLabel}>Personas</span>
              <span style={s.resumenVal}>{reserva.num_personas}</span>
            </div>
            <div style={s.resumenItem}>
              <span style={s.resumenLabel}>Total a pagar</span>
              <span style={{ ...s.resumenVal, color: "#f5c518", fontSize: "1.3rem", fontWeight: 800 }}>
                Bs. {total}
              </span>
            </div>
          </div>
        </div>

        <div style={s.card}>
          <h2 style={s.cardTitle}>Escanea el QR para pagar</h2>
          <p style={s.instruccion}>
            Abre tu app bancaria (Banco Union, BCP, Tigo Money, etc.) y escanea el codigo QR para realizar la transferencia.
          </p>

          <div style={s.qrBox}>
            <div style={s.qrPlaceholder}>
              <img
                src={qrImage}
                alt="QR de pago"
                style={{ width: 200, height: 200, objectFit: "contain", borderRadius: 8 }}
              />
            </div>
            <div style={s.qrInfo}>
              <p style={s.qrNombre}>SucreGO -- Turismo Local</p>
              <p style={s.qrBanco}>Banco Union S.A.</p>
              <p style={s.qrCuenta}>Cuenta: 1-0000000-00</p>
              <p style={s.qrMonto}>
                Monto exacto:{" "}
                <strong style={{ color: "#f5c518" }}>Bs. {total}</strong>
              </p>
            </div>
          </div>

          <div style={s.pasos}>
            {[
              "Abre tu app bancaria",
              "Escanea el QR o transfiere al numero de cuenta",
              "Usa el monto exacto indicado",
              "Toma captura del comprobante",
              "Subela abajo para confirmar",
            ].map((paso, i) => (
              <div key={i} style={s.paso}>
                <span style={s.pasoBadge}>{i + 1}</span>
                <span style={{ color: "#ccc", fontSize: "0.88rem" }}>{paso}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={s.card}>
          <h2 style={s.cardTitle}>Sube tu comprobante de pago</h2>
          <p style={s.instruccion}>
            Una vez realizada la transferencia, sube la captura o foto del comprobante. El guia la revisara y confirmara tu pago.
          </p>

          <label style={s.uploadLabel}>
            <input
              type="file"
              accept="image/*"
              onChange={seleccionarArchivo}
              style={{ display: "none" }}
            />
            <div style={s.uploadBox}>
              {preview ? (
                <img src={preview} alt="comprobante" style={s.previewImg} />
              ) : (
                <div>
                  <div style={{ fontSize: "2.5rem" }}>📎</div>
                  <p style={{ color: "#aaa", margin: "0.5rem 0 0", fontSize: "0.88rem" }}>
                    Click para seleccionar imagen
                  </p>
                  <p style={{ color: "#666", margin: "0.25rem 0 0", fontSize: "0.78rem" }}>
                    JPG, PNG o WEBP
                  </p>
                </div>
              )}
            </div>
          </label>

          {comprobante && (
            <p style={{ color: "#22c55e", fontSize: "0.82rem", marginTop: 8 }}>
              {comprobante.name} seleccionado
            </p>
          )}

          {mensaje !== "" && (
            <div style={{
              padding: "0.7rem 1rem",
              borderRadius: 10,
              border: "1px solid " + msgColor.border,
              background: msgColor.bg,
              color: msgColor.color,
              fontSize: "0.85rem",
              fontWeight: 500,
              marginTop: "0.75rem",
            }}>
              {mensaje.replace("OK:", "").replace("ERR:", "").replace("WARN:", "")}
            </div>
          )}

          <button
            onClick={enviarComprobante}
            disabled={enviando || !comprobante}
            style={{
              width: "100%",
              padding: "0.9rem",
              background: "#f5c518",
              color: "#111",
              border: "none",
              borderRadius: 12,
              fontSize: "0.97rem",
              fontWeight: 800,
              cursor: "pointer",
              marginTop: "1rem",
              opacity: (enviando || !comprobante) ? 0.6 : 1,
            }}
          >
            {enviando ? "Enviando..." : "Enviar comprobante"}
          </button>
        </div>

      </div>
    </div>
  );
}

const YELLOW = "#f5c518";
const DARK   = "#111";
const CARD   = "#1a1a1a";
const BORDER = "#2a2a2a";

const s = {
  page:        { minHeight: "100vh", background: DARK, fontFamily: "'Segoe UI',system-ui,sans-serif", color: "#fff" },
  centrado:    { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", gap: 16 },
  spinner:     { width: 36, height: 36, border: "3px solid #333", borderTop: "3px solid #f5c518", borderRadius: "50%" },
  header:      { background: "#000", borderBottom: "3px solid #f5c518", padding: "1rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between" },
  headerLeft:  { display: "flex", alignItems: "center", gap: 12 },
  headerTitle: { fontSize: "1rem", fontWeight: 700, color: YELLOW, margin: 0 },
  headerSub:   { fontSize: "0.75rem", color: "#aaa", margin: 0 },
  btnVolverHead: { background: "transparent", border: "1px solid #f5c518", color: YELLOW, borderRadius: 8, padding: "0.4rem 0.85rem", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" },
  btnVolver:   { marginTop: 12, padding: "0.6rem 1.4rem", background: YELLOW, color: "#111", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700 },
  container:   { maxWidth: 640, margin: "0 auto", padding: "2rem 1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" },
  card:        { background: CARD, borderRadius: 18, border: "1px solid #2a2a2a", padding: "1.5rem" },
  cardTitle:   { fontSize: "1rem", fontWeight: 700, color: YELLOW, margin: "0 0 1rem" },
  instruccion: { color: "#aaa", fontSize: "0.88rem", margin: "0 0 1.25rem", lineHeight: 1.6 },
  resumenGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" },
  resumenItem: { background: "#222", borderRadius: 10, padding: "0.75rem 1rem", border: "1px solid #2a2a2a", display: "flex", flexDirection: "column", gap: 4 },
  resumenLabel:{ fontSize: "0.72rem", color: "#777", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" },
  resumenVal:  { fontSize: "0.95rem", color: "#fff", fontWeight: 600 },
  qrBox:       { display: "flex", alignItems: "center", gap: "1.5rem", background: "#222", borderRadius: 14, padding: "1.25rem", border: "1px solid #2a2a2a", marginBottom: "1.25rem", flexWrap: "wrap" },
  qrPlaceholder: { background: "#111", borderRadius: 12, padding: 12, border: "2px solid #f5c518", flexShrink: 0 },
  qrInfo:      { display: "flex", flexDirection: "column", gap: 6 },
  qrNombre:    { margin: 0, fontWeight: 700, color: "#fff", fontSize: "0.95rem" },
  qrBanco:     { margin: 0, color: "#aaa", fontSize: "0.82rem" },
  qrCuenta:    { margin: 0, color: "#aaa", fontSize: "0.82rem" },
  qrMonto:     { margin: 0, color: "#ccc", fontSize: "0.88rem" },
  pasos:       { display: "flex", flexDirection: "column", gap: 10 },
  paso:        { display: "flex", alignItems: "center", gap: 12 },
  pasoBadge:   { width: 26, height: 26, borderRadius: "50%", background: YELLOW, color: "#111", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 800, flexShrink: 0 },
  uploadLabel: { cursor: "pointer", display: "block" },
  uploadBox:   { border: "2px dashed #2a2a2a", borderRadius: 14, padding: "2rem", textAlign: "center", background: "#222" },
  previewImg:  { maxWidth: "100%", maxHeight: 280, borderRadius: 10, objectFit: "contain" },
};
