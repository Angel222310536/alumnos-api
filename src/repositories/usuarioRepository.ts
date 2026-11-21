import type { AppDatabase } from "../db/database";

export interface Usuario {
  id: number;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  email: string;
  password_hash: string;
  rol_id: number;
  matricula: string | null;
  activo: number;
  created_at: string;
  updated_at: string;
}

export interface UsuarioConRol extends Usuario {
  rol_nombre: string;
  rol_descripcion: string | null;
}

export interface CreateUsuarioData {
  nombre: string;
  apellido_paterno: string;
  apellido_materno?: string;
  email: string;
  password_hash: string;
  rol_id: number;
  matricula?: string;
}

export interface UpdateUsuarioData {
  nombre?: string;
  apellido_paterno?: string;
  apellido_materno?: string;
  email?: string;
  password_hash?: string;
  rol_id?: number;
  matricula?: string;
  activo?: number;
}

export class UsuarioRepository {
  constructor(private readonly db: AppDatabase) {}

  /**
   * Obtiene todos los usuarios con información de rol
   */
  findAll(): UsuarioConRol[] {
    const stmt = this.db.prepare(`
      SELECT u.*, r.nombre as rol_nombre, r.descripcion as rol_descripcion
      FROM usuarios u
      INNER JOIN roles r ON u.rol_id = r.id
      ORDER BY u.apellido_paterno, u.nombre
    `);
    return stmt.all() as UsuarioConRol[];
  }

  /**
   * Busca un usuario por ID con información de rol
   */
  findById(id: number): UsuarioConRol | undefined {
    const stmt = this.db.prepare(`
      SELECT u.*, r.nombre as rol_nombre, r.descripcion as rol_descripcion
      FROM usuarios u
      INNER JOIN roles r ON u.rol_id = r.id
      WHERE u.id = ?
    `);
    return stmt.get(id) as UsuarioConRol | undefined;
  }

  /**
   * Busca un usuario por email con información de rol
   */
  findByEmail(email: string): UsuarioConRol | undefined {
    const stmt = this.db.prepare(`
      SELECT u.*, r.nombre as rol_nombre, r.descripcion as rol_descripcion
      FROM usuarios u
      INNER JOIN roles r ON u.rol_id = r.id
      WHERE u.email = ?
    `);
    return stmt.get(email) as UsuarioConRol | undefined;
  }

  /**
   * Busca un usuario por matrícula
   */
  findByMatricula(matricula: string): Usuario | undefined {
    const stmt = this.db.prepare("SELECT * FROM usuarios WHERE matricula = ?");
    return stmt.get(matricula) as Usuario | undefined;
  }

  /**
   * Busca usuarios por rol
   */
  findByRol(rolId: number): UsuarioConRol[] {
    const stmt = this.db.prepare(`
      SELECT u.*, r.nombre as rol_nombre, r.descripcion as rol_descripcion
      FROM usuarios u
      INNER JOIN roles r ON u.rol_id = r.id
      WHERE u.rol_id = ?
      ORDER BY u.apellido_paterno, u.nombre
    `);
    return stmt.all(rolId) as UsuarioConRol[];
  }

  /**
   * Busca solo estudiantes
   */
  findEstudiantes(): UsuarioConRol[] {
    const stmt = this.db.prepare(`
      SELECT u.*, r.nombre as rol_nombre, r.descripcion as rol_descripcion
      FROM usuarios u
      INNER JOIN roles r ON u.rol_id = r.id
      WHERE r.nombre = 'estudiante'
      ORDER BY u.apellido_paterno, u.nombre
    `);
    return stmt.all() as UsuarioConRol[];
  }

  /**
   * Busca solo maestros
   */
  findMaestros(): UsuarioConRol[] {
    const stmt = this.db.prepare(`
      SELECT u.*, r.nombre as rol_nombre, r.descripcion as rol_descripcion
      FROM usuarios u
      INNER JOIN roles r ON u.rol_id = r.id
      WHERE r.nombre = 'maestro'
      ORDER BY u.apellido_paterno, u.nombre
    `);
    return stmt.all() as UsuarioConRol[];
  }

