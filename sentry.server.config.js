import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://836bdb08380a219800aa9dbe3c829880@o4510456194072576.ingest.us.sentry.io/4511122303025152",
  tracesSampleRate: 1.0,
  sendDefaultPii: true,
});
