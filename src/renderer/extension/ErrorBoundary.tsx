import React from "react";
import { sentry } from "./sentryHelper";
import { sendNotificationToSlack } from "./services/utils";
import { WhatsAppButton } from "./sidepanel/Help";
import { EXT_VERSION } from "./sidepanel/Login";
import { sendLogToDatadogAsync } from "./sidepanel/logger";

type ErrorBoundaryProps = {
  children: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  async componentDidCatch(error: any, errorInfo: any) {
    sentry.captureException(error, errorInfo);
    console.log(error);

    try {
      const userEmail = (await chrome.storage.local.get("userEmail")).userEmail;
      sendNotificationToSlack(
        `User: ${userEmail}, Extension version: ${EXT_VERSION}, Error: ${error}: ${JSON.stringify(errorInfo)}`
      );
      sendLogToDatadogAsync(
        `${error}: ${JSON.stringify(errorInfo)}, User: ${userEmail}`
      );
    } catch (emailError) {
      console.error("Failed to retrieve user email:", emailError);
      sendNotificationToSlack(
        `User: unknown, Extension version: ${EXT_VERSION}, Error: ${error}: ${JSON.stringify(errorInfo)}`
      );
      sendLogToDatadogAsync(
        `${error}: ${JSON.stringify(errorInfo)}, User: unknown`
      );
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <h1>
          An error occurred. Please click the{" "}
          <WhatsAppButton
            title={"Support"}
            link={"https://chat.whatsapp.com/FIUDKVbXQoo33NgzOV9ZIi"}
          />{" "}
          for assistance.
        </h1>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
