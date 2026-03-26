import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use Case: Registration flow (all successful paths)", () => {
  test("Create user account", async () => {
    const testEmail = "registration.flow@gmail.com";
    const testUsername = "RegistrationFlow";
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

    const responseBody = await response.json();

    expect(responseBody).toEqual({
      id: responseBody.id,
      username: testUsername,
      email: testEmail,
      password: responseBody.password,
      features: ["read:activation-token"],
      created_at: responseBody.created_at,
      updated_at: responseBody.updated_at,
    });
  });

  test("Receive activation email", async () => {});

  test("Activate account", async () => {});

  test("Login", async () => {});

  test("Get user information", async () => {});
});
