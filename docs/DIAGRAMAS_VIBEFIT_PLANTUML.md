# Diagramas PlantUML de VibeFit

Documento auxiliar con código PlantUML editable para que los diagramas se
rendericen manualmente. **No contiene imágenes generadas.** Los bloques
representan la arquitectura y el esquema descritos en
[`ARQUITECTURA_VIBEFIT_ES.md`](./ARQUITECTURA_VIBEFIT_ES.md).

## 1. Arquitectura de componentes

```plantuml
@startuml VibeFit_Componentes
left to right direction
skinparam componentStyle rectangle
skinparam packageStyle rectangle

actor "Visitante / usuario" as visitor
cloud "Google OAuth" as google

package "Navegador" {
  component "Landing y formularios\nReact / Next.js" as browser_ui
  component "Cliente Supabase\n@supabase/ssr" as browser_client
}

package "Aplicación Next.js" {
  component "App Router\nPages / Layouts" as app_router
  component "Server Actions\n(auth, client, coach,\nnutritionist, reception,\nmanager)" as actions
  component "Proxy de sesión\nproxy.ts" as session_proxy
  component "Cliente Supabase\nSSR por solicitud" as server_client
  component "Cliente Admin\nserver-only" as admin_client
}

cloud "Supabase Auth" as auth
database "Supabase PostgreSQL\nschema public + auth" as postgres

visitor --> browser_ui
browser_ui --> browser_client
browser_client --> auth : signUp / signIn / OAuth
browser_client --> postgres : Data API con clave publicable\n+ JWT de usuario
google <--> auth : OAuth
visitor --> app_router : solicitudes HTTP
app_router --> session_proxy : claims / cookies
app_router --> server_client
actions --> server_client : operaciones autenticadas
server_client --> auth
server_client --> postgres : privilegios + RLS
actions --> admin_client : crear cuentas Auth
admin_client --> auth : Admin API

note right of admin_client
Solo servidor.
La clave administrativa es secreta
y evita las policies RLS.
end note
@enduml
```

## 2. Modelo entidad-relación

