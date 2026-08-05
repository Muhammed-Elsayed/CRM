import type { NextFunction, Request, Response } from 'express'

import { config } from '../config/index.js'
import { WebError } from '../utilities/web-errors.js'

export const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction): void => {
    const isWebError = err instanceof WebError
    const statusCode = isWebError ? err.statusCode : 500
    const statusText = isWebError ? err.statusText : 'Internal Server Error'
    const message =
        statusCode >= 500 && config.isProduction
            ? 'Internal Server Error'
            : isWebError
              ? err.message
              : 'An unexpected error occurred on the server.'

    res.locals.message = message;
    res.locals.error = config.isProduction ? {} : err;

    res.status(statusCode).json(
        {
            statusCode,
            statusText,
            message
        }
    );
};

export const errorNotFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
    next(WebError.NotFound("The resource you are looking for was not found."));
};
