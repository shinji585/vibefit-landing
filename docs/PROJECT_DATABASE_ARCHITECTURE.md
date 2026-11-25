# VibeFit: Project and Database Architecture

This document describes the application structure and the Supabase database
objects used by the code in this repository. It distinguishes verified
repository behavior from database configuration that lives only in the hosted
Supabase project.

> **Important:** The repository does not contain migrations or a complete
> database schema for the main application. Table columns and relationships
> below are the ones observed in application queries and writes; they are not a
> substitute for the live schema. Triggers and RLS policies for the main tables
> cannot be confirmed from this repository and must be inspected in Supabase.

## 1. Product overview

VibeFit is a gym-management web application and landing page. It supports
pre-registration, account access, membership administration, attendance,
fitness tracking, workout routines, and meal plans.

The application is built with:

- Next.js App Router, React, and TypeScript.
- Supabase Auth for email/password and Google OAuth.
- Supabase/PostgreSQL for relational data.
- Tailwind CSS for styling.
- React Hook Form and Zod for form handling and validation.
- Framer Motion, Lottie, and Rive for interface animation.

## 2. Visual design and color structure

The current interface uses a mostly neutral palette with a few soft purple and
green accents. It is implemented through a combination of global CSS theme
tokens in `app/globals.css`, Tailwind color utilities, and component-level
hexadecimal values. This is the palette currently visible in the code, not a
separate formal brand specification.

| Color role | Current values/patterns | Usage |
|---|---|---|
| Core contrast | Black/near-black, white, and Tailwind `zinc` shades | Landing hero, navigation, typography, buttons, borders, and dashboard surfaces. |
| Dashboard canvas | `#f7f8fa` with `zinc-900` text | Main background for client, coach, nutritionist, manager, and reception dashboards. |
| Soft lavender | `#E3D9FC` and `#f7d9f5` | Decorative gradients in login and animated role illustrations. |
| Role-selection surfaces | `#faf9fc` and `#f3effb` | Background and alternating cards on the dashboard-role chooser. |
| Green accent | `#00c78a` | Dashboard loading indicator and selected dashboard chart accents. |
| Purple accent | `#4928C2` and `#7c3aed` | Testimonial decoration and selected chart data. |
| Status/data colors | For example `#059669`, `#2563eb`, and `#f59e0b` | Specific chart series and data visualization; not a single app-wide semantic mapping. |

`app/globals.css` defines shadcn-style CSS variables for background, foreground,
cards, primary/secondary, muted, accent, borders, destructive state, charts,
and sidebar colors. It also defines a `.dark` token set. However, many dashboard
surfaces currently use explicit light backgrounds and Tailwind `zinc` classes,
so the dark tokens alone do not mean every dashboard component supports a
complete dark theme.

The palette is not fully centralized: several pages use literal hex values and
Tailwind colors directly. For a consistent redesign, update the shared CSS
tokens and replace repeated one-off values with semantic theme utilities.

## 3. Repository map

| Path | Responsibility |
|---|---|
| `app/` | App Router pages, route handlers, and Server Actions. |
| `app/(public-pages)/` | Public landing page and its layout. |
| `app/actions/` | Server-side authentication and role-specific operations. |
| `app/auth/callback/` | Exchanges the OAuth authorization code for a Supabase session. |
| `app/*-dashboard/` | Entry pages that verify session, account status, and dashboard role. |
| `components/` | Landing sections, forms, dashboards, shared UI, and animations. |
| `sections/` | Reusable sections for the public landing page. |
| `lib/supabase/` | Browser, server, and admin Supabase client factories. |
| `lib/client-dashboard-data.ts` | Loads and shapes data for the client dashboard. |
| `lib/dashboard-roles.ts` | Maps role names to dashboard routes and multi-role selection. |
| `proxy.ts` | Refreshes Supabase cookies/claims on matching requests. It is not the only authorization check. |
| `scripts/` | Fitness test-data seed/import helpers. These are not database migrations. |
| `public/` | Images, video, fonts, and animation assets. |

### Main routes

| Route | Purpose |
|---|---|
| `/` | Public landing page and pre-registration form. |
| `/login` | Email/password sign-in, sign-up, and Google OAuth. |
| `/auth/callback` | Completes the OAuth/email callback and routes the user. |
| `/user-dashboard` | Legacy/general client entry that routes by role or shows pending status. |
| `/client-dashboard` | Client membership, routine, meal-plan, and fitness dashboard. |
| `/coach-dashboard` | Coach clients, routines, and routine assignments. |
| `/nutritionist-dashboard` | Client list and meal-plan management. |
| `/receptionist-dashboard` | Pre-registrations, memberships, and attendance. |
| `/manager-dashboard` | User/role management, plans, reporting, assignments, and audit history. |
| `/choose-dashboard` | Lets users who have multiple roles choose a dashboard. |

