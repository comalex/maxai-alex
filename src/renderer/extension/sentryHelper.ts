import {
  BrowserClient,
  defaultStackParser,
  getDefaultIntegrations,
  makeFetchTransport,
  Scope
} from "@sentry/browser";
import { SENTRY_DSN } from "./config/constants";

// filter integrations that use the global variable
const integrations = getDefaultIntegrations({}).filter((defaultIntegration) => {
  return ![
    "BrowserApiErrors",
    "TryCatch",
    "Breadcrumbs",
    "GlobalHandlers"
  ].includes(defaultIntegration.name);
});

const client = new BrowserClient({
  dsn: SENTRY_DSN,
  transport: makeFetchTransport,
  stackParser: defaultStackParser,
  integrations: integrations
});

export const sentry = new Scope();
sentry.setClient(client);

client.init(); // initializing has to be done after setting the client on the scope

// // You can capture exceptions manually for this client like this:
// scope.captureException(new Error('example'));
