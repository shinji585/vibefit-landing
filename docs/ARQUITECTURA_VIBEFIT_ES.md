# VibeFit: arquitectura del proyecto y base de datos

**Documento técnico interno para preparar la documentación académica del proyecto.**
Está escrito para servir como fuente de contenido al elaborar el documento final
en Word. No contiene credenciales ni claves.

> **Alcance de la información:** este documento combina el código actual del
> repositorio con el esquema SQL, las definiciones de funciones compartidas y
> las capturas del panel de Supabase enviadas para esta documentación. Cuando
> una captura o definición no muestra el cuerpo completo de un objeto, se indica
> expresamente. Antes de usar este documento como especificación de producción,
> se deben resolver las diferencias indicadas en la sección de validaciones.

## 1. Descripción general

VibeFit es una aplicación web para la gestión de un gimnasio y el seguimiento
de sus clientes. Integra una landing pública, preinscripción, autenticación,
administración de cuentas y roles, membresías, asistencia, rutinas,
alimentación y seguimiento de métricas físicas.

El proyecto académico aplica conceptos de desarrollo web, bases de datos,
autenticación y gestión de procesos a un gimnasio. La interfaz y los mensajes
están principalmente en español.

### Tecnologías

- **Next.js 16 y App Router:** páginas, layouts, rutas de servidor, Server
  Actions y proxy de renovación de sesión.
- **React 19 y TypeScript:** componentes e interfaces.
- **Supabase Auth:** registro, inicio de sesión con correo y OAuth de Google.
- **Supabase PostgreSQL:** almacenamiento relacional, restricciones y lógica
  de base de datos.
- **`@supabase/ssr` y `@supabase/supabase-js`:** clientes Supabase de navegador,
  servidor y administración.
- **Tailwind CSS 4:** estilos.
- **React Hook Form y Zod:** formularios y validación.
- **Framer Motion, Lottie y Rive:** animaciones.
- **Lucide React:** iconos.
- **Lenis:** desplazamiento suave en la landing.

## 2. Estructura visual y colores

La interfaz usa una base neutra de negro, blanco y tonos `zinc`, con superficies
claras y acentos púrpura/lavanda y verde.

| Rol visual | Valores observados | Uso |
|---|---|---|
| Contraste principal | Negro, blanco y escala Tailwind `zinc` | Hero, navegación, botones, texto, bordes y tarjetas. |
| Fondo de dashboards | `#f7f8fa`, con texto `zinc-900` | Fondo principal de dashboards. |
| Lavanda suave | `#E3D9FC`, `#f7d9f5` | Gradientes decorativos en login e ilustraciones. |
| Selector de roles | `#faf9fc`, `#f3effb` | Fondo y tarjetas alternas del selector de dashboard. |
| Verde de acento | `#00c78a` | Indicador de carga y series de gráficos. |
| Púrpura | `#4928C2`, `#7c3aed` | Detalles de testimonios y gráficos. |
| Datos/estados | Por ejemplo `#059669`, `#2563eb`, `#f59e0b` | Series individuales de gráficas. |

`app/globals.css` define variables de tema para fondo, texto, tarjetas, estados,
bordes, gráficas y barra lateral, además de un conjunto `.dark`. Sin embargo,
varios dashboards usan fondos claros y colores de Tailwind o hexadecimales
directamente. Por esto, los tokens oscuros no implican que toda la aplicación
tenga un modo oscuro completo. La paleta todavía no está centralizada en su
totalidad.

## 3. Mapa del repositorio y rutas

