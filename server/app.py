from flask import Flask, request, jsonify
from flask_cors import CORS
import pymysql
import bcrypt
import jwt
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()

app = Flask(__name__)
CORS(app)

SECRET_KEY = os.getenv("JWT_SECRET", "turismo_secreto_2024")

def get_db():
    return pymysql.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "turismo_db"),
        cursorclass=pymysql.cursors.DictCursor
    )

def crear_tabla():
    db = get_db()
    with db.cursor() as cursor:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                email VARCHAR(150) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                rol ENUM('turista','guia_turistico','guia_gastronomico','anfitrion','admin') DEFAULT 'turista',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
    db.commit()
    db.close()

crear_tabla()

def verificar_token(req):
    auth = req.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    token = auth.split(" ")[1]
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except:
        return None

# ── AUTH ──────────────────────────────────────────

@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.json
    nombre = data.get("nombre")
    email = data.get("email")
    password = data.get("password")
    rol = data.get("rol", "turista")

    if not nombre or not email or not password:
        return jsonify({"message": "Todos los campos son requeridos"}), 400

    hash_pw = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    try:
        db = get_db()
        with db.cursor() as cursor:
            cursor.execute(
                "INSERT INTO users (nombre, email, password, rol) VALUES (%s, %s, %s, %s)",
                (nombre, email, hash_pw, rol)
            )
        db.commit()
        db.close()
        return jsonify({"message": "Usuario registrado"}), 201
    except pymysql.err.IntegrityError:
        return jsonify({"message": "El correo ya está registrado"}), 400
    except Exception as e:
        return jsonify({"message": "Error del servidor"}), 500

@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    try:
        db = get_db()
        with db.cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
            user = cursor.fetchone()
        db.close()

        if not user:
            return jsonify({"message": "Credenciales incorrectas"}), 401

        if not bcrypt.checkpw(password.encode(), user["password"].encode()):
            return jsonify({"message": "Credenciales incorrectas"}), 401

        token = jwt.encode(
            {"id": user["id"], "rol": user["rol"],
             "exp": datetime.utcnow() + timedelta(hours=8)},
            SECRET_KEY, algorithm="HS256"
        )

        return jsonify({
            "token": token,
            "user": {
                "id": user["id"],
                "nombre": user["nombre"],
                "email": user["email"],
                "rol": user["rol"]
            }
        })
    except Exception as e:
        return jsonify({"message": "Error del servidor"}), 500

# ── USERS ─────────────────────────────────────────

@app.route("/api/users", methods=["GET"])
def get_users():
    if not verificar_token(request):
        return jsonify({"message": "Token requerido"}), 401
    db = get_db()
    with db.cursor() as cursor:
        cursor.execute("SELECT id, nombre, email, rol, created_at FROM users")
        users = cursor.fetchall()
    db.close()
    for u in users:
        if isinstance(u.get("created_at"), datetime):
            u["created_at"] = u["created_at"].isoformat()
    return jsonify(users)

@app.route("/api/users", methods=["POST"])
def create_user():
    if not verificar_token(request):
        return jsonify({"message": "Token requerido"}), 401
    data = request.json
    hash_pw = bcrypt.hashpw(data["password"].encode(), bcrypt.gensalt()).decode()
    try:
        db = get_db()
        with db.cursor() as cursor:
            cursor.execute(
                "INSERT INTO users (nombre, email, password, rol) VALUES (%s, %s, %s, %s)",
                (data["nombre"], data["email"], hash_pw, data.get("rol", "turista"))
            )
        db.commit()
        db.close()
        return jsonify({"message": "Usuario creado"}), 201
    except pymysql.err.IntegrityError:
        return jsonify({"message": "El correo ya existe"}), 400

@app.route("/api/users/<int:id>", methods=["PUT"])
def update_user(id):
    if not verificar_token(request):
        return jsonify({"message": "Token requerido"}), 401
    data = request.json
    db = get_db()
    with db.cursor() as cursor:
        cursor.execute(
            "UPDATE users SET nombre=%s, email=%s, rol=%s WHERE id=%s",
            (data["nombre"], data["email"], data["rol"], id)
        )
    db.commit()
    db.close()
    return jsonify({"message": "Usuario actualizado"})

