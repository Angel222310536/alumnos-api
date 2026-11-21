import { Router } from "express";
import type { UsuarioRepository } from "../repositories/usuarioRepository";
import type { AuthService } from "../services/authService";
import { requireAuth } from "../middleware/auth";

export function createUsuarioRouter(
  usuarios: UsuarioRepository, 
  authService: AuthService
): Router {
  const router = Router();

  /**
   * GET /api/usuarios
   * Lista todos los usuarios (requiere autenticación)
   */
  router.get("/", requireAuth(authService), (req, res) => {
    const { rol, search, activo } = req.query;

    let usuariosList;
    
    if (search && typeof search === 'string') {
      usuariosList = usuarios.search(search);
    } else if (rol === 'estudiante') {
      usuariosList = usuarios.findEstudiantes();
    } else if (rol === 'maestro') {
      usuariosList = usuarios.findMaestros();
    } else if (activo === 'true') {
      usuariosList = usuarios.findActivos();
    } else {
      usuariosList = usuarios.findAll();
    }

    res.json(usuariosList);
  });

  /**
   * GET /api/usuarios/:id
   * Obtiene un usuario por ID (requiere autenticación)
   */
  router.get("/:id", requireAuth(authService), (req, res) => {
    const id = parseInt(req.params.id);
    const usuario = usuarios.findById(id);
    
    if (!usuario) {
      res.status(404).json({ message: "Usuario no encontrado" });
      return;
    }
    
    res.json(usuario);
  });

  /**
   * POST /api/usuarios
   * Crea un nuevo usuario (requiere autenticación)
   */
  router.post("/", requireAuth(authService), async (req, res) => {
    const { nombre, apellido_paterno, apellido_materno, email, password, rol_id, matricula } = req.body;

    if (!nombre || !apellido_paterno || !email || !password || !rol_id) {
      res.status(400).json({ 
        message: "Faltan campos requeridos: nombre, apellido_paterno, email, password, rol_id" 
      });
      return;
    }

    if (usuarios.existsByEmail(email)) {
      res.status(409).json({ message: "El email ya está registrado" });
      return;
    }

    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);

    const nuevoUsuario = usuarios.create({
      nombre,
      apellido_paterno,
      apellido_materno,
      email,
      password_hash: passwordHash,
      rol_id,
      matricula,
    });

    res.status(201).json(nuevoUsuario);
  });

  /**
   * PUT /api/usuarios/:id
   * Actualiza un usuario (requiere autenticación)
   */
  router.put("/:id", requireAuth(authService), async (req, res) => {
    const id = parseInt(req.params.id);
    const { nombre, apellido_paterno, apellido_materno, email, password, rol_id, matricula, activo } = req.body;

    const usuarioExistente = usuarios.findById(id);
    if (!usuarioExistente) {
      res.status(404).json({ message: "Usuario no encontrado" });
      return;
    }

    let passwordHash;
    if (password) {
      const bcrypt = require('bcryptjs');
      passwordHash = await bcrypt.hash(password, 10);
    }

    const usuarioActualizado = usuarios.update(id, {
      nombre,
      apellido_paterno,
      apellido_materno,
      email,
      password_hash: passwordHash,
      rol_id,
      matricula,
      activo,
    });

    res.json(usuarioActualizado);
  });

  /**
   * DELETE /api/usuarios/:id
   * Elimina un usuario (requiere autenticación)
   */
  router.delete("/:id", requireAuth(authService), (req, res) => {
    const id = parseInt(req.params.id);
    
    const usuario = usuarios.findById(id);
    if (!usuario) {
      res.status(404).json({ message: "Usuario no encontrado" });
      return;
    }

    usuarios.delete(id);
    res.status(204).send();
  });

  /**
   * PATCH /api/usuarios/:id/activar
   * Activa/desactiva un usuario (requiere autenticación)
   */
  router.patch("/:id/activar", requireAuth(authService), (req, res) => {
    const id = parseInt(req.params.id);
    const { activo } = req.body;

    if (activo === undefined || activo === null) {
      res.status(400).json({ message: "Se requiere el campo 'activo'" });
      return;
    }

    const success = usuarios.toggleActivo(id, activo ? 1 : 0);
    
    if (!success) {
      res.status(404).json({ message: "Usuario no encontrado" });
      return;
    }

    res.json({ message: activo ? "Usuario activado" : "Usuario desactivado" });
  });

  return router;
}
