import { Response } from 'express';

// Standard success response
export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
  meta?: Record<string, unknown>
) {
  return res.status(statusCode).json({
    data,
    message,
    ...(meta ? { meta } : {}),
  });
}

// Paginated response
export function sendPaginated<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number
) {
  const totalPages = Math.ceil(total / limit);
  return res.status(200).json({
    data,
    meta: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  });
}

// Error response
export function sendError(
  res: Response,
  message: string,
  statusCode = 500,
  code = 'INTERNAL_ERROR',
  details?: Record<string, string[]>
) {
  return res.status(statusCode).json({
    code,
    message,
    statusCode,
    ...(details ? { details } : {}),
  });
}
