/**
 * Vercel serverless entry point.
 * Imports the compiled Express app and exports it as a serverless handler.
 *
 * Vercel routes all `/api/*` requests here via vercel.json rewrites.
 */
import app from '../backend/src/app';

export default app;
