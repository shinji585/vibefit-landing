#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const workbookPath = process.argv[2];
const apply = process.argv.includes("--apply");
const confirmIndex = process.argv.indexOf("--confirm-test-project");
const confirmedProjectRef =
  confirmIndex >= 0 ? process.argv[confirmIndex + 1] : undefined;

if (!workbookPath) {
  throw new Error(
    "Uso: node scripts/import_fitness_test_data.mjs archivo.xlsx [--apply --confirm-test-project REF]",
  );
}

const preparedJson = execFileSync(
  "python3",
  [path.join(scriptDirectory, "prepare_fitness_test_data.py"), workbookPath],
  { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 },
);
const prepared = JSON.parse(preparedJson);

if (
  prepared.users.length !== 50 ||
  prepared.daily_logs.length !== 1000 ||
  prepared.activity_details.length !== 1000
) {
  throw new Error("El contenido preparado no coincide con las cantidades esperadas.");
}

const firstNames = [
  "Camilo",
  "Valentina",
  "Juan",
  "Laura",
  "Mateo",
  "Mariana",
  "Santiago",
  "Isabella",
  "Daniel",
  "Sofia",
];
const surnames = ["Zuluaga", "Rojas", "Pineda", "Mendoza", "Salazar"];
const testUsers = prepared.users.map(({ source_id: sourceId, user_number: number }) => {
  const firstName = firstNames[(number - 1) % firstNames.length];
  const surname = surnames[Math.floor((number - 1) / firstNames.length)];
  const suffix = String(number).padStart(3, "0");
  return {
    sourceId,
    userNumber: number,
    fullName: `${firstName} ${surname} (Prueba ${suffix})`,
    email: `vibefit-test-${suffix}@example.test`,
  };
});

const yearCounts = Object.fromEntries(
  prepared.users.reduce((counts, user) => {
    counts.set(user.year, (counts.get(user.year) ?? 0) + 1);
    return counts;
  }, new Map()),
);

