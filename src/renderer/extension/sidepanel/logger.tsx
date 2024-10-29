import { EXT_VERSION } from "./Login";

const DATADOG_API_KEY = "";

interface Meta {
  userId: string;
}

export async function sendLogToDatadogAsync(
  msg: string,
  meta?: Meta
): Promise<string> {
  try {
    if (!DATADOG_API_KEY) {
      return;
    }
    const session = await fetch(
      `https://http-intake.logs.datadoghq.com/v1/input?api_key=${DATADOG_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: msg,
          ddsource: "extension",
          service: "extension",
          hostname: "Extension",
          status: "debug",
          user_id: meta?.userId,
          EXT_VERSION: EXT_VERSION,
          event_date: new Date()
            .toLocaleString("en-US", {
              timeZone: "UTC",
              month: "short",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              fractionalSecondDigits: 3,
              hour12: false
            })
            .replace(",", "")
        })
      }
    );

    const responseText = await session.text();
    console.log(responseText);
    return responseText;
  } catch (e) {
    console.error(`Failed to send log to Datadog: ${e}`);
  }
}
