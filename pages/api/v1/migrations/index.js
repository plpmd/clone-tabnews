import migrationRunner from "node-pg-migrate";
import { resolve } from "node:path";
import database from "infra/database";
import { createRouter } from "next-connect";
import { InternalServerError, MethodNotAllowedError } from "infra/errors";

const router = createRouter();
router.get(getHandler);
router.post(postHandler);

export default router.handler({
  onNoMatch: onNoMatchHandler,
  onError: onErrorHandler,
});

function onNoMatchHandler(request, response) {
  const publicErrorObject = new MethodNotAllowedError();
  response.status(publicErrorObject.status_code).json(publicErrorObject);
}

function onErrorHandler(error, request, response) {
  const publicErrorObject = new InternalServerError({ cause: error });

  console.error(publicErrorObject);

  response.status(publicErrorObject.status_code).json(publicErrorObject);
}

const defaultMigrationsOption = {
  dryRun: true,
  dir: resolve("infra", "migrations"),
  direction: "up",
  verbose: true,
  migrationsTable: "pgmigrations",
};

async function getHandler(request, response) {
  let dbClient;
  try {
    dbClient = await database.getNewClient();

    const defaultMigrationsOption = {
      dbClient,
      dryRun: true,
      dir: resolve("infra", "migrations"),
      direction: "up",
      verbose: true,
      migrationsTable: "pgmigrations",
    };
    const pendingMigrations = await migrationRunner({ ...defaultMigrationsOption, dbClient });
    return response.status(200).json(pendingMigrations);
  }
  finally {
    await dbClient?.end();
  }
}

async function postHandler(request, response) {
  let dbClient;
  try {
    dbClient = await database.getNewClient();

    const migratedMigrations = await migrationRunner({
      ...defaultMigrationsOption,
      dbClient,
      dryRun: false,
    });

    if (migratedMigrations.length > 0) {
      return response.status(201).json(migratedMigrations);
    }

    return response.status(200).json(migratedMigrations);
  } finally {
    await dbClient?.end();
  }
}