| Ruta | Función |
|---|---|
| `app/(public-pages)/` | Landing pública. |
| `app/login/` | Inicio de sesión, registro y acceso con Google. |
| `app/auth/callback/` | Intercambia el código OAuth por una sesión y determina el destino. |
| `app/user-dashboard/` | Entrada heredada/general; deriva según roles y estado de membresía. |
| `app/client-dashboard/` | Panel del cliente. |
| `app/coach-dashboard/` | Panel del coach. |
| `app/nutritionist-dashboard/` | Panel del nutricionista. |
| `app/receptionist-dashboard/` | Panel de recepción. |
| `app/manager-dashboard/` | Panel de gerencia. |
| `app/choose-dashboard/` | Selector cuando el usuario tiene varios roles. |
| `app/actions/` | Server Actions para autenticación y operaciones de negocio. |
| `components/` | Formularios, dashboards, navegación, elementos UI y animaciones. |
| `sections/` | Secciones reutilizables de la landing. |
| `lib/supabase/` | Fábricas de clientes Supabase. |
| `lib/client-dashboard-data.ts` | Consultas y composición de datos del cliente. |
| `lib/dashboard-roles.ts` | Mapeo de roles a rutas. |
| `proxy.ts` | Actualización de cookies/claims de Supabase en las solicitudes. |
| `scripts/` | Importador y seeds de datos de prueba; no son migraciones completas. |
| `public/` | Recursos visuales, videos, fuentes y animaciones. |

### Responsabilidades por rol

Los valores del enum `role_name` son `receptionist`, `manager`, `coach`,
`client` y `nutritionist`.

- **Cliente:** consulta sus datos de progreso, membresía, rutina y plan de
  alimentación; puede registrar métricas diarias.
- **Coach:** gestiona rutinas y asignaciones de clientes.
- **Nutricionista:** administra planes de alimentación.
- **Recepcionista:** atiende preinscripciones, crea cuentas de clientes,
  asigna membresías y registra asistencia.
- **Gerente:** administra cuentas, roles y planes; consulta actividad,
  asignaciones, reportes y auditoría.

El registro no activa una membresía. La recepción asigna el plan y el cliente
ve el panel completo cuando su membresía está activa y vigente.

## 4. Backend y autenticación

### Clientes Supabase

- `lib/supabase/client.ts`: cliente de navegador con URL y clave publicable.
- `lib/supabase/server.ts`: cliente por solicitud con cookies de Next.js.
- `lib/supabase/admin.ts`: cliente administrativo solo del servidor con
  `SUPABASE_SERVICE_ROLE_KEY`. Esa clave evita RLS y no debe salir al navegador.
- `proxy.ts`: ejecuta `auth.getClaims()` y propaga cookies refrescadas. Las
  páginas y acciones también verifican las condiciones que necesitan.

### Flujos de autenticación

1. El registro llama `supabase.auth.signUp`, enviando el nombre como
   `raw_user_meta_data.full_name`.
2. El trigger `on_auth_user_created` llama `public.handle_new_auth_user()`.
3. La función compartida crea el perfil en `public.users` y asigna el rol
   predeterminado `client` en `public.user_roles`.
4. El callback valida el intercambio OAuth, consulta roles y enruta al dashboard.
5. El login con correo verifica sesión, `users.account_status` y roles.
6. La ruta de cliente comprueba que la cuenta esté activa y que el usuario
   tenga rol `client`; luego verifica la membresía vigente.

La versión final de `handle_new_auth_user()` compartida en el material también
usa como nombre alternativo la parte local del correo si el `full_name` está
vacío.

### Archivos de Server Actions

| Archivo | Responsabilidad |
|---|---|
| `app/actions/auth.ts` | Login, revisión de estado/roles y logout. |
| `app/actions/client.ts` | Datos del cliente y creación de `daily_logs`. |
| `app/actions/coach.ts` | Crear/editar rutinas y días; asignarlas y finalizarlas. |
| `app/actions/nutritionist.ts` | Crear, editar y finalizar planes de alimentación. |
| `app/actions/reception.ts` | Verificación de recepción, cuentas, membresías y asistencia. |
| `app/actions/manager.ts` | Verificación de gerencia y creación administrativa de cuentas/roles. |