## 4. Backend and authentication structure

### Supabase clients

- `lib/supabase/client.ts` creates the browser client with
  `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- `lib/supabase/server.ts` creates a request-scoped server client and reads or
  writes the session cookies through Next.js.
- `lib/supabase/admin.ts` creates a server-only admin client using
  `SUPABASE_SERVICE_ROLE_KEY`. It returns no client if the required settings
  are missing. Never expose this key in browser code or a `NEXT_PUBLIC_` variable.
- `proxy.ts` calls `auth.getClaims()` and propagates refreshed auth cookies. The
  individual dashboard pages and Server Actions still need to enforce the
  relevant account and role rules.

### Sign-up and sign-in

1. The client calls Supabase Auth `signUp` for email/password registration,
   with `full_name` in user metadata and a callback URL.
2. Google sign-in starts OAuth and returns to `/auth/callback`.
3. The callback exchanges the code for a session, reads `user_roles`, and
   redirects to the role-appropriate dashboard.
4. Email/password sign-in is handled by `app/actions/auth.ts`. It checks the
   `users.account_status` and `user_roles` rows before redirecting.
5. Registration is a pre-registration only; it does not create a membership.
   The client remains pending until reception assigns an active membership.

The repository does not include the Auth email templates, provider settings,
or the database-side process that may create a profile and default role after
sign-up. Verify those in the Supabase dashboard.

### Server Actions

| File | Main responsibilities |
|---|---|
| `app/actions/auth.ts` | Sign-in validation, inactive-account rejection, sign-out. |
| `app/actions/client.ts` | Client dashboard loading and creation of a daily fitness log. |
| `app/actions/coach.ts` | Coach routine CRUD, routine-day management, assigning/finishing routines. |
| `app/actions/nutritionist.ts` | Nutritionist meal-plan creation, update, and completion. |
| `app/actions/reception.ts` | Reception authorization, client account creation, membership assignment, attendance registration. |
| `app/actions/manager.ts` | Manager authorization and administrator-created accounts/roles. |

Most dashboard data reads/writes use the request's authenticated Supabase
client, so PostgreSQL grants and RLS apply. Account creation uses the admin
client in server code; the service-role key bypasses RLS and must remain
server-only.

Some dashboard components also query or write with the browser client, notably
parts of manager reporting and management. Those operations rely on Supabase
grants and RLS just as any other browser request does.

## 5. Database model observed in the application

`auth.users` is Supabase Auth's identity table. The application uses its user
UUID as the identity referenced by the public application tables. `auth.users`
and other `auth` schema internals are managed by Supabase; the application
should normally create accounts through Auth APIs, not handwritten inserts.

The following objects are referenced by application code:

| Table | Role in the application and observed fields |
|---|---|
| `auth.users` | Supabase Auth account. Its UUID is used as the user identity. App code uses Auth APIs; the test seed SQL also contains direct writes to Auth internals and is a one-off fixture, not a production migration. |
| `public.users` | Application profile keyed by the Auth UUID (`id`). Observed fields include `full_name`, `email`, `created_at`, and `account_status`. |
| `public.user_roles` | Role assignments keyed by `user_id`; observed role strings include `client`, `coach`, `nutritionist`, `receptionist`, and `manager`. Some writes use `assigned_by_user_id`. |
| `public.membership_plans` | Plan catalogue; observed fields: `id`, `plan_name`, `price`, `duration_in_days`, and `created_at`. |
| `public.client_memberships` | Client-to-plan enrollment; observed fields include `client_user_id`, `membership_plan_id`, `assigned_by_user_id`, `membership_status`, `start_date`, and `end_date`. |
| `public.attendance_records` | Check-in history; observed fields include `client_user_id`, `registered_by_user_id`, and `attended_at`. |
| `public.audit_logs` | Manager audit history; observed fields include `changed_by_user_id`, `entity_name`, `entity_id`, `action_performed`, `previous_values`, `new_values`, and `changed_at`. |
| `public.client_coach_assignments` | Coach/client relationship using `coach_user_id` and `client_user_id`. The UI handles uniqueness and self-assignment errors returned by the database. |
| `public.routines` | Workout routine owned by a coach; observed fields include `coach_user_id`, `routine_title`, `routine_description`, and `created_at`. |
| `public.routine_days` | Day-by-day routine details; observed fields include `routine_id`, `day_number`, `day_title`, and `exercises_details`. The app upserts by `(routine_id, day_number)`. |
| `public.routine_assignments` | Routine assigned to a client; observed fields include `routine_id`, `client_user_id`, `assignment_status`, `start_date`, and `end_date`. |
| `public.meal_plans` | Nutrition plan linking `client_user_id` and `nutritionist_user_id`; observed fields include `plan_details`, `start_date`, `end_date`, and `meal_plan_status`. |
| `public.daily_logs` | Client fitness measures; observed fields: `client_user_id`, `log_date`, `weight_kg`, `sleep_hours`, `calories_consumed`, and `calories_burned`. The app handles a unique-violation response for a duplicate daily entry. |
| `public.fitness_tracker_test_details` | Supplemental test-data table described below. |

### Relationship sketch

```text
auth.users
  └── public.users (profile, same user UUID)
       ├── public.user_roles
       ├── public.client_memberships ── public.membership_plans
       ├── public.attendance_records
       ├── public.daily_logs
       ├── public.fitness_tracker_test_details
       ├── public.client_coach_assignments ── coach profile
       ├── public.routine_assignments ── public.routines ── public.routine_days
       └── public.meal_plans (client and nutritionist profiles)
