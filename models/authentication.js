import user from "models/user.js";
import passwordModel from "models/password.js";
import { NotFoundError, UnauthorizedError } from "infra/errors.js";

async function getAuthenticatedUser(providedEmail, providedPassword) {
  try {
    const storedUser = await findUserByEmail(providedEmail);
    await validatePassword(providedPassword, storedUser.password);

    return storedUser;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw new UnauthorizedError({
        message: "Dados de autenticação não conferem.",
        action: "Verifique se os dados enviados estão corretos",
      });
    }

    throw error;
  }

  async function findUserByEmail(email) {
    try {
      const foundUser = await user.findOneByEmail(email);
      return foundUser;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new UnauthorizedError({
          message: "Email não confere.",
          action: "Verifique se este dado está correto.",
        });
      }

      throw error;
    }
  }

  async function validatePassword(providedPassword, storedPassword) {
    const isPasswordMatch = await passwordModel.compare(
      providedPassword,
      storedPassword,
    );
    if (!isPasswordMatch) {
      throw new UnauthorizedError({
        message: "Senha não confere.",
        action: "Verifique se este dado está correto",
      });
    }
  }
}

const authentication = {
  getAuthenticatedUser,
};

export default authentication;