Las lecturas y escrituras ordinarias usan clientes autenticados y dependen de
los permisos SQL y las políticas RLS. La creación administrativa de cuentas
usa el cliente de servicio dentro del servidor. Algunos módulos de dashboards
también usan el cliente de navegador para consultar o escribir; sus operaciones
deben quedar protegidas por grants y RLS.

## 5. Modelo relacional de la base de datos

### Tipos enumerados

| Tipo | Valores |
|---|---|
| `user_account_status` | `active`, `suspended` |
| `record_status` | `active`, `finished` |
| `role_name` | `receptionist`, `manager`, `coach`, `client`, `nutritionist` |

### Tablas

Las columnas siguientes proceden del SQL compartido. Se resumen los tipos,
defaults, restricciones y claves foráneas explícitos en ese material.

#### `public.users`

Perfil de aplicación uno a uno con una identidad de Supabase Auth.

| Columna | Tipo/propiedad |
|---|---|
| `id` | `uuid`, PK; FK a `auth.users(id)`. |
| `full_name` | `varchar NOT NULL`; no puede quedar vacío después de `trim`. |
| `email` | `varchar NOT NULL UNIQUE`; validación de formato por CHECK. |
| `account_status` | `user_account_status NOT NULL DEFAULT 'active'`. |
| `created_at`, `updated_at` | `timestamptz NOT NULL DEFAULT now()`. |

#### `public.user_roles`

Relación de roles, con clave primaria compuesta `(user_id, role)`.

| Columna | Tipo/propiedad |
|---|---|
| `user_id` | `uuid NOT NULL`; FK a `public.users(id)`. |
| `role` | `role_name NOT NULL`. |
| `assigned_by_user_id` | `uuid`; FK opcional a `public.users(id)`. |
| `assigned_at` | `timestamptz NOT NULL DEFAULT now()`. |

Índice parcial único compartido: `only_one_manager_allowed` sobre `role` cuando
`role = 'manager'`. Si está instalado como se muestra, limita a una fila de rol
`manager` en toda la tabla, es decir, a un gerente.

#### `public.client_coach_assignments`

Tabla puente entre coaches y clientes; PK compuesta
`(coach_user_id, client_user_id)`. Ambas columnas son `uuid NOT NULL` con FK a
`public.users(id)`. `assigned_at` es `timestamptz NOT NULL DEFAULT now()`.

El DDL adicional compartido declara un CHECK llamado
`coach_is_not_own_client` que exige que coach y cliente sean distintos. Ese
CHECK no aparece en el primer dump de la tabla y debe verificarse en el esquema
final.

#### `public.membership_plans`

Catálogo de planes.

| Columna | Tipo/propiedad |
|---|---|
| `id` | `uuid` PK, generado con `gen_random_uuid()`. |
| `plan_name` | `varchar NOT NULL UNIQUE`; texto no vacío. |
| `price` | `numeric NOT NULL CHECK (price > 0)`. |
| `duration_in_days` | `integer NOT NULL CHECK (duration_in_days > 0)`. |
| `created_at` | `timestamptz NOT NULL DEFAULT now()`. |

El DDL adicional especifica `numeric(12,2)` para `price`; el dump inicial solo
indica `numeric`. Confirmar la precisión real en Supabase.

#### `public.client_memberships`

Asocia un cliente con un plan y el usuario que lo asignó.

| Columna | Tipo/propiedad |
|---|---|
| `id` | `uuid` PK, `gen_random_uuid()`. |
| `client_user_id` | `uuid NOT NULL`; FK a `public.users(id)`. |
| `membership_plan_id` | `uuid NOT NULL`; FK a `public.membership_plans(id)`. |
| `assigned_by_user_id` | `uuid NOT NULL`; FK a `public.users(id)`. |
| `start_date`, `end_date` | `date NOT NULL`. |
| `membership_status` | `record_status NOT NULL DEFAULT 'active'`. |

El DDL adicional incluye `membership_dates_valid` (`end_date >= start_date`) y
un índice parcial único `only_one_active_membership_per_client` en
`client_user_id` cuando el estado es `active`. Esas dos reglas no aparecen en
el primer `CREATE TABLE`; confirmar que ambas están efectivamente instaladas.

