import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

export type AppDatabase = DatabaseSync;

const SCHEMA = `
-- Tabla de roles
CREATE TABLE IF NOT EXISTS roles (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre      TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Tabla unificada de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre          TEXT NOT NULL,
  apellido_paterno TEXT NOT NULL,
  apellido_materno TEXT,
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  rol_id          INTEGER NOT NULL,
  matricula       TEXT UNIQUE,
  activo          INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE RESTRICT
);

-- Tabla de tokens revocados
CREATE TABLE IF NOT EXISTS revoked_tokens (
  jti        TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL
);

-- Tabla de refresh tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL,
  token      TEXT NOT NULL UNIQUE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_matricula ON usuarios(matricula);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_usuario ON refresh_tokens(usuario_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at);
`;

/**
 * Crea (o abre) una base SQLite, aplica el esquema y la devuelve.
 * Usa ":memory:" para una base en memoria (útil en pruebas).
 */
export function createDatabase(location: string): AppDatabase {
  if (location !== ":memory:") {
    const dir = path.dirname(location);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }
  const db = new DatabaseSync(location);
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(SCHEMA);

  // Insertar roles por defecto si no existen
  const rolesExist = db.prepare("SELECT COUNT(*) as count FROM roles").get() as { count: number };
  if (rolesExist.count === 0) {
    const insertRol = db.prepare("INSERT INTO roles (nombre, descripcion) VALUES (?, ?)");
    insertRol.run("estudiante", "Rol de estudiante - puede ver y editar su información");
    insertRol.run("maestro", "Rol de maestro - puede gestionar estudiantes y ver reportes");
    
    console.log("✅ Roles insertados: estudiante, maestro");
  }

  // Migración: verificar si la tabla users existe y migrar datos
  try {
    const oldUsersTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
    if (oldUsersTable) {
      console.log("⚠️  Detectada tabla 'users' antigua. Iniciando migración...");
      
      // Crear tabla temporal para usuarios antiguos
      db.exec(`
        INSERT OR IGNORE INTO usuarios (nombre, apellido_paterno, email, password_hash, rol_id)
        SELECT 
          'Usuario' as nombre,
          'Migrado' as apellido_paterno,
          email,
          password_hash,
          (SELECT id FROM roles WHERE nombre = 'maestro') as rol_id
        FROM users
        WHERE email NOT IN (SELECT email FROM usuarios)
      `);
      
      console.log("✅ Migración completada: usuarios antiguos migrados como 'maestro'");
    }
  } catch (error) {
    // La tabla users no existe, no es necesario migrar
  }

  // Migración: verificar si la tabla students existe y migrar datos
  try {
    const oldStudentsTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='students'").get();
    if (oldStudentsTable) {
      console.log("⚠️  Detectada tabla 'students' antigua. Iniciando migración...");
      
      // Migrar estudiantes antiguos
      db.exec(`
        INSERT OR IGNORE INTO usuarios (nombre, apellido_paterno, email, password_hash, rol_id, matricula)
        SELECT 
          nombre,
          apellido as apellido_paterno,
          email,
          COALESCE(password_hash, '') as password_hash,
          (SELECT id FROM roles WHERE nombre = 'estudiante') as rol_id,
          matricula
        FROM students
        WHERE email NOT IN (SELECT email FROM usuarios)
      `);
      
      console.log("✅ Migración completada: estudiantes antiguos migrados");
    }
  } catch (error) {
    // La tabla students no existe, no es necesario migrar
  }

  // Crear usuario admin por defecto si no hay usuarios
  const usuariosExist = db.prepare("SELECT COUNT(*) as count FROM usuarios").get() as { count: number };
  if (usuariosExist.count === 0) {
    console.log("📝 Creando usuarios de prueba...");
    
    // Insertar usuario maestro de prueba
    const insertUsuario = db.prepare(`
      INSERT INTO usuarios (nombre, apellido_paterno, apellido_materno, email, password_hash, rol_id, matricula)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    // Password hash para "secret123" (generado con bcrypt)
    const bcrypt = require('bcryptjs');
    const passwordHash = bcrypt.hashSync('secret123', 10);
    
    // Maestro de prueba
    insertUsuario.run('Ana', 'García', 'López', 'ana@test.com', passwordHash, 2, null);
    
    // Estudiante de prueba
    insertUsuario.run('Juan', 'Pérez', 'Martínez', 'juan@test.com', passwordHash, 1, 'EST001');
    insertUsuario.run('María', 'López', 'González', 'maria@test.com', passwordHash, 1, 'EST002');
    
    console.log("✅ Usuarios de prueba creados:");
    console.log("   - ana@test.com (maestro) - Password: secret123");
    console.log("   - juan@test.com (estudiante) - Password: secret123");
    console.log("   - maria@test.com (estudiante) - Password: secret123");
  }

  return db;
}