if (!apply) {
  console.log(
    JSON.stringify(
      {
        mode: "dry-run",
        users: testUsers.length,
        dailyLogs: prepared.daily_logs.length,
        activityDetails: prepared.activity_details.length,
        usersByYear: yearCounts,
        dateRange: [
          prepared.daily_logs
            .map(({ log_date: logDate }) => logDate)
            .sort()[0],
          prepared.daily_logs
            .map(({ log_date: logDate }) => logDate)
            .sort()
            .at(-1),
        ],
        malformedWorkoutTypesChangedToNull: prepared.activity_details.filter(
          ({ workout_type: workoutType }) => workoutType === null,
        ).length,
        generatedEmailsUseReservedTestDomain: true,
        writesPerformed: false,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

const supabaseUrl = process.env.SUPABASE_TEST_URL;
const serviceRoleKey = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;
const projectRef = process.env.SUPABASE_TEST_PROJECT_REF;
if (!supabaseUrl || !serviceRoleKey || !projectRef) {
  throw new Error(
    "Define SUPABASE_TEST_URL, SUPABASE_TEST_SERVICE_ROLE_KEY y SUPABASE_TEST_PROJECT_REF.",
  );
}
if (confirmedProjectRef !== projectRef) {
  throw new Error(
    "Confirma el proyecto de pruebas con --confirm-test-project y el mismo project ref.",
  );
}
if (new URL(supabaseUrl).hostname !== `${projectRef}.supabase.co`) {
  throw new Error("La URL no coincide con SUPABASE_TEST_PROJECT_REF.");
}
if (
  process.env.SUPABASE_PRODUCTION_PROJECT_REF &&
  projectRef === process.env.SUPABASE_PRODUCTION_PROJECT_REF
) {
  throw new Error("Se rechazó la carga: el proyecto indicado es producción.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const createdUsers = [];

async function removeCreatedFixtures() {
  if (!createdUsers.length) return;
  const ids = createdUsers.map(({ id }) => id);

  for (const table of ["daily_logs", "fitness_tracker_test_details"]) {
    const { error } = await supabase
      .from(table)
      .delete()
      .in("client_user_id", ids);
    if (error) {
      console.error(`No se pudo limpiar ${table} tras el fallo.`, error);
    }
  }

  for (const user of createdUsers) {
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) {
      console.error(`No se pudo limpiar la cuenta de prueba ${user.email}.`, error);
    }
  }
}

try {
  const [dailyLogsProbe, detailsProbe] = await Promise.all([
    supabase
      .from("daily_logs")
      .select(
        "id, client_user_id, log_date, weight_kg, sleep_hours, calories_consumed, calories_burned",
      )
      .limit(0),
    supabase.from("fitness_tracker_test_details").select("id").limit(0),
  ]);
  if (dailyLogsProbe.error) throw dailyLogsProbe.error;
  if (detailsProbe.error) {
    throw new Error(
      "Primero ejecuta scripts/fitness_tracker_test_details.sql en el proyecto de pruebas.",
      { cause: detailsProbe.error },
    );
  }

  const fixtureEmails = new Set(testUsers.map(({ email }) => email));
  const existingEmails = new Set();
  for (let page = 1; page <= 100; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw error;
    for (const user of data.users) {
      if (user.email && fixtureEmails.has(user.email.toLowerCase())) {
        existingEmails.add(user.email.toLowerCase());
      }
    }
    if (data.users.length < 1000) break;
  }
  if (existingEmails.size) {
    throw new Error(
      `Ya existen ${existingEmails.size} correos de prueba. No se hicieron escrituras; limpia esa carga de prueba o usa otro proyecto.`,
    );
  }

  const userIdBySource = new Map();
  for (const user of testUsers) {
    const password = `${randomBytes(32).toString("base64url")}Aa1!`;
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: user.fullName,
        synthetic_fixture: "fitness_tracker_test",
      },
    });
    if (error) throw error;
    if (!data.user) {
      throw new Error(`Supabase no devolvió el UUID para ${user.email}.`);
    }

    const createdUser = {
      id: data.user.id,
      sourceId: user.sourceId,
      userNumber: user.userNumber,
      fullName: user.fullName,
      email: user.email,
    };
    createdUsers.push(createdUser);
    userIdBySource.set(user.sourceId, data.user.id);
  }

  const createdIds = createdUsers.map(({ id }) => id);
  const [rolesResult, profilesResult] = await Promise.all([
    supabase
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", createdIds),
    supabase
      .from("users")
      .select("id, account_status")
      .in("id", createdIds),
  ]);
  if (rolesResult.error) throw rolesResult.error;
  if (profilesResult.error) throw profilesResult.error;

  const roleCounts = new Map();
  for (const row of rolesResult.data) {
    const roles = roleCounts.get(row.user_id) ?? [];
    roles.push(row.role);
    roleCounts.set(row.user_id, roles);
  }
  if (
    createdIds.some((id) => {
      const roles = roleCounts.get(id) ?? [];
      return roles.length !== 1 || roles[0] !== "client";
    })
  ) {
    throw new Error(
      "No todas las cuentas recibieron exactamente el rol client; no se insertaron seguimientos.",
    );
  }
  if (
    profilesResult.data.length !== createdIds.length ||
    profilesResult.data.some(({ account_status: status }) => status !== "active")
  ) {
    throw new Error(
      "No se crearon todos los perfiles activos; no se insertaron seguimientos.",
    );
  }

  const dailyLogs = prepared.daily_logs.map(({ source_id: sourceId, ...log }) => ({
    client_user_id: userIdBySource.get(sourceId),
    ...log,
  }));
  const activityDetails = prepared.activity_details.map(
    ({ source_id: sourceId, ...detail }) => ({
      client_user_id: userIdBySource.get(sourceId),
      ...detail,
    }),
  );

  const { error: logsError } = await supabase.from("daily_logs").insert(dailyLogs);
  if (logsError) throw logsError;
  const { error: detailsError } = await supabase
    .from("fitness_tracker_test_details")
    .insert(activityDetails);
  if (detailsError) throw detailsError;

  const mappingPath =
    process.env.FITNESS_TEST_MAPPING_PATH ??
    path.join(tmpdir(), "vibefit-test-user-map.csv");
  const mappingRows = [
    "source_user,generated_user_id,full_name,email",
    ...createdUsers.map(
      ({ sourceId, id, fullName, email }) =>
        `"${sourceId}","${id}","${fullName}","${email}"`,
    ),
  ];
  writeFileSync(mappingPath, `${mappingRows.join("\n")}\n`, { flag: "wx" });

  console.log(
    JSON.stringify(
      {
        createdTestUsers: createdUsers.length,
        insertedDailyLogs: dailyLogs.length,
        insertedActivityDetails: activityDetails.length,
        mappingFile: mappingPath,
        membershipsAssigned: false,
      },
      null,
      2,
    ),
  );
} catch (error) {
  await removeCreatedFixtures();
  throw error;
}
