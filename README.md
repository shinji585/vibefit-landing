# VibeFit

VibeFit es una aplicación web para apoyar la gestión de un gimnasio y el seguimiento de sus clientes. Reúne una landing pública, la preinscripción de clientes, la administración de membresías y herramientas diferenciadas para gerencia y recepción.

Este es un proyecto universitario realizado para **Unicolombo**, en el área de **Sistemas de Información**. Su propósito es aplicar conocimientos de desarrollo web, bases de datos, autenticación y gestión de procesos a un caso práctico de administración de un gimnasio.

## Tecnologías y herramientas

Los logos de esta sección son los recursos que se encuentran en `public/tools_used/`.

| Logo | Herramienta | Uso en el proyecto |
|---|---|---|
| <img src="public/tools_used/330px-Nextjs-logo.svg.png" alt="Logo de Next.js" height="48"> | **Next.js 16** | Framework de React para las páginas, rutas, renderizado en servidor, Server Actions y compilación de la aplicación. Se utiliza App Router para organizar los flujos públicos y privados. |
| <img src="public/tools_used/supabase-logo-green-white-transparent.svg" alt="Logo de Supabase" height="42"> | **Supabase** | Autenticación, sesiones, acceso a datos y comunicación entre la aplicación y la base de datos. Se usan clientes separados para navegador, servidor y operaciones administrativas. |
| <img src="public/tools_used/postgresql-logo-svgrepo-com.svg" alt="Logo de PostgreSQL" height="48"> | **PostgreSQL** | Motor relacional que almacena usuarios, roles, planes, membresías, asistencias y auditoría en Supabase. |
| <img src="public/tools_used/google-icon-logo-svgrepo-com.svg" alt="Logo de Google" height="42"> | **Google OAuth** | Opción para iniciar sesión o registrarse con una cuenta de Google mediante Supabase Auth. |
| <img src="public/tools_used/500px-Claude_AI_symbol.svg.png" alt="Logo de Claude" height="42"> | **Claude** | Se utilizó como asistente para comprender el funcionamiento de Supabase y analizar alternativas para los flujos de autenticación y datos. |
| <img src="public/tools_used/330px-GitHub_Copilot_logo.svg.png" alt="Logo de GitHub Copilot" height="48"> | **GitHub Copilot** | Se utilizó como agente de asistencia para escribir y modificar código, investigar errores y validar cambios con las herramientas del proyecto. |

### Librerías principales

- **React 19 y TypeScript:** construcción de interfaces por componentes y tipado del código.
- **Tailwind CSS 4:** estilos responsivos y composición visual.
- **`@supabase/ssr` y `@supabase/supabase-js`:** clientes Supabase para Next.js en servidor y navegador.
- **Framer Motion:** animaciones y transiciones de la interfaz.
- **DotLottie y Rive:** animaciones ilustrativas de la landing y los flujos de autenticación.
- **React Hook Form y Zod:** manejo y validación de formularios.
- **Base UI:** primitivas accesibles para controles reutilizables.
- **Lucide React:** iconografía.
- **Lenis:** desplazamiento suave en la landing.

## Funcionalidades

### Landing y preinscripción

La página pública presenta VibeFit, sus beneficios, testimonios, galería y formulario de preinscripción. Una preinscripción crea el acceso de autenticación, pero **no activa una membresía ni completa por sí sola la inscripción**. La activación ocurre cuando recepción asigna un plan vigente.

El inicio de sesión y el registro también están disponibles en `/login`; Google OAuth usa el callback de `/auth/callback`.

### Dashboard del cliente

La ruta `/user-dashboard` verifica la sesión, los roles y la membresía. Un usuario con únicamente el rol `client` y sin una membresía activa dentro de sus fechas de vigencia ve el estado pendiente de recepción. Al activarse una membresía, el estado pendiente deja de aplicar.

### Dashboard de gerencia

La ruta `/manager-dashboard` está protegida por el rol `manager`. Incluye:

- Resumen de registros, actividad y membresías.
- Estadísticas de clientes con membresía vigente y preinscripciones pendientes.
- Administración de cuentas, nombres, roles y estado.
- Creación de cuentas con selección de rol.
- Administración de planes de membresía.
- Asistencia y auditoría de cambios.

### Dashboard de recepción

La ruta `/receptionist-dashboard` está protegida por el rol `receptionist`. Permite:

- Revisar preinscripciones desde la campana y asignar un plan individualmente.
- Consultar estadísticas de clientes inscritos, preinscripciones pendientes y planes próximos a vencer.
- Crear cuentas de clientes desde recepción.
- Buscar clientes con membresía vigente y registrar su asistencia.
- Consultar las asistencias del día.

Las fechas y horas operativas se calculan con la zona horaria `America/Bogota`.

## Estructura del proyecto

