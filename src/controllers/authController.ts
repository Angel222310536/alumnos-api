import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { parseBody } from "../middleware/validate";
import { z } from "zod";
import type { AuthService } from "../services/authService";

const registerSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  apellido_paterno: z.string().min(1, "El apellido paterno es requerido"),
  apellido_materno: z.string().optional(),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  rol_id: z.number().int("El rol_id debe ser un número entero"),
  matricula: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export function createAuthController(authService: AuthService) {
  const register = asyncHandler(async (req: Request, res: Response) => {
    const data = parseBody(registerSchema, req.body);
    const user = await authService.register(
      data.nombre,
      data.apellido_paterno,
      data.apellido_materno,
      data.email,
      data.password,
      data.rol_id
    );
    res.status(201).json({ user });
  });

  const login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = parseBody(loginSchema, req.body);
    const result = await authService.login(email, password);
    res.status(200).json(result);
  });

  const refresh = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ message: "Refresh token requerido" });
      return;
    }
    
    const result = await authService.refresh(refreshToken);
    res.status(200).json(result);
  });

  const logout = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    // req.auth lo garantiza requireAuth
    authService.logout(req.auth!, refreshToken);
    res.status(200).json({ message: "Sesión cerrada" });
  });

  const me = asyncHandler(async (req: Request, res: Response) => {
    const payload = req.auth!;
    res.json({ 
      data: {
        id: parseInt(payload.sub),
        email: payload.email,
        nombre: payload.nombre,
        apellido_paterno: payload.apellido_paterno,
        apellido_materno: payload.apellido_materno,
        rol_id: payload.rol_id,
        rol_nombre: payload.rol_nombre,
      }
    });
  });

  return { register, login, logout, refresh, me };
}
