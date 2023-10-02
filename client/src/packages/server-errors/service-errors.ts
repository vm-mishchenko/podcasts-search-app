import {HTTP_STATUS_CODE} from '../http/http';

export class ServiceError extends Error {
    public readonly errorCode: ServiceErrorCode<any>;

    constructor(errorCode: ServiceErrorCode<any>) {
        super(errorCode.message);

        this.errorCode = errorCode;

        // Clips the constructor invocation from the stack trace.
        Error.captureStackTrace(this, ServiceError);
    }
}

// Error constructor function.
const createErrorConstructor = <T>(
    name: SERVICE_ERROR_CODE_NAME,
    httpStatusCode: HTTP_STATUS_CODE,
    pMessage: string | ((params: T) => string)
): ((params: T) => ServiceErrorCode<T>) => {
    return (params?: T) => {
        let message: string;
        if (typeof pMessage === 'string') {
            message = pMessage;
        } else {
            if (!params) {
                throw new Error(`The "${name}" error requires param to format the message.`);
            }
            message = pMessage(params);
        }

        return new ServiceErrorCode<T>(name, httpStatusCode, message, params);
    };
};

export enum SERVICE_ERROR_CODE_NAME {
    'SERVER_ERROR' = 'SERVER_ERROR',
    'METHOD_NOT_SUPPORTED' = 'METHOD_NOT_SUPPORTED',
    'MISSING_ATTRIBUTE' = 'MISSING_ATTRIBUTE'
}

export class ServiceErrorCode<P> {
    static SERVER_ERROR = createErrorConstructor<void>(
        SERVICE_ERROR_CODE_NAME.SERVER_ERROR,
        HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR,
        'Server error.'
    );
    static METHOD_NOT_SUPPORTED = createErrorConstructor<void>(
        SERVICE_ERROR_CODE_NAME.METHOD_NOT_SUPPORTED,
        HTTP_STATUS_CODE.METHOD_NOT_ALLOWED,
        'Method is not supported.'
    );
    static MISSING_ATTRIBUTE = createErrorConstructor<{ attrName: string }>(
        SERVICE_ERROR_CODE_NAME.MISSING_ATTRIBUTE,
        HTTP_STATUS_CODE.BAD_REQUEST,
        (params) => `Attribute ${params.attrName} is missing.`
    );

    public name: SERVICE_ERROR_CODE_NAME;
    public httpStatusCode: HTTP_STATUS_CODE;
    public message: string;
    public params: P | undefined;

    constructor(name: SERVICE_ERROR_CODE_NAME, httpStatusCode: HTTP_STATUS_CODE, message: string, params?: P) {
        this.name = name;
        this.httpStatusCode = httpStatusCode;
        this.message = message;
        this.params = params;
    }
}
