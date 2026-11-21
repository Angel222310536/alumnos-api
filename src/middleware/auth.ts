import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { AuthService, TokenPayload } from "../services/authService";

export function requireAuth(authService: AuthService): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "Token no proporcionado" });
      return;
    }

    const token = authHeader.substring(7);
    try {
      const payload: TokenPayload = authService.verify(token);
      req.auth = payload;
      next();
    } catch (err) {
      res.status(401).json({ message: "Token inválido o expirado" });
      return;
    }
  };
}

export function requireRole(rolNombre: string): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      res.status(401).json({ message: "No autenticado" });
      return;
    }

    if (req.auth.rol_nombre !== rolNombre) {
      res.status(403).json({ message: `Se requiere rol: ${rolNombre}` });
      return;
    }

    next();
  };
}

export function requireAnyRole(roles: string[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      res.status(401).json({ message: "No autenticado" });
      return;
    }

    if (!roles.includes(req.auth.rol_nombre)) {
      res.status(403).json({ message: `Se requiere uno de los roles: ${roles.join(', ')}` });
      return;
    }

    next();
  };
}