```plantuml
@startuml VibeFit_ERD
hide circle
skinparam linetype ortho
skinparam entity {
  BackgroundColor #FAF9FC
  BorderColor #4B5563
}

entity "auth.users" as auth_users {
  * id : uuid <<PK>>
  --
  email : text
  raw_user_meta_data : jsonb
}

entity "public.users" as users {
  * id : uuid <<PK, FK auth.users>>
  --
  full_name : varchar
  email : varchar <<UNIQUE>>
  account_status : user_account_status
  created_at : timestamptz
  updated_at : timestamptz
}

entity "public.user_roles" as user_roles {
  * user_id : uuid <<PK, FK users>>
  * role : role_name <<PK>>
  --
  assigned_by_user_id : uuid <<FK users>>
  assigned_at : timestamptz
}

entity "public.membership_plans" as membership_plans {
  * id : uuid <<PK>>
  --
  plan_name : varchar <<UNIQUE>>
  price : numeric
  duration_in_days : integer
  created_at : timestamptz
}

entity "public.client_memberships" as client_memberships {
  * id : uuid <<PK>>
  --
  client_user_id : uuid <<FK users>>
  membership_plan_id : uuid <<FK membership_plans>>
  assigned_by_user_id : uuid <<FK users>>
  start_date : date
  end_date : date
  membership_status : record_status
}

entity "public.attendance_records" as attendance_records {
  * id : uuid <<PK>>
  --
  client_user_id : uuid <<FK users>>
  registered_by_user_id : uuid <<FK users>>
  attended_at : timestamptz
}

entity "public.daily_logs" as daily_logs {
  * id : uuid <<PK>>
  --
  client_user_id : uuid <<FK users>>
  log_date : date
  weight_kg : numeric
  sleep_hours : numeric
  calories_consumed : integer
  calories_burned : integer
  created_at : timestamptz
}

entity "public.fitness_tracker_test_details" as test_details {
  * id : uuid <<PK>>
  --
  client_user_id : uuid <<FK auth.users>>
  log_date : date
  workout_type : text
  workout_duration_minutes : integer
  steps_count : integer
  sleep_quality : text
  calories_per_minute : numeric
  day_name : text
  activity_category : text
}

entity "public.client_coach_assignments" as coach_assignments {
  * coach_user_id : uuid <<PK, FK users>>
  * client_user_id : uuid <<PK, FK users>>
  --
  assigned_at : timestamptz
}

entity "public.routines" as routines {
  * id : uuid <<PK>>
  --
  coach_user_id : uuid <<FK users>>
  routine_title : varchar
  routine_description : text
  created_at : timestamptz
  updated_at : timestamptz
}

entity "public.routine_days" as routine_days {
  * id : uuid <<PK>>
  --
  routine_id : uuid <<FK routines>>
  day_number : smallint
  day_title : varchar
  exercises_details : text
}

entity "public.routine_assignments" as routine_assignments {
  * id : uuid <<PK>>
  --
  routine_id : uuid <<FK routines>>
  client_user_id : uuid <<FK users>>
  assignment_status : record_status
  start_date : date
  end_date : date?
}

entity "public.meal_plans" as meal_plans {
  * id : uuid <<PK>>
  --
  client_user_id : uuid <<FK users>>
  nutritionist_user_id : uuid <<FK users>>
  plan_details : text
  start_date : date
  end_date : date?
  meal_plan_status : record_status
}

entity "public.audit_logs" as audit_logs {
  * id : uuid <<PK>>
  --
  changed_by_user_id : uuid <<FK users>>
  entity_name : varchar
  entity_id : varchar
  action_performed : varchar
  previous_values : jsonb?
  new_values : jsonb?
  changed_at : timestamptz
}

auth_users ||--|| users : "perfil"
users ||--o{ user_roles : "roles"
users ||--o{ user_roles : "asignado por"
membership_plans ||--o{ client_memberships : "plan"
users ||--o{ client_memberships : "cliente"
users ||--o{ client_memberships : "asignó"
users ||--o{ attendance_records : "cliente"
users ||--o{ attendance_records : "registró"
users ||--o{ daily_logs : "seguimientos"
auth_users ||--o{ test_details : "detalles de prueba"
users ||--o{ coach_assignments : "coach"
users ||--o{ coach_assignments : "cliente"
users ||--o{ routines : "crea"
routines ||--o{ routine_days : "días"
routines ||--o{ routine_assignments : "asignada"
users ||--o{ routine_assignments : "cliente"
users ||--o{ meal_plans : "cliente"
users ||--o{ meal_plans : "nutricionista"
users ||--o{ audit_logs : "actor"

note bottom of test_details
El dump compartido apunta este FK a auth.users.
Confirmar contra Supabase si debería apuntar a public.users.
end note

note bottom of routine_assignments
El índice parcial compartido es único por
(routine_id, client_user_id) para estado active.
No asegura por sí solo una sola rutina activa
entre todas las rutinas de un cliente.
end note
@enduml
```

## 3. Registro de usuario y trigger de perfil/rol

```plantuml
@startuml VibeFit_Registro
actor "Persona" as person
participant "Formulario Next.js" as form
participant "Supabase Auth" as auth
participant "Trigger\non_auth_user_created" as trigger
participant "Función\nhandle_new_auth_user()" as handler
database "public.users" as users
database "public.user_roles" as roles

person -> form : Envía nombre, email y contraseña
form -> auth : auth.signUp(..., user_metadata.full_name)
auth -> trigger : INSERT en auth.users
trigger -> handler : AFTER INSERT, FOR EACH ROW
handler -> users : INSERT perfil (id, full_name, email)
note right of handler
full_name se obtiene de raw_user_meta_data.
Si está vacío, usa la parte del email
anterior a @.
end note
handler -> roles : INSERT (user_id, role = client)
handler --> trigger : RETURN NEW
auth --> form : Usuario / sesión o verificación
form --> person : Mensaje de preinscripción

note over users, roles
El trigger no asigna membresías.
Recepción realiza ese paso después.
end note
@enduml
```

## 4. Autenticación y selección de dashboard

```plantuml
@startuml VibeFit_Acceso
actor Usuario as user
participant "Next.js /login" as login
participant "Supabase Auth" as auth
participant "Route Handler\n/auth/callback" as callback
database "public.users" as profiles
database "public.user_roles" as roles
participant "Dashboard de rol" as dashboard

alt Email y contraseña
  user -> login : Email + password
  login -> auth : signInWithPassword
  auth --> login : sesión y user
  login -> profiles : Leer account_status
  login -> roles : Leer roles del usuario
  alt Cuenta activa
    login -> dashboard : Redirigir por rol
  else Cuenta suspendida o sin perfil activo
    login --> user : Rechazar acceso
  end
else Google OAuth
  user -> login : Continuar con Google
  login -> auth : signInWithOAuth
  auth --> callback : code de autorización
  callback -> auth : exchangeCodeForSession(code)
  callback -> roles : Leer roles del usuario
  alt Un rol
    callback -> dashboard : Abrir dashboard correspondiente
  else Varios roles
    callback --> user : /choose-dashboard
  end
end
@enduml
```

