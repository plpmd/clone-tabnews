import database from "infra/database.js";
import { InternalServerError } from "infra/errors";

async function status(request, response) {
  try {
    const updatedAt = new Date().toISOString();

    const databaseName = process.env.POSTGRES_DB;
    const databaseOpenendConnectionsResult = await database.query({
      text: "SELECT count(*)::int from pg_stat_activity WHERE datname = $1;",
      values: [databaseName],
    });
    const databaseOpenendConnectionsValue =
      databaseOpenendConnectionsResult.rows[0].count;

    const databaseVersionResult = await database.query("SHOW server_version;");
    const databaseVersionValue = databaseVersionResult.rows[0].server_version;

    const databaseMaxConnectionsResult = await database.query(
      "SHOW max_connections;",
    );
    const databaseMaxConnectionsValue =
      databaseMaxConnectionsResult.rows[0].max_connections;

    response.status(200).json({
      updated_at: updatedAt,
      dependencies: {
        database: {
          version: databaseVersionValue,
          max_connections: parseInt(databaseMaxConnectionsValue),
          opened_connections: databaseOpenendConnectionsValue,
        },
      },
    });
  } catch (error) {
    console.log("error");
    const publicErrorObject = new InternalServerError({ cause: error });

    console.error(publicErrorObject);

    response.status(500).json({
      error: "Internal Server Error",
    });
  }
}

export default status;
