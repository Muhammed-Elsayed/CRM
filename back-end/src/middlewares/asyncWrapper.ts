import type { NextFunction, Request, Response } from 'express'

import { WebError } from '../utilities/web-errors.js'

type AsyncFunction = (req: Request, res: Response, next: NextFunction) => Promise<unknown>

const asyncHandler = (asyncFunc: AsyncFunction) => {
    return (req: Request, res: Response, next: NextFunction) => {
        asyncFunc(req, res, next).catch((error: any) => {
            if (!(error instanceof WebError)) {
                return next(WebError.InternalServerError())
            }

            next(error);
        });
    };
};

export default asyncHandler;