## 5. Asignación de membresía y acceso del cliente

```plantuml
@startuml VibeFit_Membresia
actor Recepcionista as reception
participant "Server Action\nassignReceptionMembership" as action
database "public.user_roles" as roles
database "public.membership_plans" as plans
database "public.client_memberships" as memberships
actor Cliente as client
participant "Página /client-dashboard" as page

reception -> action : Selecciona cliente y plan
action -> roles : Verificar rol único client
action -> plans : Obtener plan y duración
action -> memberships : Buscar membresías active
alt Ya tiene membresía vigente
  action --> reception : No asignar una segunda
else No tiene membresía vigente
  action -> memberships : Finalizar expiradas
  action -> memberships : INSERT active con fechas
  action --> reception : Confirmar asignación
end

client -> page : Solicita dashboard
page -> roles : Verificar rol client
page -> memberships : Buscar estado active y fechas vigentes
alt Membresía vigente
  page --> client : Dashboard de cliente
else Sin membresía vigente
  page --> client : Estado pendiente
end
@enduml
```

## 6. Auditoría por triggers

```plantuml
@startuml VibeFit_Auditoria
actor "Operación autorizada" as actor
database "membership_plans" as plans
database "user_roles" as roles
database "users" as users
participant "Triggers AFTER ROW" as triggers
participant "public.log_audit()" as audit_function
database "public.audit_logs" as audit_logs

actor -> plans : INSERT / UPDATE / DELETE
plans -> triggers : audit_membership_plans
triggers -> audit_function : Ejecutar

actor -> roles : INSERT / UPDATE / DELETE
roles -> triggers : audit_user_roles
triggers -> audit_function : Ejecutar

actor -> users : UPDATE
users -> triggers : audit_users
triggers -> audit_function : Ejecutar

audit_function -> audit_logs : Registrar acción y valores

note right of audit_function
La captura confirma tablas, eventos y función,
pero no se compartió el cuerpo de log_audit().
Confirmar cómo identifica actor, OLD y NEW.
end note
@enduml
```

## 7. RLS y funciones auxiliares

Este diagrama describe los componentes de autorización observados y los
límites que deben imponerse. No representa policies concretas, porque no se
compartió el inventario de policies del proyecto.

```plantuml
@startuml VibeFit_RLS
left to right direction
actor "Usuario autenticado" as auth_user
component "JWT / auth.uid()" as claims
component "Policies RLS\npor tabla y operación" as policies
component "current_user_has_role(role)" as role_fn
component "current_user_is_active()" as active_fn
component "current_coach_has_client(client_id)" as coach_fn
database "Tablas public" as db
component "Cliente service_role\nsolo servidor" as service

auth_user --> claims : Sesión Supabase
claims --> policies : Identidad actual
policies --> role_fn : Comprobar rol requerido
policies --> active_fn : Comprobar cuenta activa
policies --> coach_fn : Comprobar relación coach-cliente
policies --> db : Permitir solo filas autorizadas
service --> db : Operación privilegiada\nbypassa RLS

note bottom of policies
La captura muestra helpers SECURITY DEFINER,
pero no las definiciones de policies ni cuerpos.
No asumir acceso real por rol sin verificar pg_policies.
end note

note bottom of service
No exponer claves secret/service_role
en cliente, HTML ni NEXT_PUBLIC_*.
end note
@enduml
```

## 8. Tipos y restricciones representados

```plantuml
@startuml VibeFit_Enums
hide empty members

enum user_account_status {
  active
  suspended
}

enum record_status {
  active
  finished
}

enum role_name {
  receptionist
  manager
  coach
  client
  nutritionist
}

note right of user_account_status
Usado por public.users.account_status
end note

note right of record_status
Usado por membresías, rutinas
y planes de alimentación
end note

note right of role_name
Usado por public.user_roles.role
end note
@enduml
```

## Notas para renderizar

- Cada bloque es una fuente PlantUML independiente y puede copiarse a un
  archivo `.puml`.
- Los diagramas no son imágenes incrustadas ni se renderizan automáticamente.
- El ERD muestra las claves foráneas informadas. Las discrepancias de índices,
  constraints y la FK de `fitness_tracker_test_details` están anotadas para
  evitar dar por válido un esquema ambiguo.
