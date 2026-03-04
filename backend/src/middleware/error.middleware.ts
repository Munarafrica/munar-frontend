import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error('[Error]', err);

  if (err instanceof Error) {
    const status = (err as NodeJS.ErrnoException & { statusCode?: number }).statusCode ?? 500;
    return res.status(status).json({
      code: 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred',
      statusCode: status,
    });
  }

  return res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
    statusCode: 500,
  });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({
    code: 'NOT_FOUND',
    message: 'The requested endpoint does not exist',
    statusCode: 404,
  });
}
