import {HTTP_STATUS_CODE, HTTP_STATUS_CODE_MAP} from '../http/http';
import {APIError} from '../middlewares/capture-errors.middleware';

export enum CLIENT_STATUS_CODE {
    NETWORK_ERROR = 'NETWORK_ERROR',
}

export interface FetchError {
    statusCode: HTTP_STATUS_CODE | CLIENT_STATUS_CODE;
    apiError?: APIError;
}

export const fetchWrapper = async <T>(url: string, options?: RequestInit, fetchFn = fetch): Promise<T> => {
    try {
        const response = await fetchFn(url, options);

        try {
            const data = await response.json();
            if (response.ok) {
                return data as T;
            }

            const fetchError: FetchError = {
                statusCode: HTTP_STATUS_CODE_MAP.get(response.status)!,
                apiError: data as APIError,
            };
            return Promise.reject(fetchError);
        } catch (error) {
            const fetchError: FetchError = {
                statusCode: HTTP_STATUS_CODE_MAP.get(response.status)!,
            };
            return Promise.reject(fetchError);
        }
    } catch (error) {
        const fetchError: FetchError = {
            statusCode: CLIENT_STATUS_CODE.NETWORK_ERROR,
        };
        return Promise.reject(fetchError);
    }
};
