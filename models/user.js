import database from "infra/database";
import { NotFoundError, ValidationError } from "infra/errors.js";

async function create(userInputValues) {
  const { username, email, password } = userInputValues;

  await validateUniqueColumn("email", email);
  await validateUniqueColumn("username", username);

  const newUser = await runInsertQuery(username, email, password);
  return newUser;

  async function validateUniqueColumn(columnName, columnValue) {
    const result = await database.query({
      text: `
      SELECT 
        ${columnName}
      FROM 
        users
      WHERE
        LOWER(${columnName}) = LOWER($1)
    ;`,
      values: [columnValue],
    });

    if (result.rowCount > 0) {
      throw new ValidationError({
        message: `O ${columnName} informado já está sendo utilizado.`,
        action: `Utilize outro ${columnName} para realizar o cadastro.`,
      });
    }
  }

  async function runInsertQuery(username, email, password) {
    const result = await database.query({
      text: `
      INSERT INTO 
        users (username, email, password)
      VALUES
        ($1, $2, $3)
      RETURNING
        *
    ;`,
      values: [username, email, password],
    });

    return result.rows[0];
  }
}

async function findOneByUsername(username) {
  const foundUser = await runSelectQuery(username);

  async function runSelectQuery(columnValue) {
    const result = await database.query({
      text: `
      SELECT 
        *
      FROM 
        users
      WHERE
        LOWER(username) = LOWER($1)
      LIMIT
        1
    ;`,
      values: [columnValue],
    });

    if (result.rowCount === 0) {
      throw new NotFoundError({
        message: "O username informado não foi encontrado no sistema.",
        action: "Verifique se o username está digitado corretamente.",
      });
    }

    return result.rows[0];
  }
  return foundUser;
}

const user = {
  create,
  findOneByUsername,
};

export default user;
