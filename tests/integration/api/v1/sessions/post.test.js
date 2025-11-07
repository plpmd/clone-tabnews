import session from "models/session";
import orchestrator from "tests/orchestrator.js";
import { version as uuidVersion } from "uuid";
import setCookieParser from "set-cookie-parser";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

const expectedUnauthorizedErrorResponse = {
  name: "UnauthorizedError",
  message: "Dados de autenticação não conferem.",
  action: "Verifique se os dados enviados estão corretos",
  status_code: 401,
};

describe("POST api/v1/sessions", () => {
  describe("Anonymous user", () => {
    test("With incorrect `email` but correct `password`", async () => {
      const password = "senhaCorreta";
      await orchestrator.createUser({
        password,
      });

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "email.incorreto@gmail.com",
          password,
        }),
      });

      expect(response.status).toBe(401);
      const responseBody = await response.json();

      expect(responseBody).toEqual(expectedUnauthorizedErrorResponse);
    });
    test("With incorrect `password` but correct `email`", async () => {
      const email = "emailcorreto@gmail.com";
      await orchestrator.createUser({
        email,
      });

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password: "123456",
        }),
      });

      expect(response.status).toBe(401);
      const responseBody = await response.json();

      expect(responseBody).toEqual(expectedUnauthorizedErrorResponse);
    });

    test("With incorrect `password` and incorrect `email`", async () => {
      await orchestrator.createUser();

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "emailErrado@gmail.com",
          password: "123456",
        }),
      });

      expect(response.status).toBe(401);
      const responseBody = await response.json();

      expect(responseBody).toEqual(expectedUnauthorizedErrorResponse);
    });

    test("With correct `password` and correct `email`", async () => {
      const email = "email.correto@gmail.com";
      const password = "senhacorreta";
      const createdUser = await orchestrator.createUser({
        email,
        password,
      });

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      expect(response.status).toBe(201);
      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        token: responseBody.token,
        user_id: createdUser.id,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
        expires_at: responseBody.expires_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(Date.parse(responseBody.expires_at)).not.toBeNaN();

      const expiresAt = new Date(responseBody.expires_at);
      const createdAt = new Date(responseBody.created_at);

      expiresAt.setMilliseconds(0);
      createdAt.setMilliseconds(0);
      expect(expiresAt - createdAt).toBe(session.EXPIRATION_IN_MS);

      const parsedSetCookie = setCookieParser.parse(
        response.headers.get("Set-Cookie"),
        { map: true },
      );
      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: responseBody.token,
        maxAge: session.EXPIRATION_IN_MS / 1000,
        path: "/",
        httpOnly: true,
      });
    });
  });
});