@app.route("/api/users/<int:id>", methods=["DELETE"])
def delete_user(id):
    if not verificar_token(request):
        return jsonify({"message": "Token requerido"}), 401
    db = get_db()
    with db.cursor() as cursor:
        cursor.execute("DELETE FROM users WHERE id=%s", (id,))
    db.commit()
    db.close()
    return jsonify({"message": "Usuario eliminado"})

# ── EXPERIENCIAS ──────────────────────────────────

def crear_tabla_experiencias():
    db = get_db()
    with db.cursor() as cursor:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS experiencias (
                id INT AUTO_INCREMENT PRIMARY KEY,
                titulo VARCHAR(200) NOT NULL,
                descripcion TEXT NOT NULL,
                categoria ENUM('tour_turistico','gastronomia') NOT NULL,
                precio DECIMAL(10,2) NOT NULL,
                duracion FLOAT NOT NULL,
                capacidad INT NOT NULL,
                imagen_url VARCHAR(500),
                estado ENUM('pendiente','aprobada','rechazada') DEFAULT 'pendiente',
                motivo_rechazo TEXT,
                guia_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (guia_id) REFERENCES users(id)
            )
        """)
    db.commit()
    db.close()

crear_tabla_experiencias()

@app.route("/api/experiencias", methods=["GET"])
def get_experiencias():
    categoria = request.args.get("categoria")
    db = get_db()
    with db.cursor() as cursor:
        if categoria:
            cursor.execute("""
                SELECT e.*, u.nombre as guia_nombre 
                FROM experiencias e 
                JOIN users u ON e.guia_id = u.id
                WHERE e.estado = 'aprobada' AND e.categoria = %s
            """, (categoria,))
        else:
            cursor.execute("""
                SELECT e.*, u.nombre as guia_nombre 
                FROM experiencias e 
                JOIN users u ON e.guia_id = u.id
                WHERE e.estado = 'aprobada'
            """)
        experiencias = cursor.fetchall()
    db.close()
    for e in experiencias:
        if isinstance(e.get("created_at"), datetime):
            e["created_at"] = e["created_at"].isoformat()
    return jsonify(experiencias)

# ── NUEVO: GET experiencia individual por ID ──────
@app.route("/api/experiencias/<int:id>", methods=["GET"])
def get_experiencia(id):
    db = get_db()
    with db.cursor() as cursor:
        cursor.execute("""
            SELECT e.*, u.nombre as guia_nombre
            FROM experiencias e
            JOIN users u ON e.guia_id = u.id
            WHERE e.id = %s AND e.estado = 'aprobada'
        """, (id,))
        exp = cursor.fetchone()
    db.close()
    if not exp:
        return jsonify({"message": "Experiencia no encontrada"}), 404
    if isinstance(exp.get("created_at"), datetime):
        exp["created_at"] = exp["created_at"].isoformat()
    return jsonify(exp)

@app.route("/api/experiencias/mis-experiencias", methods=["GET"])
def get_mis_experiencias():
    payload = verificar_token(request)
    if not payload:
        return jsonify({"message": "Token requerido"}), 401
    db = get_db()
    with db.cursor() as cursor:
        cursor.execute("""
            SELECT * FROM experiencias WHERE guia_id = %s
            ORDER BY created_at DESC
        """, (payload["id"],))
        experiencias = cursor.fetchall()
    db.close()
    for e in experiencias:
        if isinstance(e.get("created_at"), datetime):
            e["created_at"] = e["created_at"].isoformat()
    return jsonify(experiencias)

@app.route("/api/experiencias/todas", methods=["GET"])
def get_todas_experiencias():
    payload = verificar_token(request)
    if not payload or payload["rol"] != "admin":
        return jsonify({"message": "Sin permisos"}), 403
    db = get_db()
    with db.cursor() as cursor:
        cursor.execute("""
            SELECT e.*, u.nombre as guia_nombre 
            FROM experiencias e 
            JOIN users u ON e.guia_id = u.id
            ORDER BY e.created_at DESC
        """)
        experiencias = cursor.fetchall()
    db.close()
    for e in experiencias:
        if isinstance(e.get("created_at"), datetime):
            e["created_at"] = e["created_at"].isoformat()
    return jsonify(experiencias)

@app.route("/api/experiencias", methods=["POST"])
def create_experiencia():
    payload = verificar_token(request)
    if not payload:
        return jsonify({"message": "Token requerido"}), 401
    rol = payload["rol"]
    if rol not in ["guia_turistico", "guia_gastronomico", "admin"]:
        return jsonify({"message": "Sin permisos para crear experiencias"}), 403
    data = request.json
    try:
        db = get_db()
        with db.cursor() as cursor:
            cursor.execute("""
              INSERT INTO experiencias 
                (titulo, descripcion, categoria, precio, duracion, capacidad, imagen_url, guia_id, horarios, servicios, latitud, longitud)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                data["titulo"], data["descripcion"], data["categoria"],
                data["precio"], data.get("duracion", 0), data["capacidad"],
                data.get("imagen_url", ""), payload["id"], 
                data.get("horarios", ""), data.get("servicios", ""), 
                data.get("latitud"), data.get("longitud")
            ))
        db.commit()
        db.close()
        return jsonify({"message": "Experiencia creada, pendiente de aprobación"}), 201
    except Exception as e:
        return jsonify({"message": str(e)}), 500

