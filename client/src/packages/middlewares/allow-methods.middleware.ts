import { HTTP_METHOD } from '../http/http';
import { Middleware } from '../middleware/middleware.types';
import { ServiceError, ServiceErrorCode } from '../server-errors/service-errors';

export const allowMethodsMiddleware = (allowedMethods: Array<HTTP_METHOD>): Middleware => {
  return async (req, _res, next) => {
    if (allowedMethods.includes(req.method as unknown as HTTP_METHOD)) {
      await next();
    } else {
      throw new ServiceError(ServiceErrorCode.METHOD_NOT_SUPPORTED());
    }
  };
};
