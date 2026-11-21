import { Router } from "express";
import { createAuthController } from "../controllers/authController";
import type { AuthService } from "../services/authService";
import { requireAuth } from "../middleware/auth";

export function createAuthRouter(authService: AuthService): Router {
  const router = Router();
  const authController = createAuthController(authService);

  router.post("/register", authController.register);
  router.post("/login", authController.login);
  router.post("/refresh", authController.refresh);
  router.post("/logout", requireAuth(authService), authController.logout);
  router.get("/me", requireAuth(authService), authController.me);

  return router;
}