@app.route("/api/experiencias/<int:id>", methods=["PUT"])
def update_experiencia(id):
    payload = verificar_token(request)
    if not payload:
        return jsonify({"message": "Token requerido"}), 401
    db = get_db()
    with db.cursor() as cursor:
        cursor.execute("SELECT * FROM experiencias WHERE id = %s", (id,))
        exp = cursor.fetchone()
    if not exp:
        return jsonify({"message": "Experiencia no encontrada"}), 404
    if exp["guia_id"] != payload["id"] and payload["rol"] != "admin":
        return jsonify({"message": "Sin permisos"}), 403
    data = request.json
    with db.cursor() as cursor:
        cursor.execute("""
            UPDATE experiencias 
            SET titulo=%s, descripcion=%s, categoria=%s, precio=%s, 
                duracion=%s, capacidad=%s, imagen_url=%s, estado='pendiente',
                horarios=%s, servicios=%s, latitud=%s, longitud=%s
            WHERE id=%s
        """, (
            data["titulo"], data["descripcion"], data["categoria"],
            data["precio"], data.get("duracion", 0), data["capacidad"],
            data.get("imagen_url", ""), data.get("horarios", ""), 
            data.get("servicios", ""), data.get("latitud"),
            data.get("longitud"), id
        ))
    db.commit()
    db.close()
    return jsonify({"message": "Experiencia actualizada, pendiente de aprobación"}), 200

@app.route("/api/experiencias/<int:id>/validar", methods=["PUT"])
def validar_experiencia(id):
    payload = verificar_token(request)
    if not payload or payload["rol"] != "admin":
        return jsonify({"message": "Sin permisos"}), 403
    data = request.json
    estado = data.get("estado")
    motivo = data.get("motivo_rechazo", "")
    if estado not in ["aprobada", "rechazada"]:
        return jsonify({"message": "Estado inválido"}), 400
    db = get_db()
    with db.cursor() as cursor:
        cursor.execute("""
            UPDATE experiencias SET estado=%s, motivo_rechazo=%s WHERE id=%s
        """, (estado, motivo, id))
    db.commit()
    db.close()
    return jsonify({"message": f"Experiencia {estado}"})

@app.route("/api/experiencias/<int:id>", methods=["DELETE"])
def delete_experiencia(id):
    payload = verificar_token(request)
    if not payload or payload["rol"] != "admin":
        return jsonify({"message": "Sin permisos"}), 403
    db = get_db()
    with db.cursor() as cursor:
        cursor.execute("DELETE FROM experiencias WHERE id=%s", (id,))
    db.commit()
    db.close()
    return jsonify({"message": "Experiencia eliminada"})

# ── RESERVAS ──────────────────────────────────────