#### `public.routines`

Rutina creada por un coach.

| Columna | Tipo/propiedad |
|---|---|
| `id` | `uuid` PK, `gen_random_uuid()`. |
| `coach_user_id` | `uuid NOT NULL`; FK a `public.users(id)`. |
| `routine_title` | `varchar NOT NULL`; no vacío. |
| `routine_description` | `text`, opcional. |
| `created_at`, `updated_at` | `timestamptz NOT NULL DEFAULT now()`. |

#### `public.routine_days`

Días y ejercicios pertenecientes a una rutina.

| Columna | Tipo/propiedad |
|---|---|
| `id` | `uuid` PK, `gen_random_uuid()`. |
| `routine_id` | `uuid NOT NULL`; FK a `public.routines(id)`. |
| `day_number` | `smallint NOT NULL`, CHECK de 1 a 7. |
| `day_title` | `varchar NOT NULL`, no vacío. |
| `exercises_details` | `text NOT NULL`, no vacío. |

El DDL adicional crea un índice único en `(routine_id, day_number)` y declara
`ON DELETE CASCADE` para la FK `routine_id`. Confirmar ambos en el esquema
final; el primer dump no los incluye en su definición de tabla.

#### `public.routine_assignments`

Asignación de una rutina a un cliente.

| Columna | Tipo/propiedad |
|---|---|
| `id` | `uuid` PK, `gen_random_uuid()`. |
| `routine_id` | `uuid NOT NULL`; FK a `public.routines(id)`. |
| `client_user_id` | `uuid NOT NULL`; FK a `public.users(id)`. |
| `assignment_status` | `record_status NOT NULL DEFAULT 'active'`. |
| `start_date` | `date NOT NULL`. |
| `end_date` | `date`, opcional. |

El DDL adicional declara `routine_assignment_dates_valid`: `end_date` debe ser
nulo o no anterior a `start_date`.

También declara el índice parcial `no_duplicate_active_routine_for_client`
sobre `(routine_id, client_user_id)` cuando `assignment_status = 'active'`.
Este índice evita asignar la misma rutina dos veces activamente al mismo
cliente; por sí solo **no** garantiza una sola rutina activa total por cliente.
El código de coach sí consulta si hay alguna asignación activa del cliente
antes de crear otra. Confirmar la regla deseada en base de datos.

#### `public.daily_logs`

Seguimiento diario del cliente.

| Columna | Tipo/propiedad |
|---|---|
| `id` | `uuid` PK, `gen_random_uuid()`. |
| `client_user_id` | `uuid NOT NULL`; FK a `public.users(id)`. |
| `log_date` | `date NOT NULL`. |
| `weight_kg` | `numeric NOT NULL`, CHECK de 20 a 300 kg. |
| `sleep_hours` | `numeric NOT NULL`, CHECK de 0 a 24. |
| `calories_consumed`, `calories_burned` | `integer NOT NULL`, cada uno no negativo. |
| `created_at` | `timestamptz NOT NULL DEFAULT now()`. |

El DDL adicional y la captura de índices muestran unicidad por
`(client_user_id, log_date)`, lo que permite como máximo un registro por cliente
y día. La acción cliente de la aplicación también maneja el error SQL de
duplicado.

#### `public.meal_plans`

Plan alimentario asociado a un cliente y a un nutricionista.

| Columna | Tipo/propiedad |
|---|---|
| `id` | `uuid` PK, `gen_random_uuid()`. |
| `client_user_id` | `uuid NOT NULL`; FK a `public.users(id)`. |
| `nutritionist_user_id` | `uuid NOT NULL`; FK a `public.users(id)`. |
| `plan_details` | `text NOT NULL`, no vacío. |
| `start_date` | `date NOT NULL`. |
| `end_date` | `date`, opcional. |
| `meal_plan_status` | `record_status NOT NULL DEFAULT 'active'`. |

