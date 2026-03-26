import webserver from "infra/webserver";
import activation from "models/activation";
import user from "models/user";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use Case: Registration flow (all successful paths)", () => {
  const testEmail = "registration.flow@gmail.com";
  const testUsername = "RegistrationFlow";
  let createdUserResponseBody;
  let activationToken;

  test("Create user account", async () => {
    const response = await fetch("http://localhost:3000/api/v1/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: testUsername,
        email: testEmail,
        password: "12345678",
      }),
    });

    expect(response.status).toBe(201);

    createdUserResponseBody = await response.json();

    expect(createdUserResponseBody).toEqual({
      id: createdUserResponseBody.id,
      username: testUsername,
      email: testEmail,
      password: createdUserResponseBody.password,
      features: ["read:activation-token"],
      created_at: createdUserResponseBody.created_at,
      updated_at: createdUserResponseBody.updated_at,
    });
  });

  test("Receive activation email", async () => {
    const lastEmail = await orchestrator.getLastEmail();

    expect(lastEmail.sender).toBe("<contato@clonetabnews.com>");
    expect(lastEmail.recipients[0]).toBe(`<${testEmail}>`);
    expect(lastEmail.subject).toBe("Ative seu cadastro no CloneTabNews");
    expect(lastEmail.text).toContain(testUsername);

    const token = orchestrator.extractUUID(lastEmail.text);
    activationToken = await activation.findOneValidById(token);
    expect(lastEmail.text).toContain(
      `${webserver.origin}/cadastro/ativar/${activationToken.id}`,
    );
    expect(activationToken.user_id).toBe(createdUserResponseBody.id);
  });

  test("Activate account", async () => {
    const activationReponse = await fetch(
      `http://localhost:3000/api/v1/activations/${activationToken.id}`,
      {
        method: "PATCH",
      },
    );

    expect(activationReponse.status).toBe(200);
    const activationResponseBody = await activationReponse.json();

    expect(Date.parse(activationResponseBody.expires_at)).not.toBeNaN();

    const activatedUser = await user.findOneByUsername(testUsername);
    expect(activatedUser.features).toEqual(["create:session"]);
  });

  test("Login", async () => {});

  test("Get user information", async () => {});
});
