import { NextApiRequest, NextApiResponse } from 'next';

export type NextFn = () => Promise<void>;

export type Middleware<RequestT extends NextApiRequest = NextApiRequest> = (
  req: RequestT,
  res: NextApiResponse,
  next: NextFn
) => Promise<void>;