El DDL adicional declara `meal_plan_dates_valid`, que permite una fecha final
nula o igual/posterior a la fecha inicial.

#### `public.attendance_records`

Registro de ingreso de un cliente.

| Columna | Tipo/propiedad |
|---|---|
| `id` | `uuid` PK, `gen_random_uuid()`. |
| `client_user_id` | `uuid NOT NULL`; FK a `public.users(id)`. |
| `registered_by_user_id` | `uuid NOT NULL`; FK a `public.users(id)`. |
| `attended_at` | `timestamptz NOT NULL`. |

#### `public.audit_logs`

Historial de operaciones administrativas.

| Columna | Tipo/propiedad |
|---|---|
| `id` | `uuid` PK, `gen_random_uuid()`. |
| `changed_by_user_id` | `uuid NOT NULL`; FK a `public.users(id)`. |
| `entity_name`, `entity_id` | `varchar NOT NULL`; `entity_name` no vacío. |
| `action_performed` | `varchar NOT NULL`; CHECK: `create`, `update` o `delete`. |
| `previous_values`, `new_values` | `jsonb`, opcionales. |
| `changed_at` | `timestamptz NOT NULL DEFAULT now()`. |

#### `public.fitness_tracker_test_details`

Tabla complementaria para los datos de prueba de actividad.

| Columna | Tipo/propiedad |
|---|---|
| `id` | `uuid` PK, `gen_random_uuid()`. |
| `client_user_id` | `uuid NOT NULL`; el dump compartido indica FK a `auth.users(id)`. |
| `log_date` | `date NOT NULL`. |
| `workout_type`, `sleep_quality`, `activity_category` | `text`, opcionales. |
| `workout_duration_minutes`, `steps_count` | `integer NOT NULL`, no negativos. |
| `calories_per_minute` | `numeric`, opcional, no negativo si se informa. |
| `day_name` | `text NOT NULL`. |

La captura de índices muestra una restricción/índice único
`fitness_tracker_test_details_client_date_key` sobre
`(client_user_id, log_date)`. El archivo `scripts/fitness_tracker_test_details.sql`
también declara esa unicidad y RLS. Confirmar que el FK apunte al esquema
intencionado: las demás tablas de aplicación referencian `public.users(id)`,
mientras el dump de esta tabla apunta directamente a `auth.users(id)`.

### Índices únicos adicionales compartidos

Además de claves primarias y `UNIQUE` en columnas, el DDL y las capturas
muestran:

| Índice | Definición/efecto |
|---|---|
| `only_one_manager_allowed` | Único sobre `user_roles(role)` con filtro `role = 'manager'`. |
| Índice de `routine_days` | Único sobre `(routine_id, day_number)`. |
| Índice de `daily_logs` | Único sobre `(client_user_id, log_date)`. |
| `only_one_active_membership_per_client` | Único sobre `client_memberships(client_user_id)` cuando el estado es `active`. |
| `no_duplicate_active_routine_for_client` | Único sobre `(routine_id, client_user_id)` cuando la asignación está `active`. |
| `fitness_tracker_test_details_client_date_key` | Único sobre `(client_user_id, log_date)`. |

Las capturas pueden no mostrar la lista completa de índices. Consultar el
catálogo de Supabase/PostgreSQL para confirmar todos los objetos instalados.

## 6. Funciones, triggers y extensiones

### Trigger de creación de cuenta

El trigger `on_auth_user_created` se ejecuta **después de insertar** una fila en
`auth.users`, una vez por cada fila. Llama a
`public.handle_new_auth_user()`.

La definición final compartida de la función:

1. Se declara como `RETURNS trigger`, en PL/pgSQL.
2. Usa `SECURITY DEFINER` y `SET search_path = ''`.
3. Inserta el UUID, nombre y correo en `public.users`.
4. Obtiene el nombre de `raw_user_meta_data.full_name`; si está vacío, usa la
   parte anterior a `@` del correo.
