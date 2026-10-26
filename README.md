# Task Management API

API REST con autenticación JWT para gestionar tareas. Cada usuario se registra, inicia sesión y administra únicamente sus propias tareas: crear, consultar, actualizar, completar y eliminar, manteniendo el estado de cada una. Construida con Node.js, Express 5, TypeScript y MongoDB (Mongoose), siguiendo una arquitectura hexagonal.

## Tabla de contenido

- [Stack](#stack)
- [Requisitos](#requisitos)
- [Puesta en marcha](#puesta-en-marcha)
- [Variables de entorno](#variables-de-entorno)
- [Scripts](#scripts)
- [Modelo de datos](#modelo-de-datos)
- [Autenticación y autorización](#autenticación-y-autorización)
- [Gestión de estados](#gestión-de-estados)
- [Endpoints](#endpoints)
- [Validaciones](#validaciones)
- [Formato de respuestas y errores](#formato-de-respuestas-y-errores)
- [Arquitectura](#arquitectura)
- [Decisiones de diseño](#decisiones-de-diseño)
- [Pruebas](#pruebas)
- [Base de datos con Docker](#base-de-datos-con-docker)
- [Docker](#docker)

## Stack

| Área | Tecnología |
|---|---|
| Runtime / lenguaje | Node.js 22, TypeScript 5 |
| HTTP | Express 5, Helmet, CORS, Morgan |
| Base de datos | MongoDB con Mongoose 9 |
| Paginación | mongoose-paginate-v2 |
| Autenticación | JSON Web Tokens (jsonwebtoken), hash de contraseñas con bcryptjs |
| Validación | class-validator, class-transformer |
| Documentación | swagger-jsdoc, swagger-ui-express |
| Pruebas | Jest, ts-jest, Supertest |
| Gestor de paquetes | pnpm |

## Requisitos

- Node.js 20.19 o superior (la imagen Docker usa Node 22)
- pnpm
- MongoDB accesible (local, remoto o el contenedor descrito en [Base de datos con Docker](#base-de-datos-con-docker))

## Puesta en marcha

```bash
pnpm install
cp .env.example .env
```

Genera un secreto para los tokens y colócalo en `JWT_SECRET` dentro de `.env`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Luego inicia el servidor:

```bash
pnpm dev
```

- API: `http://localhost:4200/api`
- Documentación Swagger: `http://localhost:4200/api-docs` (botón **Authorize** para pegar el token)
- Especificación OpenAPI en JSON: `http://localhost:4200/api-docs.json`

Para producción:

```bash
pnpm build
pnpm start
```

La API no arranca si `JWT_SECRET` falta o tiene menos de 32 caracteres.

## Variables de entorno

Se leen desde `.env` (ver `.env.example`).

| Variable | Por defecto | Descripción |
|---|---|---|
| `PORT` | `4200` | Puerto HTTP |
| `NODE_ENV` | `development` | En `development` los errores 500 incluyen el mensaje real; en otros valores devuelven un mensaje genérico |
| `ORIGIN` | vacío | Orígenes permitidos por CORS, separados por coma. Vacío permite cualquier origen (`*`) y desactiva `credentials` |
| `MONGO_URI` | `mongodb://localhost:27017/tasks_db` | Cadena de conexión a MongoDB. Con el contenedor de este proyecto lleva usuario, contraseña y `authSource=admin` (ver [Base de datos con Docker](#base-de-datos-con-docker)) |
| `JWT_SECRET` | sin valor | **Obligatorio**, mínimo 32 caracteres. Clave con la que se firman los tokens |
| `JWT_EXPIRES_IN_SECONDS` | `3600` | Vigencia del token de acceso, en segundos |
| `BCRYPT_SALT_ROUNDS` | `12` | Costo del hash de contraseñas |

## Scripts

| Script | Descripción |
|---|---|
| `pnpm dev` | Servidor en modo desarrollo con recarga (`ts-node-dev`) y logs `DEBUG=nodets:*` |
| `pnpm build` | Compila con `tsc` y resuelve los alias con `tsc-alias` |
| `pnpm start` | Ejecuta `build/index.js` |
| `pnpm test` | Ejecuta las pruebas |
| `pnpm test:watch` | Pruebas en modo observación |
| `pnpm lint` | ESLint sobre `src/**/*.ts` |

## Modelo de datos

Dos colecciones relacionadas en ambos sentidos: cada tarea apunta a su usuario (`user`) y cada usuario guarda el arreglo de sus tareas (`tasks`).

### `users` (modelo `User`)

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | string (ObjectId) | Generado por MongoDB |
| `name` | string | Obligatorio, 2 a 80 caracteres |
| `username` | string | Obligatorio, único, 3 a 30 caracteres (letras, números, `.`, `-`, `_`); se guarda en minúsculas y se usa para iniciar sesión |
| `password` | string | Hash bcrypt. Nunca se devuelve: el campo está excluido de las consultas (`select: false`) y de toda respuesta |
| `tasks` | ObjectId[] | Referencias a `Task`. En `GET /api/users/:id` se devuelven como objetos completos |
| `createdAt`, `updatedAt` | date | Automáticos |

Índice único sobre `username`.

### `tasks` (modelo `Task`)

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | string (ObjectId) | Generado por MongoDB |
| `title` | string | Obligatorio, sin espacios sobrantes, 3 a 120 caracteres |
| `description` | string \| null | Opcional, hasta 1000 caracteres, `null` si no hay |
| `status` | enum | `pending` (por defecto), `in_progress`, `completed` |
| `completedAt` | date \| null | Se asigna al completar y se limpia al cambiar a otro estado |
| `user` | ObjectId | Obligatorio, referencia a `User`. Se asigna desde el token, nunca desde el cuerpo. En las respuestas se devuelve como objeto de usuario (sin `password`) |
| `createdAt`, `updatedAt` | date | Automáticos |

Índice: `{ user: 1, status: 1, createdAt: -1 }`, que sirve a la lista de tareas de un usuario filtrada por estado y ordenada por más reciente.

## Autenticación y autorización

**Registro e inicio de sesión**
- `POST /api/auth/register` crea el usuario. La contraseña se guarda con bcrypt (costo configurable) y nunca se devuelve.
- `POST /api/auth/login` verifica las credenciales y devuelve un token JWT firmado con HS256, con el id del usuario en `sub` y vigencia de `JWT_EXPIRES_IN_SECONDS`.
- El inicio de sesión es con `username` y `password`. El `username` no distingue mayúsculas de minúsculas.
- Un username desconocido y una contraseña incorrecta responden lo mismo (`401 Credenciales inválidas`), y en ambos casos se calcula una comparación de hash para no revelar por tiempo de respuesta si el usuario existe.

**Uso del token**

```
Authorization: Bearer <accessToken>
```

Todas las rutas `/api/tasks` y `/api/users` exigen el token. Se rechazan con `401` los tokens ausentes, mal formados, con firma distinta, con otro algoritmo (incluido `none`) o vencidos.

**Control de acceso**
- Cada usuario solo ve y modifica sus propias tareas. La lista se filtra por el usuario del token y las operaciones por id incluyen al dueño en la consulta.
- Pedir una tarea ajena responde `404`, igual que una inexistente, para no revelar que existe.
- `GET /api/users` lista a todos los usuarios con sus datos públicos, pero sin sus tareas.
- `GET /api/users/:id`, que sí incluye las tareas, solo permite consultar el propio usuario; otro id responde `403`.

## Gestión de estados

```
pending ⇄ in_progress ⇄ completed
   └────────────────────────▲
```

- Toda tarea nace en `pending`.
- Se puede pasar de cualquier estado a cualquier otro distinto.
- Pedir el estado que la tarea ya tiene responde `409`.
- Al pasar a `completed` se guarda `completedAt`. Al salir de `completed` (reabrir) vuelve a `null`.
- El estado solo cambia por `PATCH /api/tasks/:id/status` o `PATCH /api/tasks/:id/complete`. Crear o editar con un campo `status` se rechaza con `400`.

## Endpoints

### Autenticación (públicos)

| Método | Ruta | Descripción | Éxito | Errores |
|---|---|---|---|---|
| POST | `/api/auth/register` | Registra un usuario | 201 | 400, 409 |
| POST | `/api/auth/login` | Devuelve el token de acceso | 200 | 400, 401 |

```bash
curl -X POST http://localhost:4200/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{ "name": "Ana", "username": "ana", "password": "secret123" }'

curl -X POST http://localhost:4200/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "username": "ana", "password": "secret123" }'
```

```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "tokenType": "Bearer",
    "expiresIn": 3600,
    "user": {
      "id": "6adec2ff9b426dbe09aab4c2",
      "name": "Ana",
      "username": "ana",
      "createdAt": "2026-10-25T22:00:00.000Z",
      "updatedAt": "2026-10-25T22:00:00.000Z"
    }
  }
}
```

### Usuarios (requieren token)

| Método | Ruta | Descripción | Éxito | Errores |
|---|---|---|---|---|
| GET | `/api/users` | Lista paginada de usuarios, sin tareas | 200 | 400, 401 |
| GET | `/api/users/:id` | Usuario con su arreglo de tareas | 200 | 400, 401, 403, 404 |

**Listar usuarios**

```bash
curl "http://localhost:4200/api/users?search=ana&page=1&pageSize=10" \
  -H "Authorization: Bearer $TOKEN"
```

Acepta `page`, `pageSize` (1 a 100) y `search`, que busca sin distinguir mayúsculas en `name` y `username`. Orden: más recientes primero. Cada elemento trae solo datos públicos (`id`, `name`, `username`, fechas): nunca `password` ni `tasks`.

```json
{
  "data": [
    {
      "id": "6adec2ff9b426dbe09aab4c2",
      "name": "Ana Lopez",
      "username": "ana",
      "createdAt": "2026-10-25T22:00:00.000Z",
      "updatedAt": "2026-10-25T22:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "pageSize": 10, "pageCount": 1, "total": 1 }
}
```

**Usuario con sus tareas**

```json
{
  "data": {
    "id": "6adec2ff9b426dbe09aab4c2",
    "name": "Ana",
    "username": "ana",
    "tasks": [
      {
        "id": "6adec3009b426dbe09aab4c4",
        "title": "Escribir informe",
        "description": "Resumen",
        "status": "pending",
        "completedAt": null,
        "createdAt": "2026-10-25T22:01:00.000Z",
        "updatedAt": "2026-10-25T22:01:00.000Z"
      }
    ],
    "createdAt": "2026-10-25T22:00:00.000Z",
    "updatedAt": "2026-10-25T22:00:00.000Z"
  }
}
```

Dentro de `tasks` no se repite el `user`, porque ya es el usuario que las contiene. Las tareas vienen de la más reciente a la más antigua.

### Tareas (requieren token)

Base: `/api/tasks`

| Método | Ruta | Descripción | Éxito | Errores |
|---|---|---|---|---|
| POST | `/` | Crea una tarea en `pending` | 201 | 400, 401 |
| GET | `/` | Lista paginada de tus tareas, con filtros | 200 | 400, 401 |
| GET | `/:id` | Obtiene una tarea | 200 | 400, 401, 404 |
| PATCH | `/:id` | Edita `title` y/o `description` | 200 | 400, 401, 404 |
| PATCH | `/:id/status` | Cambia el estado | 200 | 400, 401, 404, 409 |
| PATCH | `/:id/complete` | Marca como completada | 200 | 400, 401, 404, 409 |
| DELETE | `/:id` | Elimina la tarea | 204 | 400, 401, 404 |

Todos los ejemplos siguientes asumen `-H "Authorization: Bearer $TOKEN"`.

### Crear

```bash
curl -X POST http://localhost:4200/api/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "title": "Escribir informe", "description": "Resumen del trimestre" }'
```

```json
{
  "data": {
    "id": "6adec3009b426dbe09aab4c4",
    "title": "Escribir informe",
    "description": "Resumen del trimestre",
    "status": "pending",
    "completedAt": null,
    "user": {
      "id": "6adec2ff9b426dbe09aab4c2",
      "name": "Ana",
      "username": "ana",
      "createdAt": "2026-10-25T22:00:00.000Z",
      "updatedAt": "2026-10-25T22:00:00.000Z"
    },
    "createdAt": "2026-10-25T22:01:00.000Z",
    "updatedAt": "2026-10-25T22:01:00.000Z"
  }
}
```

### Listar

```bash
curl "http://localhost:4200/api/tasks?status=pending&search=informe&page=1&pageSize=10" \
  -H "Authorization: Bearer $TOKEN"
```

| Parámetro | Por defecto | Reglas |
|---|---|---|
| `page` | `1` | Entero ≥ 1 |
| `pageSize` | `10` | Entero entre 1 y 100 |
| `search` | | Hasta 100 caracteres; busca sin distinguir mayúsculas en `title` y `description`. Los caracteres especiales se escapan |
| `status` | | `pending`, `in_progress` o `completed` |

Parámetros desconocidos se rechazan con `400`. Orden fijo: más recientes primero. Cada elemento de `data` incluye su `user`.

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "pageCount": 1,
    "total": 0
  }
}
```

`pageCount` viene de `totalPages` de `mongoose-paginate-v2`, que devuelve `1` cuando no hay resultados.

### Actualizar

```bash
curl -X PATCH http://localhost:4200/api/tasks/6adec3009b426dbe09aab4c4 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "title": "Informe trimestral", "description": null }'
```

Debe incluir al menos `title` o `description`. Enviar `description` como `null` o cadena vacía la limpia.

### Cambiar estado y completar

```bash
curl -X PATCH http://localhost:4200/api/tasks/6adec3009b426dbe09aab4c4/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "status": "in_progress" }'

curl -X PATCH http://localhost:4200/api/tasks/6adec3009b426dbe09aab4c4/complete \
  -H "Authorization: Bearer $TOKEN"
```

### Eliminar

```bash
curl -X DELETE http://localhost:4200/api/tasks/6adec3009b426dbe09aab4c4 \
  -H "Authorization: Bearer $TOKEN"
```

Respuesta `204` sin cuerpo. La eliminación es permanente y la tarea también se quita del arreglo `tasks` del usuario.

## Validaciones

Aplicadas antes de llegar a los casos de uso:

- **Cuerpo (DTOs):** se usa `whitelist` y `forbidNonWhitelisted`, así que cualquier propiedad no declarada devuelve `400` (por ejemplo, enviar `user` o `status` al crear una tarea, o `role` al registrarse). Los textos se recortan (`trim`) antes de validar, por lo que un título de solo espacios es inválido.
- **Registro:** `name` de 2 a 80 caracteres; `username` de 3 a 30 caracteres con letras, números, punto, guion o guion bajo (se normaliza a minúsculas); `password` de 8 a 72 caracteres con al menos una letra y un número (72 es el límite de bcrypt).
- **Query string:** misma regla, con conversión de tipos para `page` y `pageSize`.
- **Parámetro `:id`:** debe ser un ObjectId de 24 caracteres hexadecimales; si no, `400` sin consultar la base.
- **Reglas de negocio:** username duplicado (`409`), tarea inexistente o ajena (`404`), cambio al mismo estado (`409`), actualización vacía (`400`).
- **Esquema Mongoose:** repite las restricciones de longitud, el enum de estado y la unicidad del username como segunda barrera (`runValidators` activo en las actualizaciones).

## Formato de respuestas y errores

- Un recurso: `{ "data": { ... } }`
- Lista: `{ "data": [ ... ], "pagination": { ... } }`
- Errores: `{ "status": <código>, "message": "<detalle>" }`. En errores de validación, `message` concatena todos los problemas separados por coma.

| Código | Cuándo |
|---|---|
| 400 | Cuerpo, query o id inválidos; actualización sin campos |
| 401 | Token ausente, inválido o vencido; credenciales incorrectas |
| 403 | Consultar un usuario distinto al autenticado |
| 404 | La tarea (o el usuario) no existe o no te pertenece |
| 409 | Username ya en uso; la tarea ya está en el estado solicitado |
| 500 | Error inesperado |

## Arquitectura

Arquitectura hexagonal: el dominio y los casos de uso no dependen de Express, Mongoose, bcrypt ni jsonwebtoken. Los puertos (`TaskRepository`, `UserRepository`, `PasswordHasher`, `TokenService`) se implementan en `infrastructure`.

```
src/
├── index.ts                    Arranque: valida el entorno, conecta a Mongo, espera los índices y levanta Express
├── app.ts                      Configuración de Express, rutas y Swagger
├── composition-root.ts         Inyección de dependencias manual
├── swagger.ts                  Definición OpenAPI (incluye el esquema bearerAuth)
├── interfaces/http/routes.ts   Router raíz (/api): auth público; users y tasks tras `authenticate`
├── modules/
│   ├── auth/
│   │   ├── domain/             Puertos PasswordHasher y TokenService
│   │   ├── application/        Registro, login y sus DTOs
│   │   └── infrastructure/
│   │       ├── http/           Controller, rutas y middleware `authenticate`
│   │       └── security/       BcryptPasswordHasher y JwtTokenService
│   ├── user/
│   │   ├── domain/             Entidad User y puerto UserRepository
│   │   ├── application/        Consulta de usuario con sus tareas
│   │   └── infrastructure/     Controller, rutas, esquema Mongoose, mapper y repositorio
│   └── task/
│       ├── domain/             Entidad Task, enum TaskStatus, puerto TaskRepository
│       ├── application/        Casos de uso y DTOs de entrada
│       └── infrastructure/     Controller, rutas, esquema Mongoose y repositorio
└── shared/
    ├── config/                 Variables de entorno y configuración de Express
    ├── database/mongo.ts       Conexión, desconexión y detección de claves duplicadas
    ├── errors/AppError.ts      Error operacional con código HTTP
    ├── middlewares/            Validación de DTO, query e id; manejador de errores
    ├── pagination/             DTOs de paginación, tipos y respuesta paginada
    └── logger/                 Loggers con `debug`
```

Flujo de una petición a una tarea: ruta → `authenticate` (token → `req.auth.userId`) → validación → controller → caso de uso → puerto → repositorio Mongoose → MongoDB. Cualquier error pasa por `errorHandler`.

## Decisiones de diseño

- **Relación en ambos sentidos.** `Task.user` y `User.tasks` se guardan como referencias y se resuelven con `populate`. Es lo que permite que la tarea muestre su usuario y el usuario su arreglo de tareas.
- **Consistencia sin transacciones.** Crear una tarea escribe en dos colecciones. Si falla el segundo paso, el caso de uso borra la tarea recién creada y relanza el error. Al eliminar, se borra la tarea y luego se quita del arreglo; si ese último paso fallara, `populate` ignora las referencias huérfanas. MongoDB sin réplica no ofrece transacciones, por eso se compensa a mano.
- **Sin referencias circulares.** Una tarea incluye su `user` (sin `tasks`), y un usuario incluye sus `tasks` (sin `user` en cada una).
- **Listado de usuarios.** Cualquier usuario autenticado puede listar a los demás, pero solo con datos públicos. Las tareas de un usuario solo las ve su dueño.
- **Propiedad del recurso.** El dueño se toma siempre del token. Las consultas por id incluyen `{ _id, user }`, así que un usuario no puede alcanzar tareas ajenas ni siquiera conociendo el id.
- **Token de acceso sin refresh.** Se emite un único JWT con vigencia corta. No hay revocación: un token es válido hasta que vence.
- **Índices antes de tráfico.** En el arranque se espera a que Mongoose cree los índices; sin eso, el índice único de `username` podría no existir en una base nueva y permitir duplicados si llegan registros simultáneos.
- **Estado controlado.** Cambiar el estado tiene endpoints propios para que `PATCH /:id` no lo altere por accidente y `completedAt` siempre sea consistente.
- **Eliminación física.** `DELETE` borra el documento. Si se necesita recuperación, habría que agregar un campo `deletedAt` y filtrar en el repositorio.
- **Búsqueda con regex.** `search` usa expresión regular escapada, suficiente para volúmenes moderados. Con muchos datos conviene un índice de texto.
- **Actualizaciones sin control de versión.** Una edición lee la tarea y luego la guarda; si dos peticiones editan la misma tarea a la vez, gana la última.

## Pruebas

```bash
pnpm test
```

No requieren base de datos:

- Entidades: transiciones de estado y datos públicos (sin `password`).
- Casos de uso con repositorios simulados: reglas de tareas y su propiedad, registro y login.
- Seguridad: hash bcrypt y JWT (firma ajena, token manipulado, vencido y con algoritmo `none`).
- DTOs: casos válidos e inválidos de tareas y autenticación.
- Rutas HTTP con Supertest: acceso sin token, validación de cuerpo, query e id, acceso a otro usuario y la ruta `/api-docs.json`.
- Repositorios de tareas y usuarios: filtros, populate y mapeo de paginación con `paginate` simulado.

Las pruebas automáticas no ejecutan consultas reales a MongoDB. El flujo completo (registro, login, CRUD, aislamiento entre usuarios, `populate` en ambos sentidos y registro duplicado simultáneo y listado de usuarios) se verificó manualmente contra una instancia real; conviene repetirlo desde `/api-docs` en tu entorno.

## Base de datos con Docker

MongoDB se levanta con el compose del repositorio [Loza64/docker-containers](https://github.com/Loza64/docker-containers/blob/main/database/mongo/docker-compose.yaml) (carpeta `database/mongo`). Esta API no incluye su propio servicio de Mongo: se conecta a ese contenedor.

Lo que define ese compose:

| Elemento | Valor |
|---|---|
| Imagen | `mongo:latest` |
| Contenedor | `some-mongo` |
| Puerto | `27017` publicado en el host |
| Usuario root | `MONGO_INITDB_ROOT_USERNAME` (por defecto `mongo`) |
| Contraseña root | `MONGO_INITDB_ROOT_PASSWORD` (por defecto `change_me`) |
| Volúmenes | `db` (`/data/db`) y `config` (`/data/configdb`) |
| Red | `network` (bridge) |
| Healthcheck | `mongosh` con `ping` cada 10 s |

Levantarlo, definiendo una contraseña propia en lugar de la de ejemplo:

```bash
cd database/mongo
MONGO_INITDB_ROOT_PASSWORD=<tu_password> docker compose up -d
```

(También puedes poner las variables en un `.env` dentro de esa carpeta.) Las credenciales solo se aplican la primera vez, cuando se crea el volumen `db`.

**Nombre de la red.** Compose antepone el nombre del proyecto, que por defecto es el de la carpeta. Al ejecutarlo desde `database/mongo`, la red `network` se crea como `mongo_network`, que es la que usa el `docker-compose.yaml` de esta API. Si lo levantas desde otra carpeta, el nombre cambia; confírmalo con `docker network ls`.

**Cadena de conexión.** El usuario root se crea en la base `admin`, por eso la URI lleva `authSource=admin`:

| Dónde corre la API | `MONGO_URI` |
|---|---|
| En tu máquina (`pnpm dev`) | `mongodb://mongo:<tu_password>@localhost:27017/tasks_db?authSource=admin` |
| En Docker (misma red) | `mongodb://mongo:<tu_password>@some-mongo:27017/tasks_db?authSource=admin` |

Dentro de un contenedor `localhost` apunta al propio contenedor, por eso en Docker se usa el nombre `some-mongo`. Si la contraseña tiene `@`, `:`, `/`, `?` o `#`, debe codificarse en formato URL.

El compose de Mongo publica `27017` en todas las interfaces. Si no necesitas acceso desde fuera de tu máquina, ese archivo trae comentada la alternativa `127.0.0.1:27017:27017` para limitarlo a localhost.

## Docker

Con MongoDB ya levantado (sección anterior):

```bash
cp .env.example .env
docker compose up --build
```

- `docker-compose.yaml` define solo el servicio `api` y lo une a la red externa `mongo_network`. Esa red debe existir antes, es decir, el contenedor de Mongo debe haberse levantado primero.
- La configuración sale del `.env`: `MONGO_URI` (con el host `some-mongo` dentro de Docker) y `JWT_SECRET`, que es obligatorio.
- El `Dockerfile` es multi-etapa: instala con `--frozen-lockfile`, ejecuta `pnpm test` y `pnpm build`, y la imagen final corre como usuario sin privilegios.
- El puerto publicado es el definido en `PORT` (4200 si no se define).
- Si Mongo no está disponible al arrancar, la API termina con error y `restart: unless-stopped` la reinicia hasta que pueda conectarse.
