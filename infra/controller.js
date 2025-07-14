const { MethodNotAllowedError, InternalServerError } = require("./errors");

function onNoMatchHandler(request, response) {
  const publicErrorObject = new MethodNotAllowedError();
  response.status(publicErrorObject.status_code).json(publicErrorObject);
}

function onErrorHandler(error, request, response) {
  const publicErrorObject = new InternalServerError({ cause: error });

  console.error(publicErrorObject);

  response.status(publicErrorObject.status_code).json(publicErrorObject);
}

const controller = {
  onNoMatchHandler,
  onErrorHandler
}

export default controller
