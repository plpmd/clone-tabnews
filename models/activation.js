import database from "infra/database";
import email from "infra/email.js";
import { NotFoundError } from "infra/errors";
import webserver from "infra/webserver";
import user from "./user";

const EXPIRATION_IN_MILLISECONDS = 60 * 15 * 1000; // 15 minutos

async function sendEmailToUser(user, activationToken) {
  await email.send({
    from: "<contato@clonetabnews.com>",
    to: `<${user.email}>`,
    subject: "Ative seu cadastro no CloneTabNews",
    text: `${user.username}, clique no link abaixo para ativar seu cadastro no CloneTabNews:

${webserver.origin}/cadastro/ativar/${activationToken.id}

Este link expira em 15 minutos.

Atenciosamente,
Equipe CloneTabNews
`,
  });
}

async function create(userId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);

  const newToken = await runInsertQuery(userId, expiresAt);
  return newToken;

  async function runInsertQuery(userId, expiresAt) {
    const result = await database.query({
      text: `
      INSERT INTO 
        user_activation_tokens (user_id, expires_at)
      VALUES
        ($1, $2)
      RETURNING
        *
    ;`,
      values: [userId, expiresAt],
    });

    return result.rows[0];
  }
}

async function findOneValidById(token) {
  const validToken = await runSelectQuery(token);
  return validToken;
  async function runSelectQuery(token) {
    const result = await database.query({
      text: `
      SELECT
        *
      FROM
        user_activation_tokens
      WHERE
        id = $1
        AND expires_at > NOW()
        AND used_at IS NULL
      LIMIT
        1
    ;`,
      values: [token],
    });

    if (result.rowCount === 0) {
      throw new NotFoundError({
        message:
          "Token de ativação utilizado não foi encontrado no sistema ou expirou",
        action: "Faça um novo cadastro.",
      });
    }

    return result.rows[0];
  }
}

async function markTokenAsUsed(tokenId) {
  const usedToken = await runUpdateQuery(tokenId);
  return usedToken;

  async function runUpdateQuery(tokenId) {
    const result = await database.query({
      text: `
      UPDATE
        user_activation_tokens
      SET
        used_at = timezone('utc', now()),
        updated_at = timezone('utc', now())
      WHERE
        id = $1
      RETURNING
        *
    ;`,
      values: [tokenId],
    });

    return result.rows[0];
  }
}

async function activateUserByUserId(userId) {
  const activatedUser = await user.setFeatures(userId, ["create:session"]);
  return activatedUser;
}

const activation = {
  create,
  sendEmailToUser,
  findOneValidById,
  markTokenAsUsed,
  activateUserByUserId,
};

export default activation;
