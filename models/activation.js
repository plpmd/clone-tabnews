import database from "infra/database";
import email from "infra/email.js";
import webserver from "infra/webserver";

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

async function findOneByUserId(userId) {
  const token = await runSelectQuery(userId);
  return token;

  async function runSelectQuery(userId) {
    const result = await database.query({
      text: `
      SELECT
        *
      FROM
        user_activation_tokens
      WHERE
        user_id = $1
      LIMIT
        1
    ;`,
      values: [userId],
    });

    return result.rows[0];
  }
}

const activation = {
  create,
  sendEmailToUser,
  findOneByUserId,
};

export default activation;