5. Inserta el rol inicial `client` en `public.user_roles`.
6. Devuelve `NEW`.

Los dos fragmentos compartidos muestran una primera versión que inserta solo
el perfil y una segunda `CREATE OR REPLACE FUNCTION` que añade la asignación
del rol. La documentación describe la versión final combinada. La creación
del trigger se muestra una sola vez; volver a ejecutar sin control un
`CREATE TRIGGER` con el mismo nombre puede dar error porque ya existe.

Al ser `SECURITY DEFINER`, la función corre con los privilegios de su dueño y
puede eludir RLS en las tablas que modifica. El `search_path` vacío y las
referencias cualificadas `public.users`/`public.user_roles` reducen riesgos de
resolución de nombres. Se debe restringir quién puede ejecutar funciones
privilegiadas y probar el flujo de registro en el proyecto correcto.

### Funciones de ayuda de autorización

La captura del panel de Supabase muestra estas funciones en `public`; la
columna Security indica `Definer`:

| Función | Argumento(s) mostrado(s) | Retorno | Observación |
|---|---|---|---|
| `current_coach_has_client` | `client_id uuid` | `boolean` | Nombre sugiere una comprobación de relación coach-cliente; confirmar el cuerpo SQL. |
| `current_user_has_role` | `required_role role_name` | `boolean` | Nombre sugiere una comprobación de rol del usuario actual; confirmar el cuerpo SQL. |
| `current_user_is_active` | ninguno | `boolean` | Nombre sugiere comprobación de `account_status`; confirmar el cuerpo SQL. |

Los nombres y firmas no bastan para asegurar qué tablas consulta cada función,
qué rol usa ni qué casos cubre. Obtener el cuerpo exacto antes de describirlas
como regla definitiva de autorización.

### Auditoría

La captura de triggers muestra estos triggers habilitados, de orientación
`ROW`, que ejecutan `public.log_audit()`:

| Trigger | Tabla | Eventos |
|---|---|---|
| `audit_membership_plans` | `membership_plans` | `AFTER INSERT`, `AFTER UPDATE`, `AFTER DELETE`. |
| `audit_user_roles` | `user_roles` | `AFTER INSERT`, `AFTER UPDATE`, `AFTER DELETE`. |
| `audit_users` | `users` | `AFTER UPDATE`. |

`public.audit_logs` almacena el actor, entidad, identificador, acción, valores
anteriores/nuevos y fecha del evento. El cuerpo de `log_audit()` no fue
compartido; no se puede confirmar cómo obtiene el actor ni cómo representa
`OLD`/`NEW`. La lista tampoco muestra triggers para todas las demás tablas.

### Trigger de evento para RLS

La captura de funciones muestra `rls_auto_enable`, tipo `event_trigger`, con
seguridad `Definer`. El nombre sugiere automatización para habilitar RLS, pero
no se compartieron el evento DDL al que está asociado ni el cuerpo de la
función. No se debe inferir qué esquemas/tablas cubre hasta inspeccionarlos.

### Extensiones visibles

La captura de extensiones muestra habilitadas:

| Extensión | Versión mostrada | Uso/nota |
|---|---:|---|
| `plpgsql` | 1.0 | Lenguaje procedimental de PostgreSQL, usado por funciones/triggers. |
| `uuid-ossp` | 1.1 | Generación de UUID mediante funciones de esa extensión. |
| `pg_stat_statements` | 1.11 | Estadísticas de planificación/ejecución SQL. |
| `pgcrypto` | 1.3 | Funciones criptográficas. |

El esquema usa `gen_random_uuid()` como default. Confirmar la función efectiva
que resuelve PostgreSQL en el proyecto y su versión; el esquema puede disponer
de ella como función integrada o mediante extensión.

## 7. RLS y autorización

### Lo que se puede afirmar

- El proyecto presenta funciones helper de seguridad `SECURITY DEFINER`
  relacionadas por nombre con rol, estado activo y relación coach-cliente.
