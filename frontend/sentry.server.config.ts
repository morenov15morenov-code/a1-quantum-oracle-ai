import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: process.env.NODE_ENV === "production",
  tracesSampleRate: 0.1,
  beforeSend(event) {
    if (event.request?.headers) {
      const headers = event.request.headers;
      delete headers["cookie"];
      delete headers["authorization"];
    }
    return event;
  },
});