  /**
   * Crea un nuevo usuario
   */
  create(data: CreateUsuarioData): UsuarioConRol {
    const stmt = this.db.prepare(`
      INSERT INTO usuarios (nombre, apellido_paterno, apellido_materno, email, password_hash, rol_id, matricula)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.nombre,
      data.apellido_paterno,
      data.apellido_materno || null,
      data.email,
      data.password_hash,
      data.rol_id,
      data.matricula || null
    );
    return this.findById(result.lastInsertRowid as number)!;
  }

  /**
   * Actualiza un usuario
   */
  update(id: number, data: UpdateUsuarioData): UsuarioConRol | undefined {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.nombre !== undefined) {
      fields.push("nombre = ?");
      values.push(data.nombre);
    }
    if (data.apellido_paterno !== undefined) {
      fields.push("apellido_paterno = ?");
      values.push(data.apellido_paterno);
    }
    if (data.apellido_materno !== undefined) {
      fields.push("apellido_materno = ?");
      values.push(data.apellido_materno);
    }
    if (data.email !== undefined) {
      fields.push("email = ?");
      values.push(data.email);
    }
    if (data.password_hash !== undefined) {
      fields.push("password_hash = ?");
      values.push(data.password_hash);
    }
    if (data.rol_id !== undefined) {
      fields.push("rol_id = ?");
      values.push(data.rol_id);
    }
    if (data.matricula !== undefined) {
      fields.push("matricula = ?");
      values.push(data.matricula);
    }
    if (data.activo !== undefined) {
      fields.push("activo = ?");
      values.push(data.activo);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push("updated_at = datetime('now')");
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE usuarios SET ${fields.join(", ")} WHERE id = ?
    `);
    stmt.run(...values);
    return this.findById(id);
  }

  /**
   * Elimina un usuario
   */
  delete(id: number): boolean {
    const stmt = this.db.prepare("DELETE FROM usuarios WHERE id = ?");
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Verifica si un email ya existe
   */
  existsByEmail(email: string): boolean {
    const stmt = this.db.prepare("SELECT COUNT(*) as count FROM usuarios WHERE email = ?");
    const result = stmt.get(email) as { count: number };
    return result.count > 0;
  }

  /**
   * Verifica si una matrícula ya existe
   */
  existsByMatricula(matricula: string): boolean {
    const stmt = this.db.prepare("SELECT COUNT(*) as count FROM usuarios WHERE matricula = ?");
    const result = stmt.get(matricula) as { count: number };
    return result.count > 0;
  }

  /**
   * Busca usuarios activos
   */
  findActivos(): UsuarioConRol[] {
    const stmt = this.db.prepare(`
      SELECT u.*, r.nombre as rol_nombre, r.descripcion as rol_descripcion
      FROM usuarios u
      INNER JOIN roles r ON u.rol_id = r.id
      WHERE u.activo = 1
      ORDER BY u.apellido_paterno, u.nombre
    `);
    return stmt.all() as UsuarioConRol[];
  }

  /**
   * Activa/desactiva un usuario
   */
  toggleActivo(id: number, activo: number): boolean {
    const stmt = this.db.prepare("UPDATE usuarios SET activo = ?, updated_at = datetime('now') WHERE id = ?");
    const result = stmt.run(activo, id);
    return result.changes > 0;
  }

  /**
   * Busca usuarios por nombre o apellido (búsqueda parcial)
   */
  search(query: string): UsuarioConRol[] {
    const stmt = this.db.prepare(`
      SELECT u.*, r.nombre as rol_nombre, r.descripcion as rol_descripcion
      FROM usuarios u
      INNER JOIN roles r ON u.rol_id = r.id
      WHERE u.nombre LIKE ? OR u.apellido_paterno LIKE ? OR u.email LIKE ?
      ORDER BY u.apellido_paterno, u.nombre
    `);
    const searchTerm = `%${query}%`;
    return stmt.all(searchTerm, searchTerm, searchTerm) as UsuarioConRol[];
  }
}
