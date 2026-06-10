import type { Response } from 'express'

export const responseHandler = (
    res: Response,
    statusCode: number = 200,
    message: string,
    context?: unknown,
) => {
    const response = {
        statusCode,
        message,
        data: context || {},
        timestamp: new Date().toISOString(),
    }

    res.status(statusCode).json(response)
}
