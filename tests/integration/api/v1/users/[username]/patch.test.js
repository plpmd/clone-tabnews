import orchestrator from "tests/orchestrator.js";
import user from "models/user.js";
import password from "models/password";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With nonexistent username", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/users/usuarioInexistente",
        {
          method: "PATCH",
        },
      );

      expect(response.status).toBe(404);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "O username informado não foi encontrado no sistema.",
        action: "Verifique se o username está digitado corretamente.",
        status_code: 404,
      });
    });

    test("With duplicated username", async () => {
      await orchestrator.createUser({
        username: "user1",
      });

      await orchestrator.createUser({
        username: "user2",
      });

      const patchResponse = await fetch(
        "http://localhost:3000/api/v1/users/user2",
        {
          method: "PATCH",
          body: JSON.stringify({ username: "user1" }),
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      expect(patchResponse.status).toBe(400);

      const patchResponseBody = await patchResponse.json();

      expect(patchResponseBody).toEqual({
        name: "ValidationError",
        message: "O username informado já está sendo utilizado.",
        action: "Utilize outro username para realizar esta operação.",
        status_code: 400,
      });
    });

    test("With duplicated email", async () => {
      await orchestrator.createUser({
        email: "email1@gmail.com",
      });

      const createdUser = await orchestrator.createUser({
        email: "email2@gmail.com",
      });

      const patchResponse = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          body: JSON.stringify({ email: "email1@gmail.com" }),
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      expect(patchResponse.status).toBe(400);

      const patchResponseBody = await patchResponse.json();

      expect(patchResponseBody).toEqual({
        name: "ValidationError",
        message: "O email informado já está sendo utilizado.",
        action: "Utilize outro email para realizar esta operação.",
        status_code: 400,
      });
    });

    test("With unique username", async () => {
      const createdUser = await orchestrator.createUser();

      const patchResponse = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          body: JSON.stringify({ username: "uniqueUser2" }),
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      expect(patchResponse.status).toBe(200);

      const responseBody = await patchResponse.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "uniqueUser2",
        email: createdUser.email,
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });

    test("With new email", async () => {
      const createdUser = await orchestrator.createUser();

      const patchResponse = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          body: JSON.stringify({ email: "uniqueEmail2@gmail.com" }),
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      expect(patchResponse.status).toBe(200);

      const responseBody = await patchResponse.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: createdUser.username,
        email: "uniqueEmail2@gmail.com",
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });

    test("With new password", async () => {
      const userPassword = "newPassword1";
      const userResponse = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "newPassword1",
          email: "newPassword1@gmail.com",
          password: userPassword,
        }),
      });

      expect(userResponse.status).toBe(201);

      const newPassword = "newPassword2";
      const patchResponse = await fetch(
        "http://localhost:3000/api/v1/users/newPassword1",
        {
          method: "PATCH",
          body: JSON.stringify({ password: newPassword }),
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      expect(patchResponse.status).toBe(200);

      const responseBody = await patchResponse.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "newPassword1",
        email: "newPassword1@gmail.com",
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);

      const userInDatabase = await user.findOneByUsername("newPassword1");

      const isPasswordMatch = await password.compare(
        newPassword,
        userInDatabase.password,
      );
      expect(isPasswordMatch).toBe(true);

      const isIncorretPasswordMatch = await password.compare(
        userPassword,
        userInDatabase.password,
      );
      expect(isIncorretPasswordMatch).toBe(false);
    });
  });
});
