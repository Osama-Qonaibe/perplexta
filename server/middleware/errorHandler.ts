import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  code: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const statusCode = (err as AppError).statusCode || 500;
  const code = (err as AppError).code || 'INTERNAL_ERROR';

  const logEntry = {
    timestamp: new Date().toISOString(),
    level: statusCode >= 500 ? 'ERROR' : 'WARN',
    code,
    message: err.message,
    path: req.path,
    method: req.method,
    userId: (req as any).user?.id || 'anonymous',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  };

  if (process.env.NODE_ENV === 'production') {
    console.log(JSON.stringify(logEntry));
  } else {
    console.error(`[${logEntry.level}] ${code}: ${err.message}`);
    console.error(`${req.method} ${req.path}`);
    if (err.stack) console.error(err.stack);
  }

  res.status(statusCode).json({
    error: err.message,
    code,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
}

export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  if (req.path.startsWith('/api')) {
    const err = new AppError(
      `Route not found ${req.method} ${req.path}`,
      404,
      'ROUTE_NOT_FOUND'
    );
    return next(err);
  }
  next();
}
