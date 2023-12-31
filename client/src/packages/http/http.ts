export enum HTTP_STATUS_CODE {
  OK = 200,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  INTERNAL_SERVER_ERROR = 500,
}

export const HTTP_STATUS_CODE_MAP = new Map<number, HTTP_STATUS_CODE>([
  [200, HTTP_STATUS_CODE.OK],
  [400, HTTP_STATUS_CODE.BAD_REQUEST],
  [401, HTTP_STATUS_CODE.UNAUTHORIZED],
  [403, HTTP_STATUS_CODE.FORBIDDEN],
  [404, HTTP_STATUS_CODE.NOT_FOUND],
  [405, HTTP_STATUS_CODE.METHOD_NOT_ALLOWED],
  [500, HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR],
]);

export enum HTTP_METHOD {
  GET = 'GET',
  POST = 'POST',
}