- El panel muestra el event trigger `rls_auto_enable`; su operación concreta no
  puede verificarse solo con el nombre.
- El archivo SQL de `fitness_tracker_test_details` habilita RLS y revoca
  privilegios a `PUBLIC`, `anon` y `authenticated`; concede `SELECT`, `INSERT`
  y `DELETE` a `service_role`.
- No se compartió el listado de las políticas instaladas tabla por tabla.

Por tanto, este documento no afirma una matriz exacta de policies activas.
Los checks de rol de las páginas/acciones no sustituyen a RLS: un cliente
publicable puede llamar a la Data API directamente con la sesión del usuario.
Los permisos SQL y las policies RLS deben restringir los datos incluso fuera
de la interfaz.

### Modelo de acceso que las policies deben hacer cumplir

| Actor | Límite que debe imponer la base |
|---|---|
| Visitante anónimo | Sin acceso a perfiles privados, membresías, asistencia, rutinas asignadas, planes nutricionales ni métricas. |
| Cliente | Solo su perfil y sus registros; solo datos de otros actores que la app necesite mostrar de forma explícita. |
| Coach | Rutinas propias; acceso de cliente limitado por `client_coach_assignments`. |
| Nutricionista | Planes propios y contexto de cliente estrictamente necesario; `nutritionist_user_id` debe corresponder al usuario actual. |
| Recepcionista | Operaciones de atención, clientes, membresías y asistencia necesarias para su función. |
| Gerente | Operaciones de administración, reportes, roles, planes, asignaciones y auditoría autorizadas. |
| Cliente de servicio | Operaciones excepcionales de servidor; la clave no puede exponerse al navegador. |

Al definir o auditar policies:

- Aplicar `TO authenticated` junto con predicados de propiedad o asignación;
  el rol `authenticated` por sí solo no autoriza el acceso a otras personas.
- Para `UPDATE`, usar tanto `USING` como `WITH CHECK`, evitando reasignaciones
  de propietario o de actor.
- No usar `raw_user_meta_data`/`user_metadata` como fuente de autorización,
  pues son datos editables por el usuario.
- Las funciones `SECURITY DEFINER` deben tener un propósito acotado, comprobar
  el actor correctamente y limitar sus privilegios de ejecución.
- Revisar grants además de RLS: una policy no sustituye el privilegio SQL.
- Revisar vistas por separado, porque su comportamiento puede no aplicar RLS
  como se espera si no se configuran para invocador.

## 8. Flujos principales de datos

### Registro y preinscripción

1. La persona envía nombre, correo y contraseña mediante Supabase Auth.
2. `on_auth_user_created` ejecuta la función de perfil/rol.
3. Se crean `public.users` y `public.user_roles(role = 'client')`.
4. No se crea una membresía automáticamente.
5. Recepción asigna un plan mediante `client_memberships`.

### Membresía y asistencia

- La app usa fechas del huso `America/Bogota` para determinar vigencia.
- La membresía se considera vigente con estado `active`, inicio no posterior a
  hoy y fin no anterior a hoy.
- La asignación requiere rol `client`, plan con duración positiva y ausencia de
  una membresía activa no vencida.
- Para registrar asistencia, recepción verifica membresía vigente y agrega
  `client_user_id`, `registered_by_user_id` y `attended_at`.

### Rutinas

- El coach crea una fila en `routines` y sus hijos en `routine_days`.
- Los días se numeran del 1 al 7 y tienen título y ejercicios obligatorios.
- `routine_assignments` une rutina y cliente, y maneja estado/fechas.
- La acción de coach consulta asignaciones activas antes de crear otra.

### Planes nutricionales

- `meal_plans` enlaza cliente y nutricionista.
- Se valida el detalle, las fechas y que fin no preceda al inicio.
- Se permite `end_date` nulo.
- El estado cambia de `active` a `finished` al terminar el plan.

### Seguimiento diario

