import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { config } from "../config/env";
import { conflict, unauthorized } from "../errors/httpError";
import type { UsuarioRepository, Usuario } from "../repositories/usuarioRepository";
import type { TokenRepository } from "../repositories/tokenRepository";
import type { RefreshTokenRepository } from "../repositories/refreshTokenRepository";

export interface PublicUser {
  id: number;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  email: string;
  rol_id: number;
  rol_nombre: string;
}

export interface TokenPayload {
  sub: string;
  email: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  rol_id: number;
  rol_nombre: string;
  jti: string;
  exp: number;
  iat: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class AuthService {
  private readonly refreshTokenExpiry = 7 * 24 * 60 * 60; // 7 días en segundos

  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly tokens: TokenRepository,
    private readonly refreshTokens: RefreshTokenRepository,
  ) {}

  async register(
    nombre: string,
    apellido_paterno: string,
    apellido_materno: string | undefined,
    email: string,
    password: string,
    rol_id: number
  ): Promise<PublicUser> {
    if (this.usuarios.existsByEmail(email)) {
      throw conflict("Ya existe un usuario con ese correo electrónico");
    }
    
    const hash = await bcrypt.hash(password, config.bcryptRounds);
    const usuario = this.usuarios.create({
      nombre,
      apellido_paterno,
      apellido_materno,
      email,
      password_hash: hash,
      rol_id,
    });
    
    return {
      id: usuario.id,
      nombre: usuario.nombre,
      apellido_paterno: usuario.apellido_paterno,
      apellido_materno: usuario.apellido_materno,
      email: usuario.email,
      rol_id: usuario.rol_id,
      rol_nombre: usuario.rol_nombre,
    };
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ accessToken: string; refreshToken: string; user: PublicUser }> {
    const usuario = this.usuarios.findByEmail(email);

    if (!usuario || usuario.password_hash === "") {
      throw unauthorized("Credenciales inválidas");
    }

    if (usuario.activo !== 1) {
      throw unauthorized("Usuario inactivo. Contacta al administrador.");
    }

    const ok = await bcrypt.compare(password, usuario.password_hash);
    if (!ok) throw unauthorized("Credenciales inválidas");

    // Generar access token
    const accessToken = this.generateAccessToken(usuario);
    
    // Generar refresh token
    const refreshTokenRecord = this.refreshTokens.create(
      usuario.id,
      this.refreshTokenExpiry,
    );

    const usuarioConRol = this.usuarios.findById(usuario.id);

    return { 
      accessToken, 
      refreshToken: refreshTokenRecord.token, 
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido_paterno: usuario.apellido_paterno,
        apellido_materno: usuario.apellido_materno,
        email: usuario.email,
        rol_id: usuario.rol_id,
        rol_nombre: usuarioConRol?.rol_nombre || 'sin_rol',
      }
    };
  }

  /**
   * Refresca el access token usando un refresh token válido
   */
  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    // Verificar refresh token
    const validation = this.refreshTokens.isValid(refreshToken);
    
    if (!validation.valid || !validation.userId) {
      throw unauthorized("Refresh token inválido o expirado");
    }

    // Eliminar el refresh token anterior (rotación)
    this.refreshTokens.delete(refreshToken);

    // Obtener datos del usuario
    const usuario = this.usuarios.findById(validation.userId);
    
    if (!usuario) {
      throw unauthorized("Usuario no encontrado");
    }

    if (usuario.activo !== 1) {
      throw unauthorized("Usuario inactivo");
    }
    
    // Generar nuevos tokens
    const accessToken = this.generateAccessToken(usuario);
    
    const refreshTokenRecord = this.refreshTokens.create(
      usuario.id,
      this.refreshTokenExpiry,
    );

    return {
      accessToken,
      refreshToken: refreshTokenRecord.token,
    };
  }

  /**
   * Genera un access token JWT
   */
  private generateAccessToken(usuario: Usuario | PublicUser): string {
    const options: SignOptions = {
      expiresIn: config.jwtExpiresIn as SignOptions["expiresIn"],
      jwtid: randomUUID(),
    };
    
    return jwt.sign(
      { 
        sub: String(usuario.id), 
        email: usuario.email,
        nombre: usuario.nombre,
        apellido_paterno: usuario.apellido_paterno,
        apellido_materno: usuario.apellido_materno,
        rol_id: usuario.rol_id,
        rol_nombre: 'rol_nombre' in usuario ? usuario.rol_nombre : 'sin_rol',
      },
      config.jwtSecret,
      options,
    );
  }

  /** Revoca el token actual (logout) usando su jti y expiración. */
  logout(payload: TokenPayload, refreshToken?: string): void {
    // Revocar access token
    this.tokens.revoke(payload.jti, payload.exp);
    
    // Eliminar refresh token si se proporciona
    if (refreshToken) {
      this.refreshTokens.delete(refreshToken);
    }
  }

  verify(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload;
      if (!decoded.jti) throw new Error("token sin jti");
      if (this.tokens.isRevoked(decoded.jti)) {
        throw unauthorized("La sesión ha sido cerrada");
      }
      return decoded;
    } catch (err) {
      if (err instanceof Error && err.name === "HttpError") throw err;
      throw unauthorized("Token inválido o expirado");
    }
  }
}
