import type { AppDatabase } from "../db/database";

export interface RefreshToken {
  id: number;
  usuario_id: number;
  token: string;
  expires_at: number;
  created_at: number;
}

export class RefreshTokenRepository {
  constructor(private readonly db: AppDatabase) {}

  /**
   * Crea un nuevo refresh token
   */
  create(usuarioId: number, expiresIn: number): RefreshToken {
    const token = this.generateToken();
    const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;
    
    const stmt = this.db.prepare(`
      INSERT INTO refresh_tokens (usuario_id, token, expires_at)
      VALUES (?, ?, ?)
    `);
    
    const result = stmt.run(usuarioId, token, expiresAt);
    
    return {
      id: result.lastInsertRowid as number,
      usuario_id: usuarioId,
      token,
      expires_at: expiresAt,
      created_at: Math.floor(Date.now() / 1000),
    };
  }

  /**
   * Valida un refresh token
   */
  isValid(token: string): { valid: boolean; userId?: number } {
    const stmt = this.db.prepare(`
      SELECT usuario_id, expires_at 
      FROM refresh_tokens 
      WHERE token = ?
    `);
    
    const result = stmt.get(token) as { usuario_id: number; expires_at: number } | undefined;
    
    if (!result) {
      return { valid: false };
    }
    
    const now = Math.floor(Date.now() / 1000);
    if (result.expires_at < now) {
      // Token expirado, eliminarlo
      this.delete(token);
      return { valid: false };
    }
    
    return { valid: true, userId: result.usuario_id };
  }

  /**
   * Elimina un refresh token
   */
  delete(token: string): boolean {
    const stmt = this.db.prepare("DELETE FROM refresh_tokens WHERE token = ?");
    const result = stmt.run(token);
    return result.changes > 0;
  }

  /**
   * Elimina todos los refresh tokens de un usuario
   */
  deleteByUsuario(usuarioId: number): number {
    const stmt = this.db.prepare("DELETE FROM refresh_tokens WHERE usuario_id = ?");
    const result = stmt.run(usuarioId);
    return result.changes;
  }

  /**
   * Elimina tokens expirados (limpieza)
   */
  deleteExpired(): number {
    const now = Math.floor(Date.now() / 1000);
    const stmt = this.db.prepare("DELETE FROM refresh_tokens WHERE expires_at < ?");
    const result = stmt.run(now);
    return result.changes;
  }

  /**
   * Cuenta tokens activos de un usuario
   */
  countByUsuario(usuarioId: number): number {
    const now = Math.floor(Date.now() / 1000);
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count 
      FROM refresh_tokens 
      WHERE usuario_id = ? AND expires_at > ?
    `);
    const result = stmt.get(usuarioId, now) as { count: number };
    return result.count;
  }

  /**
   * Genera un token único
   */
  private generateToken(): string {
    const { randomUUID } = require('node:crypto');
    return randomUUID();
  }
}
