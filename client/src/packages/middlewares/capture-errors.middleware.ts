import type {NextApiResponse} from 'next';

import {Middleware} from '../middleware/middleware.types';
import {SERVICE_ERROR_CODE_NAME, ServiceError, ServiceErrorCode} from '../server-errors/service-errors';

export interface APIError {
    code: SERVICE_ERROR_CODE_NAME;
    message: string;
}

export const captureErrorsMiddleware: Middleware = async (_req, res: NextApiResponse<APIError>, next) => {
    try {
        await next();
    } catch (error) {
        let errorCode: ServiceErrorCode<any>;

        if (error instanceof ServiceError) {
            errorCode = error.errorCode;
        } else {
            // Unexpected error that the app did not catch. Fallback to default SERVER_ERROR.
            errorCode = ServiceErrorCode.SERVER_ERROR();
            console.error(error);
        }

        res.status(errorCode.httpStatusCode);
        res.json({
            code: errorCode.name,
            message: errorCode.message,
        });
    }
};
