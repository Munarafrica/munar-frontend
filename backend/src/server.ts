import app from './app';

const PORT = parseInt(process.env.PORT || '3000', 10);

// Prevent the server from crashing on unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('[UnhandledRejection] at:', promise, 'reason:', reason);
  // Do NOT exit – let the request time out or the error handler deal with it
});

process.on('uncaughtException', (err) => {
  console.error('[UncaughtException]', err);
  // Exit only on truly unrecoverable errors
  process.exit(1);
});

app.listen(PORT, () => {
  console.log(`🚀 Munar API server running on http://localhost:${PORT}`);
});