```

This diagram summarizes relationships implied by foreign-key-style IDs in the
application. Confirm exact foreign keys, delete behavior, uniqueness, checks,
and indexes against the live database schema.

### Supplemental fitness test table

`scripts/fitness_tracker_test_details.sql` and
`scripts/fitness_tracker_seed.sql` define or use
`public.fitness_tracker_test_details`. Its fields are:

- `id`: generated UUID primary key.
- `client_user_id`: required reference to `auth.users(id)`, cascading on user deletion.
- `log_date`: required date.
- `workout_type`, `sleep_quality`, `activity_category`: optional text.
- `workout_duration_minutes`, `steps_count`: required nonnegative integers.
- `calories_per_minute`: optional nonnegative `numeric(12,4)`.
- `day_name`: required text.
- Unique pair: `(client_user_id, log_date)`.

The supplied SQL enables RLS, revokes table privileges from `PUBLIC`, `anon`,
and `authenticated`, and grants `SELECT`, `INSERT`, and `DELETE` to
`service_role`. It does not grant `UPDATE`. No user-facing RLS policy is
provided for this table. The test seed loads 50 fixture users and 1,000 daily
logs plus 1,000 details; use only against an intended test project.

## 6. Triggers and database functions

There are no `CREATE TRIGGER` or `CREATE FUNCTION` definitions for the main
application schema in this repository. The test seed's `DO` block is a
one-time anonymous PL/pgSQL block, not a trigger.

Consequently, this repository cannot confirm whether the hosted project has
triggers such as:

- An `auth.users` after-insert trigger to create `public.users`.
- A trigger to insert a default row in `public.user_roles`.
- Audit triggers that populate `public.audit_logs`.
- Any automatic membership, attendance, or updated-timestamp behavior.

The app's registration flow calls Supabase Auth and later expects profile and
role data to exist. Whether a trigger or another database process provisions
those rows must be checked in the target Supabase project. Do not assume a
trigger exists because a dashboard happens to show populated rows.

To inspect non-internal triggers in Supabase SQL Editor:

```sql
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  t.tgname AS trigger_name,
  pg_get_triggerdef(t.oid) AS trigger_definition
FROM pg_trigger AS t
JOIN pg_class AS c ON c.oid = t.tgrelid
JOIN pg_namespace AS n ON n.oid = c.relnamespace
WHERE NOT t.tgisinternal
  AND n.nspname IN ('auth', 'public')
