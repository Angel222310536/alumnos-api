/**
 * Especificación OpenAPI 3.0 de la API de usuarios.
 * Se sirve como UI interactiva en `/api-docs` y como JSON en `/api-docs.json`.
 */
export const openapiSpec = {
  openapi: "3.0.3",
  info: {
    title: "API REST de Administración Escolar",
    version: "2.0.0",
    description:
      "API para administrar usuarios con sistema de roles (estudiantes y maestros) " +
      "con autenticación JWT. Todos los endpoints (excepto login y register) requieren token.",
  },
  servers: [{ url: "http://localhost:3000", description: "Servidor local" }],
  tags: [
    { name: "Auth", description: "Registro, inicio y cierre de sesión" },
    { name: "Usuarios", description: "CRUD de usuarios (requiere token)" },
    { name: "Roles", description: "Consulta de roles disponibles" },
    { name: "Sistema", description: "Estado del servicio" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Envía el token como `Authorization: Bearer <token>`",
      },
    },
    schemas: {
      Credentials: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "ana@test.com" },
          password: { type: "string", minLength: 6, example: "secret123" },
        },
      },
      Rol: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          nombre: { type: "string", example: "estudiante" },
          descripcion: { type: "string", example: "Rol de estudiante" },
          created_at: { type: "string", example: "2026-09-22 12:00:00" },
        },
      },
      PublicUser: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          nombre: { type: "string", example: "Ana" },
          apellido_paterno: { type: "string", example: "García" },
          apellido_materno: { type: "string", example: "López", nullable: true },
          email: { type: "string", format: "email", example: "ana@test.com" },
          rol_id: { type: "integer", example: 2 },
          rol_nombre: { type: "string", example: "maestro" },
        },
      },
      LoginResponse: {
        type: "object",
        properties: {
          accessToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6..." },
          refreshToken: { type: "string", example: "550e8400-e29b-41d4-a716-446655440000" },
          user: { $ref: "#/components/schemas/PublicUser" },
        },
      },
      RefreshTokenRequest: {
        type: "object",
        required: ["refreshToken"],
        properties: {
          refreshToken: { type: "string", example: "550e8400-e29b-41d4-a716-446655440000" },
        },
      },
      RefreshTokenResponse: {
        type: "object",
        properties: {
          accessToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6..." },
          refreshToken: { type: "string", example: "660e8400-e29b-41d4-a716-446655440001" },
        },
      },
      RegisterInput: {
        type: "object",
        required: ["nombre", "apellido_paterno", "email", "password", "rol_id"],
        properties: {
          nombre: { type: "string", example: "Juan" },
          apellido_paterno: { type: "string", example: "Pérez" },
          apellido_materno: { type: "string", example: "López", nullable: true },
          email: { type: "string", format: "email", example: "juan@alumnos.test" },
          password: {
            type: "string",
            minLength: 6,
            example: "secret123",
            description: "Contraseña del usuario (se guarda cifrada, nunca se devuelve)",
          },
          rol_id: {
            type: "integer",
            example: 1,
            description: "1 = estudiante, 2 = maestro",
          },
          matricula: {
            type: "string",
            example: "A001",
            nullable: true,
            description: "Matrícula del estudiante (opcional)",
          },
        },
      },
      UsuarioInput: {
        type: "object",
        required: ["nombre", "apellido_paterno", "email", "password", "rol_id"],
        properties: {
          nombre: { type: "string", example: "Juan" },
          apellido_paterno: { type: "string", example: "Pérez" },
          apellido_materno: { type: "string", example: "López", nullable: true },
          email: { type: "string", format: "email", example: "juan@alumnos.test" },
          password: {
            type: "string",
            minLength: 6,
            example: "secret123",
            description: "Contraseña del usuario (se guarda cifrada, nunca se devuelve)",
          },
          rol_id: {
            type: "integer",
            example: 1,
            description: "1 = estudiante, 2 = maestro",
          },
          matricula: {
            type: "string",
            example: "A001",
            nullable: true,
            description: "Matrícula del estudiante (opcional)",
          },
        },
      },
      UsuarioUpdate: {
        type: "object",
        properties: {
          nombre: { type: "string", example: "Juan Carlos" },
          apellido_paterno: { type: "string", example: "Pérez" },
          apellido_materno: { type: "string", example: "García", nullable: true },
          email: { type: "string", format: "email", example: "juancarlos@test.com" },
          password: {
            type: "string",
            minLength: 6,
            example: "newsecret123",
            description: "Nueva contraseña (opcional)",
          },
          rol_id: {
            type: "integer",
            example: 2,
            description: "1 = estudiante, 2 = maestro",
          },
          matricula: {
            type: "string",
            example: "A001",
            nullable: true,
          },
          activo: {
            type: "integer",
            example: 1,
            description: "1 = activo, 0 = inactivo",
          },
        },
      },
      Usuario: {
        type: "object",
        description: "Usuario devuelto por la API (sin la contraseña).",
        properties: {
          id: { type: "integer", example: 1 },
          nombre: { type: "string", example: "Juan" },
          apellido_paterno: { type: "string", example: "Pérez" },
          apellido_materno: { type: "string", example: "López", nullable: true },
          email: { type: "string", format: "email", example: "juan@alumnos.test" },
          rol_id: { type: "integer", example: 1 },
          rol_nombre: { type: "string", example: "estudiante" },
          rol_descripcion: { type: "string", example: "Rol de estudiante", nullable: true },
          matricula: { type: "string", example: "A001", nullable: true },
          activo: { type: "integer", example: 1 },
          created_at: { type: "string", example: "2026-09-22 12:00:00" },
          updated_at: { type: "string", example: "2026-09-22 12:00:00" },
        },
      },
      Error: {
        type: "object",
        properties: {
          message: { type: "string", example: "Datos de entrada inválidos" },
          errors: { type: "array", items: { type: "object" } },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Sistema"],
        summary: "Estado del servicio",
        security: [],
        responses: {
          "200": {
            description: "Servicio operativo",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { status: { type: "string", example: "ok" } },
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Registrar un nuevo usuario",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterInput" },
            },
          },
        },
        responses: {
          "201": {
            description: "Usuario creado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { user: { $ref: "#/components/schemas/PublicUser" } },
                },
              },
            },
          },
          "400": { description: "Datos inválidos", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "409": { description: "El correo ya existe", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Iniciar sesión",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Credentials" },
            },
          },
        },
        responses: {
          "200": {
            description: "Token emitido",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginResponse" },
              },
            },
          },
          "401": { description: "Credenciales inválidas", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Renovar tokens",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RefreshTokenRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Tokens renovados",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RefreshTokenResponse" },
              },
            },
          },
          "401": { description: "Refresh token inválido o expirado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Obtener usuario actual",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Usuario actual",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/PublicUser" },
                  },
                },
              },
            },
          },
          "401": { description: "No autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Cerrar sesión (revoca el token actual)",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Sesión cerrada",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { message: { type: "string", example: "Sesión cerrada" } },
                },
              },
            },
          },
          "401": { description: "No autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/roles": {
      get: {
        tags: ["Roles"],
        summary: "Listar todos los roles",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Lista de roles",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Rol" },
                },
              },
            },
          },
          "401": { description: "No autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/usuarios": {
      get: {
        tags: ["Usuarios"],
        summary: "Listar usuarios",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "rol",
            in: "query",
            description: "Filtrar por rol (estudiante, maestro)",
            schema: { type: "string" },
            example: "estudiante",
          },
          {
            name: "search",
            in: "query",
            description: "Buscar por nombre, apellido o email",
            schema: { type: "string" },
            example: "Juan",
          },
          {
            name: "activo",
            in: "query",
            description: "Filtrar por estado activo (true, false)",
            schema: { type: "string" },
            example: "true",
          },
        ],
        responses: {
          "200": {
            description: "Lista de usuarios",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Usuario" },
                },
              },
            },
          },
          "401": { description: "No autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      post: {
        tags: ["Usuarios"],
        summary: "Crear usuario (requiere autenticación)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UsuarioInput" },
            },
          },
        },
        responses: {
          "201": {
            description: "Usuario creado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Usuario" },
              },
            },
          },
          "400": { description: "Datos inválidos", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "401": { description: "No autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "409": { description: "Matrícula o correo duplicado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/usuarios/{id}": {
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "integer" }, example: 1 },
      ],
      get: {
        tags: ["Usuarios"],
        summary: "Obtener un usuario por ID",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Usuario encontrado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Usuario" },
              },
            },
          },
          "401": { description: "No autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "404": { description: "No encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      put: {
        tags: ["Usuarios"],
        summary: "Actualizar un usuario",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UsuarioUpdate" },
            },
          },
        },
        responses: {
          "200": {
            description: "Usuario actualizado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Usuario" },
              },
            },
          },
          "400": { description: "Datos inválidos", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "401": { description: "No autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "404": { description: "No encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "409": { description: "Matrícula o correo duplicado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      delete: {
        tags: ["Usuarios"],
        summary: "Eliminar un usuario",
        security: [{ bearerAuth: [] }],
        responses: {
          "204": { description: "Eliminado (sin contenido)" },
          "401": { description: "No autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "404": { description: "No encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/usuarios/{id}/activar": {
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "integer" }, example: 1 },
      ],
      patch: {
        tags: ["Usuarios"],
        summary: "Activar o desactivar un usuario",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["activo"],
                properties: {
                  activo: {
                    type: "boolean",
                    example: true,
                    description: "true para activar, false para desactivar",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Estado actualizado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Usuario activado" },
                  },
                },
              },
            },
          },
          "400": { description: "Datos inválidos", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "401": { description: "No autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "404": { description: "No encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
  },
} as const;
