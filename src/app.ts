import express, { type Express } from "express";
import swaggerUi from "swagger-ui-express";
import { openapiSpec } from "./docs/openapi";
import type { AppDatabase } from "./db/database";
import { RolRepository } from "./repositories/rolRepository";
import { UsuarioRepository } from "./repositories/usuarioRepository";
import { TokenRepository } from "./repositories/tokenRepository";
import { RefreshTokenRepository } from "./repositories/refreshTokenRepository";
import { AuthService } from "./services/authService";
import { createAuthRouter } from "./routes/authRoutes";
import { createUsuarioRouter } from "./routes/usuarioRoutes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import cors from "cors";

/**
 * Construye la aplicación Express con todas las dependencias inyectadas
 * a partir de una base de datos. Permite crear apps aisladas en pruebas.
 */
export function createApp(db: AppDatabase): Express {
  const roles = new RolRepository(db);
  const usuarios = new UsuarioRepository(db);
  const tokens = new TokenRepository(db);
  const refreshTokens = new RefreshTokenRepository(db);
  const authService = new AuthService(usuarios, tokens, refreshTokens);

  const app = express();

  app.use(
    cors({
      origin: "http://localhost:8081",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );
  
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Documentación Swagger / OpenAPI
  app.get("/api-docs.json", (_req, res) => {
    res.json(openapiSpec);
  });
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(openapiSpec, {
      customSiteTitle: "API de Usuarios — Documentación",
    }),
  );

  app.use("/api/auth", createAuthRouter(authService));
  app.use("/api/usuarios", createUsuarioRouter(usuarios, authService));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