- `daily_logs` almacena peso, sueño y calorías por cliente/fecha.
- La acción cliente valida los rangos antes del insert.
- El índice `(client_user_id, log_date)` evita entradas duplicadas por día.
- La fecha de registro se calcula en `America/Bogota`.

## 9. Consultas para validar el proyecto Supabase

Estas consultas son de inspección para SQL Editor; no modifican datos.

### Triggers instalados

```sql
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  t.tgname AS trigger_name,
  pg_get_triggerdef(t.oid) AS trigger_definition,
  pg_get_functiondef(t.tgfoid) AS function_definition
FROM pg_trigger AS t
JOIN pg_class AS c ON c.oid = t.tgrelid
JOIN pg_namespace AS n ON n.oid = c.relnamespace
WHERE NOT t.tgisinternal
  AND n.nspname IN ('auth', 'public')
ORDER BY n.nspname, c.relname, t.tgname;
```

### Policies RLS instaladas

```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname IN ('public', 'auth')
ORDER BY schemaname, tablename, policyname;
```

### Estado RLS en tablas públicas

```sql
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced
FROM pg_class AS c
JOIN pg_namespace AS n ON n.oid = c.relnamespace
WHERE c.relkind IN ('r', 'p')
  AND n.nspname = 'public'
ORDER BY c.relname;
```

### Índices instalados

```sql
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

## 10. Configuración de desarrollo

Las variables se guardan localmente en `.env.local`; nunca se documentan sus
valores reales ni se suben al repositorio:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_server_only_secret
```

La clave de servicio no debe llevar prefijo `NEXT_PUBLIC_` ni usarse desde
componentes de navegador.

```bash
npm install
npm run dev
npm run lint
npm run build
```

## 11. Diferencias que se deben confirmar

Se compartieron un dump de tablas, otro bloque DDL y capturas del panel. Hay
detalles que no coinciden entre esos materiales y se deben verificar contra
los catálogos del proyecto:

1. **`handle_new_auth_user`:** se compartió una primera versión que inserta el
   perfil y una versión reemplazada que también inserta el rol `client`. Este
   documento describe la última.
2. **Restricciones de membresías:** el DDL adicional muestra fechas válidas y
   un solo estado `active` por cliente; el primer `CREATE TABLE` no las incluye.
3. **Días de rutina:** el DDL adicional añade unicidad por rutina/día y cascada
   al borrar rutina; el primer dump no las muestra.
4. **Rutinas activas:** el índice suministrado incluye `(routine_id,
   client_user_id)`, por lo que no impone por sí solo una única rutina activa
   entre todas las rutinas de un cliente.
5. **Detalles fitness:** el dump referencia `auth.users`; la tabla de negocio
   restante usa perfiles `public.users`. Verificar si el FK debería apuntar a
   `public.users` y confirmar índice único por cliente/fecha.
6. **Funciones de seguridad:** se ven nombres, argumentos y `SECURITY DEFINER`,
   pero faltan cuerpos SQL de `current_coach_has_client`,
   `current_user_has_role`, `current_user_is_active`, `log_audit` y
   `rls_auto_enable`.
7. **Policies RLS:** falta el inventario real de policies por tabla; no se puede
   afirmar acceso concreto sin esa salida.
8. **Auditoría:** se ven triggers para planes, roles y actualizaciones de
   usuarios; confirmar el cuerpo de `log_audit` y si existen otros triggers.

## 12. Archivos relacionados

- `README.md`: información general y comandos del proyecto.
- `app/actions/`: operaciones de negocio.
- `lib/supabase/`: clientes de Supabase.
- `lib/client-dashboard-data.ts`: consultas del dashboard del cliente.
- `lib/dashboard-roles.ts`: rutas por rol.
- `scripts/fitness_tracker_test_details.sql`: DDL de tabla complementaria.
- `scripts/fitness_tracker_seed.sql`: seed de demostración; solo para proyecto de prueba.
- `docs/DIAGRAMAS_VIBEFIT_PLANTUML.md`: diagramas editables en PlantUML, sin imágenes.
