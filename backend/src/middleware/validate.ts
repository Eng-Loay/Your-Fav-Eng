import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ApiResponse } from '../utils/apiResponse';

function stripEmptyStrings(input: any): any {
  if (input === null || input === undefined) return input;
  if (Array.isArray(input)) return input.map(stripEmptyStrings);
  if (typeof input !== 'object') return input;
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(input)) {
    if (typeof v === 'string') {
      const trimmed = v.trim();
      if (trimmed !== '') out[k] = trimmed;
      continue;
    }
    if (v !== undefined) out[k] = stripEmptyStrings(v);
  }
  return out;
}

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    req.body = stripEmptyStrings(req.body);
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return ApiResponse.badRequest(res, 'Validation failed', errors);
    }
    req.body = result.data;
    next();
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const errors = result.error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return ApiResponse.badRequest(res, 'Invalid query parameters', errors);
    }
    req.query = result.data;
    next();
  };
};
