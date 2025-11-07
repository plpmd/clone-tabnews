import database from "infra/database";
import { NotFoundError, ValidationError } from "infra/errors.js";
import password from "models/password.js";

async function create(userInputValues) {
  const { username, email } = userInputValues;

  await validateUniqueColumn("email", email);
  await validateUniqueColumn("username", username);
  await hashPasswordInObject(userInputValues);
  const newUser = await runInsertQuery(
    username,
    email,
    userInputValues.password,
  );
  return newUser;

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
      action: `Utilize outro ${columnName} para realizar esta operação.`,
    });
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

async function update(username, userInputValues) {
  const currentUser = await findOneByUsername(username);

  if ("username" in userInputValues) {
    await validateUniqueColumn("username", userInputValues.username);
  }

  if ("email" in userInputValues) {
    await validateUniqueColumn("email", userInputValues.email);
  }

  if ("password" in userInputValues) {
    await hashPasswordInObject(userInputValues);
  }

  const userWithNewValues = { ...currentUser, ...userInputValues };

  const updatedUser = await runUpdateQuery(userWithNewValues);

  return updatedUser;

  async function runUpdateQuery(user) {
    const result = await database.query({
      text: `
      UPDATE 
        users
      SET
        username = $2,
        email = $3,
        password = $4,
        updated_at = timezone('utc', now())
      WHERE 
        id = $1
      RETURNING
        *
    ;`,
      values: [user.id, user.username, user.email, user.password],
    });

    return result.rows[0];
  }
}

async function hashPasswordInObject(userInputValues) {
  const hashedPassword = await password.hash(userInputValues.password);
  userInputValues.password = hashedPassword;

  return userInputValues;
}

async function findOneByEmail(email) {
  const foundUser = await runSelectQuery(email);

  async function runSelectQuery(columnValue) {
    const result = await database.query({
      text: `
      SELECT 
        *
      FROM 
        users
      WHERE
        LOWER(email) = LOWER($1)
      LIMIT
        1
    ;`,
      values: [columnValue],
    });

    if (result.rowCount === 0) {
      throw new NotFoundError({
        message: "O email informado não foi encontrado no sistema.",
        action: "Verifique se o email está digitado corretamente.",
      });
    }

    return result.rows[0];
  }
  return foundUser;
}

const user = {
  create,
  findOneByUsername,
  update,
  findOneByEmail,
};

export default user;
