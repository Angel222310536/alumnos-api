import type { AppDatabase } from "../db/database";

export interface Rol {
  id: number;
  nombre: string;
  descripcion: string | null;
  created_at: string;
}

export class RolRepository {
  constructor(private readonly db: AppDatabase) {}

  /**
   * Obtiene todos los roles
   */
  findAll(): Rol[] {
    const stmt = this.db.prepare("SELECT * FROM roles ORDER BY nombre");
    return stmt.all() as Rol[];
  }

  /**
   * Busca un rol por ID
   */
  findById(id: number): Rol | undefined {
    const stmt = this.db.prepare("SELECT * FROM roles WHERE id = ?");
    return stmt.get(id) as Rol | undefined;
  }

  /**
   * Busca un rol por nombre
   */
  findByNombre(nombre: string): Rol | undefined {
    const stmt = this.db.prepare("SELECT * FROM roles WHERE nombre = ?");
    return stmt.get(nombre) as Rol | undefined;
  }

  /**
   * Crea un nuevo rol
   */
  create(nombre: string, descripcion?: string): Rol {
    const stmt = this.db.prepare(
      "INSERT INTO roles (nombre, descripcion) VALUES (?, ?)"
    );
    const result = stmt.run(nombre, descripcion || null);
    return this.findById(result.lastInsertRowid as number)!;
  }

  /**
   * Actualiza un rol
   */
  update(id: number, nombre: string, descripcion?: string): Rol | undefined {
    const stmt = this.db.prepare(
      "UPDATE roles SET nombre = ?, descripcion = ? WHERE id = ?"
    );
    stmt.run(nombre, descripcion || null, id);
    return this.findById(id);
  }

  /**
   * Elimina un rol
   */
  delete(id: number): boolean {
    const stmt = this.db.prepare("DELETE FROM roles WHERE id = ?");
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Verifica si un rol existe por nombre
   */
  existsByNombre(nombre: string): boolean {
    const stmt = this.db.prepare("SELECT COUNT(*) as count FROM roles WHERE nombre = ?");
    const result = stmt.get(nombre) as { count: number };
    return result.count > 0;
  }

  /**
   * Obtiene el ID del rol por nombre
   */
  getIdByNombre(nombre: string): number | null {
    const rol = this.findByNombre(nombre);
    return rol ? rol.id : null;
  }
}