def crear_tabla_reservas():
    db = get_db()
    with db.cursor() as cursor:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS reservas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                experiencia_id INT NOT NULL,
                turista_id INT NOT NULL,
                fecha DATE NOT NULL,
                num_personas INT NOT NULL,
                comentario TEXT,
                estado ENUM('pendiente','aceptada','rechazada') DEFAULT 'pendiente',
                motivo_rechazo TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (experiencia_id) REFERENCES experiencias(id),
                FOREIGN KEY (turista_id) REFERENCES users(id)
            )
        """)
    db.commit()
    db.close()

crear_tabla_reservas()

@app.route("/api/reservas", methods=["POST"])
def crear_reserva():
    payload = verificar_token(request)
    if not payload:
        return jsonify({"message": "Token requerido"}), 401
    if payload["rol"] != "turista":
        return jsonify({"message": "Solo los turistas pueden reservar"}), 403
    data = request.json
    experiencia_id = data.get("experiencia_id")
    fecha = data.get("fecha")
    num_personas = data.get("num_personas")
    comentario = data.get("comentario", "")
    if not experiencia_id or not fecha or not num_personas:
        return jsonify({"message": "Faltan campos requeridos"}), 400
    try:
        db = get_db()
        with db.cursor() as cursor:
            cursor.execute("""
                INSERT INTO reservas (experiencia_id, turista_id, fecha, num_personas, comentario)
                VALUES (%s, %s, %s, %s, %s)
            """, (experiencia_id, payload["id"], fecha, num_personas, comentario))
        db.commit()
        db.close()
        return jsonify({"message": "Solicitud de reserva enviada"}), 201
    except Exception as e:
        return jsonify({"message": str(e)}), 500

@app.route("/api/reservas/mis-solicitudes", methods=["GET"])
def get_mis_solicitudes():
    payload = verificar_token(request)
    if not payload:
        return jsonify({"message": "Token requerido"}), 401
    db = get_db()
    with db.cursor() as cursor:
        cursor.execute("""
            SELECT r.*, e.titulo as experiencia_titulo, e.precio,
                   u.nombre as turista_nombre, u.email as turista_email
            FROM reservas r
            JOIN experiencias e ON r.experiencia_id = e.id
            JOIN users u ON r.turista_id = u.id
            WHERE e.guia_id = %s
            ORDER BY r.created_at DESC
        """, (payload["id"],))
        solicitudes = cursor.fetchall()
    db.close()
    for s in solicitudes:
        if isinstance(s.get("created_at"), datetime):
            s["created_at"] = s["created_at"].isoformat()
        if isinstance(s.get("fecha"), datetime):
            s["fecha"] = s["fecha"].isoformat()
    return jsonify(solicitudes)

@app.route("/api/reservas/<int:id>/responder", methods=["PUT"])
def responder_reserva(id):
    payload = verificar_token(request)
    if not payload:
        return jsonify({"message": "Token requerido"}), 401
    data = request.json
    estado = data.get("estado")
    motivo = data.get("motivo_rechazo", "")
    if estado not in ["aceptada", "rechazada"]:
        return jsonify({"message": "Estado inválido"}), 400
    db = get_db()
    with db.cursor() as cursor:
        cursor.execute("""
            SELECT r.* FROM reservas r
            JOIN experiencias e ON r.experiencia_id = e.id
            WHERE r.id = %s AND e.guia_id = %s
        """, (id, payload["id"]))
        reserva = cursor.fetchone()
    if not reserva:
        return jsonify({"message": "Reserva no encontrada o sin permisos"}), 404
    with db.cursor() as cursor:
        cursor.execute("""
            UPDATE reservas SET estado=%s, motivo_rechazo=%s WHERE id=%s
        """, (estado, motivo, id))
    db.commit()
    db.close()
    return jsonify({"message": f"Reserva {estado}"})

@app.route("/api/reservas/mis-reservas", methods=["GET"])
def get_mis_reservas():
    payload = verificar_token(request)
    if not payload:
        return jsonify({"message": "Token requerido"}), 401
    db = get_db()
    with db.cursor() as cursor:
        cursor.execute("""
            SELECT r.*, e.titulo as experiencia_titulo, e.precio,
                   u.nombre as guia_nombre
            FROM reservas r
            JOIN experiencias e ON r.experiencia_id = e.id
            JOIN users u ON e.guia_id = u.id
            WHERE r.turista_id = %s
            ORDER BY r.created_at DESC
        """, (payload["id"],))
        reservas = cursor.fetchall()
    db.close()
    for r in reservas:
        if isinstance(r.get("created_at"), datetime):
            r["created_at"] = r["created_at"].isoformat()
        if isinstance(r.get("fecha"), datetime):
            r["fecha"] = r["fecha"].isoformat()
    return jsonify(reservas)

# ── RESEÑAS ──────────────────────────────────────

@app.route("/api/resenas/<int:producto_id>", methods=["GET"])
def get_resenas(producto_id):
    db = get_db()
    with db.cursor() as cursor:
        cursor.execute("""
            SELECT r.*, u.nombre as turista_nombre
            FROM resenas r
            JOIN users u ON r.turista_id = u.id
            WHERE r.producto_id = %s
            ORDER BY r.created_at DESC
        """, (producto_id,))
        resenas = cursor.fetchall()
    db.close()
    for r in resenas:
        if isinstance(r.get("created_at"), datetime):
            r["created_at"] = r["created_at"].isoformat()
    return jsonify(resenas)

@app.route("/api/resenas", methods=["POST"])
def crear_resena():
    payload = verificar_token(request)
    if not payload:
        return jsonify({"message": "Token requerido"}), 401
    if payload["rol"] != "turista":
        return jsonify({"message": "Solo los turistas pueden dejar reseñas"}), 403
    data = request.json
    producto_id = data.get("producto_id")
    estrellas = data.get("estrellas")
    comentario = data.get("comentario")
    if not producto_id or not estrellas or not comentario:
        return jsonify({"message": "Todos los campos son requeridos"}), 400
    if not (1 <= int(estrellas) <= 5):
        return jsonify({"message": "Las estrellas deben ser entre 1 y 5"}), 400
    try:
        db = get_db()
        with db.cursor() as cursor:
            cursor.execute(
                "SELECT id FROM resenas WHERE producto_id=%s AND turista_id=%s",
                (producto_id, payload["id"])
            )
            if cursor.fetchone():
                return jsonify({"message": "Ya dejaste una reseña para este producto"}), 400
            cursor.execute("""
                INSERT INTO resenas (producto_id, turista_id, estrellas, comentario)
                VALUES (%s, %s, %s, %s)
            """, (producto_id, payload["id"], estrellas, comentario))
        db.commit()
        db.close()
        return jsonify({"message": "Reseña publicada"}), 201
    except Exception as e:
        return jsonify({"message": str(e)}), 500

# ── MENU ITEMS ────────────────────────────────────

@app.route("/api/menu/<int:producto_id>", methods=["GET"])
def get_menu(producto_id):
    db = get_db()
    with db.cursor() as cursor:
        cursor.execute("SELECT * FROM menu_items WHERE producto_id = %s", (producto_id,))
        items = cursor.fetchall()
    db.close()
    return jsonify(items)

@app.route("/api/menu", methods=["POST"])
def add_menu_item():
    payload = verificar_token(request)
    if not payload:
        return jsonify({"message": "Token requerido"}), 401
    data = request.json
    db = get_db()
    with db.cursor() as cursor:
        cursor.execute("""
            INSERT INTO menu_items (producto_id, nombre, categoria, precio, descripcion)
            VALUES (%s, %s, %s, %s, %s)
        """, (data["producto_id"], data["nombre"], data["categoria"], data["precio"], data.get("descripcion", "")))
    db.commit()
    db.close()
    return jsonify({"message": "Ítem agregado"}), 201

@app.route("/api/menu/<int:id>", methods=["DELETE"])
def delete_menu_item(id):
    payload = verificar_token(request)
    if not payload:
        return jsonify({"message": "Token requerido"}), 401
    db = get_db()
    with db.cursor() as cursor:
        cursor.execute("DELETE FROM menu_items WHERE id = %s", (id,))
    db.commit()
    db.close()
    return jsonify({"message": "Ítem eliminado"})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    app.run(host="0.0.0.0", port=port)