ORDER BY n.nspname, c.relname, t.tgname;
```

## 7. Row Level Security (RLS) and authorization

### What is verifiable here

- The application checks sessions and account/role state in dashboard pages
  and relevant Server Actions.
- The browser client uses a publishable key; it is not an authorization
  boundary. Data protection must come from database grants and RLS.
- The service-role admin client is restricted to server-side account creation
  code and bypasses RLS.
- The test-details SQL explicitly enables RLS and restricts table grants as
  described above.
- The repository does **not** contain the complete RLS policy definitions for
  `users`, `user_roles`, memberships, attendance, routines, meal plans, or logs.

Therefore, this document does not claim that any specific hosted policy is
currently installed or correct. A passing UI role check alone does not secure
the Data API or a direct database request.

### Access model the policies must enforce

Use the authenticated user's UUID (`auth.uid()`) and relational ownership or
assignment records to scope access. Role membership alone is not enough to
authorize access to another person's row.

| Actor | Intended data boundary |
|---|---|
| Anonymous visitor | Public landing only; no access to private profile, membership, attendance, coaching, or health/fitness records. |
| Client | Own profile and role information as needed; own membership, routine/meal-plan information, daily logs, and test details only. |
| Coach | Their own routines and only clients connected through `client_coach_assignments`; writes must not let them change ownership to another coach. |
| Nutritionist | Their own meal plans and only permitted client context; plan writes must bind `nutritionist_user_id` to the authenticated user and restrict the client target. |
| Receptionist | Operational client, plan, membership, and attendance actions required by the job; must not gain unrestricted access to unrelated administrative data. |
| Manager | Administrative access required for account, role, plans, assignments, reports, and audit workflows. |
| Server admin client | Exceptional trusted server operations only; never send its secret key to a browser. |

This is the intended least-privilege model, not a listing of existing policies.
Before deployment, verify the live project policies against the actual schema
and application queries. Important policy properties:

- Enable RLS on every table exposed through the Data API.
- Grant only the SQL privileges needed; grants and RLS are separate checks.
- Use `TO authenticated` plus an ownership/assignment predicate; role alone
  does not prevent cross-user access.
- For `UPDATE`, use both `USING` and `WITH CHECK` to prevent changing ownership.
- Never use user-editable `user_metadata` as an authorization claim.
- Keep any `SECURITY DEFINER` functions narrow, non-public where possible, and
  explicitly authorized; they bypass normal RLS checks.
- Review views separately: views may bypass RLS unless configured to run with
  caller privileges where supported.

Inspect installed policies with:

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

Check whether public tables have RLS enabled:

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

## 8. Data workflows

### Client pre-registration and activation

1. A visitor registers through Supabase Auth.
2. The database-side profile/role provisioning mechanism, if configured, must
   create the corresponding application profile and client role.
3. The user has no membership yet and sees the pending state.
4. Reception assigns a valid plan. The app creates an active
   `client_memberships` row with start/end dates.
5. The client dashboard loads only after checking that the client has a
   currently active membership.

### Membership and attendance

- Membership validity is checked against the application date in
  `America/Bogota`, plus `membership_status = 'active'`.
- Reception checks that the target has exactly the client role and that the
  chosen plan has a positive duration.
- Attendance registration requires a currently valid membership and stores
  the registering user's ID and a timestamp.

### Coach routines

- A coach's clients are discovered through `client_coach_assignments`.
- A routine belongs to a coach and has one or more numbered `routine_days`.
- `routine_assignments` connects routines to clients and records active/finished
  status and dates.
- Server-side validation restricts day numbers to 1–7 and rejects duplicate
  day numbers within a submitted routine.

### Nutrition plans

- `meal_plans` connects a client and a nutritionist.
- The app validates plan text and ISO dates; the end date cannot precede the
  start date.
- Plans have an active/finished status and may have an open-ended end date.

### Client fitness tracking

- A client can submit a daily log for the current Bogota date.
- The server action validates weight, sleep, and calorie ranges before insert.
- The database should enforce uniqueness for one log per client/date; the app
  recognizes a unique-constraint error and reports a duplicate.

## 9. Configuration and local development

Create `.env.local` locally; do not commit it:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_server_only_secret
```

The admin key must never be exposed in a `NEXT_PUBLIC_` variable, browser
bundle, documentation, or source control. Rotate any key that has been
published or shared unintentionally.

```bash
npm install
npm run dev
npm run lint
npm run build
```

## 10. Database maintenance and source of truth

The repository currently has no `supabase/migrations/`, declarative schema
directory, or checked-in canonical schema for the primary application tables.
The SQL files under `scripts/` are data/test utilities, not a complete schema
history. Keep the following separate:

1. **Application contract:** what fields and operations the code expects.
2. **Hosted database state:** actual tables, constraints, grants, RLS policies,
   functions, and triggers in Supabase.
3. **Test fixtures:** one-off records/scripts used for demonstrations.

Before changing the database, capture or inspect the hosted schema and policy
state, then add a reviewed migration or equivalent schema source to the
repository. Do not infer production schema from the test seed.

## 11. Useful source files

- `README.md` — project overview and local setup.
- `app/actions/` — server-side business operations.
- `lib/supabase/` — Supabase client configuration.
- `lib/client-dashboard-data.ts` — client data-access flow.
- `lib/dashboard-roles.ts` — role-to-dashboard routing.
- `scripts/fitness_tracker_test_details.sql` — supplemental test table DDL.
- `scripts/fitness_tracker_seed.sql` — generated test fixture seed; test use only.
- `scripts/import_fitness_test_data.mjs` — test-data Auth/API importer.
