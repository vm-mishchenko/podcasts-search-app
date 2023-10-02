import { NextApiRequest, NextApiResponse } from 'next';

import { Middleware } from './middleware.types';
import { runMiddlewares } from './run-middlewares';

export function use<RequestT extends NextApiRequest>(...middlewares: Middleware<RequestT>[]) {
  return async function internalHandler(req: RequestT, res: NextApiResponse) {
    await runMiddlewares<RequestT>(req, res, middlewares, 0);
  };
}