```text
app/
├── (public-pages)/           # Landing pública
├── actions/                  # Server Actions de autenticación, gerencia y recepción
├── auth/
│   ├── callback/             # Intercambio del código de autenticación OAuth
│   └── auth-code-error/      # Estado de error del callback
├── globals.css               # Estilos globales y configuración de Tailwind
├── layout.tsx                # Layout raíz y metadatos de la aplicación
├── icon.svg                  # Ícono de la aplicación
├── login/                    # Inicio de sesión y registro
├── manager-dashboard/        # Entrada al dashboard de gerencia
├── receptionist-dashboard/   # Entrada al dashboard de recepción
└── user-dashboard/           # Entrada y control de estado del cliente

components/
├── ui/                       # Controles reutilizables
├── manager-dashboard-data.tsx # Datos, estadísticas y secciones de gerencia
├── manager-dashboard.tsx      # Navegación y layout de gerencia
├── reception-dashboard.tsx    # Interfaz de recepción
├── pending-account.tsx        # Estado de preinscripción pendiente
├── split-login-form.tsx       # Inicio de sesión, registro y Google OAuth
└── ...                        # Animaciones, navegación, footer e iconos

lib/
├── supabase/
│   ├── client.ts              # Cliente Supabase para el navegador
│   ├── server.ts              # Cliente Supabase para servidor y Server Actions
│   ├── admin.ts               # Cliente administrativo solo de servidor
│   └── middleware.ts          # Integración de sesión usada por el proxy
└── utils.ts                   # Utilidades compartidas

sections/                     # Secciones de la landing pública
data/                          # Datos de contenido usados por la interfaz
public/
├── assets/                   # Imágenes y recursos gráficos
├── tools_used/               # Logos de herramientas y servicios
├── videos/                   # Videos de la landing
└── *.lottie / *.riv          # Animaciones

proxy.ts                      # Renovación de sesión Supabase en las solicitudes
package.json                  # Dependencias y comandos npm
next.config.ts                # Configuración de Next.js
tsconfig.json                 # Configuración de TypeScript
eslint.config.mjs             # Configuración de ESLint
postcss.config.mjs            # Integración de PostCSS y Tailwind
```

## Datos y acceso

La aplicación consulta las tablas de Supabase existentes para los siguientes procesos:

| Tabla | Propósito |
|---|---|
| `users` | Datos básicos y estado de las cuentas. |
| `user_roles` | Roles asignados a cada usuario, por ejemplo `client`, `coach`, `receptionist` y `manager`. |
| `membership_plans` | Planes disponibles, precio y duración. |
| `client_memberships` | Membresías asignadas, estado y vigencia. |
| `attendance_records` | Asistencias de los clientes y su registro. |
| `audit_logs` | Historial de cambios consultado por gerencia. |

La sesión del usuario se verifica en servidor y las políticas de Row Level Security (RLS) de Supabase controlan el acceso a los datos. Las acciones privilegiadas de creación de usuarios se ejecutan solamente en el servidor.

El repositorio no incluye migraciones SQL de estas tablas: se requiere conectar la aplicación a un proyecto Supabase que ya tenga configurados el esquema, los roles y las políticas correspondientes.

## Requisitos

- Node.js compatible con Next.js 16.
- npm.
- Un proyecto Supabase configurado con las tablas, roles y políticas que utiliza la aplicación.
- La clave `SUPABASE_SERVICE_ROLE_KEY` para habilitar la creación administrativa de cuentas.

## Configuración local

1. Instala las dependencias:

   ```bash
   npm install
   ```

2. Crea un archivo `.env.local` en la raíz y configura las variables:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=tu_clave_publicable
   SUPABASE_SERVICE_ROLE_KEY=tu_clave_secreta_de_servidor
   ```

   La clave de servicio es secreta: **no** debe tener el prefijo `NEXT_PUBLIC_`, publicarse en Git ni usarse desde componentes de cliente. Las claves reales se deben obtener del proyecto Supabase y mantenerse fuera de la documentación y del repositorio.

3. Inicia el servidor de desarrollo:

   ```bash
   npm run dev
   ```

4. Abre [http://localhost:3000](http://localhost:3000).

Si cambias `.env.local` mientras el servidor está activo, reinicia el servidor para que Next.js cargue los nuevos valores.

## Comandos

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia Next.js en modo desarrollo. |
| `npm run lint` | Ejecuta ESLint. |
| `npm run build` | Genera la compilación de producción y valida TypeScript. |
| `npm run start` | Sirve la compilación de producción. |

## Asistentes utilizados

- **Claude** apoyó la comprensión del funcionamiento de Supabase y la evaluación de sus flujos de autenticación y acceso a datos.
- **GitHub Copilot**, como agente de escritura de código, apoyó la implementación, modificación y depuración de la aplicación.

Estas herramientas se utilizaron como asistentes durante el desarrollo; las decisiones, revisión y presentación del proyecto corresponden al trabajo académico del equipo.
