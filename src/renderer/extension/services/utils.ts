import { sendToBackground } from "../../plasmohq/messaging";
import type { Account, Message, OnlyFansMessage } from "../../config/types";
import { sentry } from "../sentryHelper";
import { getWebviewCurrentURL } from "src/renderer/utils";
import { sendMessage } from "../background/bus";
import { EXTENSION_MESSAGE_TYPES } from "src/renderer/extension/config/constants";
export const REGEX_PATTERNS = {
  ONLYFANS_MESSAGE_THREAD:
    /^https:\/\/onlyfans\.com\/my\/chats\/chat\/(\d+)(\/|\?|$)/,
  ONLYFANS_VAULT_DETAILED_PAGE:
    /^https:\/\/onlyfans\.com\/my\/vault\/list\/(\d+)(\/|\?|$)/,
  ONLYFANS_BASE_URL: /^https:\/\/onlyfans\.com(\/|\?|$)/,
  ONLYFANS_SUBS_DETAILED_PAGE:
    /^https:\/\/onlyfans\.com\/my\/statistics\/fans\/subscriptions/
};

export const checkIsOnlyFanMessageThreadSelected = async () => {
  return await checkCurrentUrl(REGEX_PATTERNS.ONLYFANS_MESSAGE_THREAD);
};

export const checkIfSubsDetailedPage = async () => {
  return await checkCurrentUrl(REGEX_PATTERNS.ONLYFANS_SUBS_DETAILED_PAGE);
};

export const checkIfVaultDetailedPage = async () => {
  return await checkCurrentUrl(REGEX_PATTERNS.ONLYFANS_VAULT_DETAILED_PAGE);
};

export const isValidPage = (regex: RegExp, url: string) => {
  return regex.test(url);
};

export const getActiveTabUrl = async (): Promise<string | null> => {
  try {
    // const tabs = await chrome.tabs.query({
    //   active: true,
    //   currentWindow: true
    // });
    // const currentTab = tabs[0];
    // const url = currentTab.url || null;
    // console.log(url);
    // return url;
    return getWebviewCurrentURL('tab-1');
  } catch (error) {
    console.error("Error while getting active tab url:", error);
    return null;
  }
};

export const getCurrentUrl = async () => {
  try {
    // const data = await sendToBackground({
    //   name: "get-active-tab-url"
    // });
    // console.log("getCurrentUrl", data);
    // if (!data.success || !data.activeTabUrl) {
    //   return null;
    // }
    // return data.activeTabUrl;
    return getActiveTabUrl();
  } catch (error) {
    return null;
  }
};

export const checkCurrentUrl = async (regex: RegExp) => {
  const url = await getCurrentUrl();
  return url ? isValidPage(regex, url) : false;
};

export const retrieveMessageHistory = async (): Promise<Message> => {
  const content = await sendMessage({
    type: EXTENSION_MESSAGE_TYPES.RETRIEVE_ONLY_FANS_MESSAGES,
    tab: "tab-1",
  });
  return content;
  // try {
  //   const { success, data: messages } = await sendToBackground({
  //     name: "retrieve-thread-messages"
  //   });
  //   if (success) {
  //     return messages;
  //   }
  //   throw new Error("retrieveMessageHistory error");
  // } catch (error) {
  //   console.log({ error });
  //   sentry.captureException(new Error(error));
  //   return null;
  // }
};

export const retrieveSubsHistory = async (): Promise<any> => {
  try {
    const { success, data: messages } = await sendToBackground({
      name: "retrieve-subs-history"
    });
    if (success) {
      return messages;
    }
    throw new Error("retrieveMessageHistory error");
  } catch (error) {
    console.log({ error });
    sentry.captureException(new Error(error));
    return null;
  }
};

export const generateMessageId = (chatMessageElement: Element): string => {
  const messageDay =
    chatMessageElement.parentElement?.childNodes?.[0]?.textContent?.trim();

  let messageTime: string | undefined = undefined;
  let sibling: Element | null = chatMessageElement as Element;

  while (sibling && !messageTime) {
    messageTime = sibling.childNodes[1]?.textContent?.trim();
    sibling = sibling.nextElementSibling;
  }
  const [time, modifier] = messageTime.trim().split(" ");

  let [hours, minutes] = time.split(":").map(Number);
  if (modifier.toLowerCase() === "pm" && hours < 12) hours += 12;
  if (modifier.toLowerCase() === "am" && hours === 12) hours = 0;

  const today = new Date();
  let date: Date;

  if (messageDay === "Yesterday") {
    date = new Date(today);
    date.setDate(today.getDate() - 1);
  } else if (messageDay === "Today") {
    date = new Date(today);
  } else {
    date = new Date(`${messageDay}, ${today.getFullYear()}`);
  }

  date.setHours(hours, minutes, 0, 0);

  const milliseconds = date.getTime();
  return milliseconds.toString();
};

const PLASMO_PUBLIC_SLACK_BOT_TOKEN_PRO = ""
const PLASMO_PUBLIC_SLACK_CHANNEL_PRO = "";
export const sendNotificationToSlack = async (
  message: string,
  isProd: boolean = false
): Promise<void> => {
  const slackToken = PLASMO_PUBLIC_SLACK_BOT_TOKEN_PRO;
  const slackChannel = PLASMO_PUBLIC_SLACK_CHANNEL_PRO;

  if (!slackToken || !slackChannel) {
    console.error("Slack token or channel is not defined.");
    return;
  }

  const url = "https://slack.com/api/chat.postMessage";
  const payload = {
    channel: slackChannel,
    text: `[Omega ext]: ${message}`
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Bearer ${slackToken}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!data.ok) {
      console.error("Error sending notification to Slack:", data.error);
    }
  } catch (error) {
    console.error("Error sending notification to Slack:", error);
  }
};

export const combineInformationElements = (data: OnlyFansMessage[]) => {
  const combinedData = [];
  let currentCombined: {
    ids: string[];
    tags: string[];
    contents: string[];
    attachments: any[];
  } | null = null;

  for (const item of data) {
    if (item.role === "user" && item.content.includes("INFORMATION")) {
      const tag = item.content.match(/<(\w+)>/)?.[1];
      const content = item.content
        .replace(
          /<\w+> INFORMATION: usr sent an (image|audio|video). The (image|media) (shows|describe): /,
          ""
        )
        .replace(" ENDINFORMATION", "");

      if (currentCombined) {
        currentCombined.ids.push(item.id);
        if (tag) currentCombined.tags.push(tag);
        currentCombined.contents.push(content);
        if (item.attachments) {
          currentCombined.attachments = currentCombined.attachments.concat(
            item.attachments
          );
        }
      } else {
        currentCombined = {
          ids: [item.id],
          tags: tag ? [tag] : [],
          contents: [content],
          attachments: item.attachments ? [...item.attachments] : []
        };
      }
    } else {
      if (currentCombined) {
        combinedData.push({
          id: currentCombined.ids.join("__"),
          role: "user",
          content: `<${currentCombined.tags.join(", ")}> INFORMATION: usr has sent media files. Which describe: ${currentCombined.contents.join(". ")} ENDINFORMATION`,
          attachments: currentCombined.attachments
        });
        currentCombined = null;
      }
      combinedData.push(item);
    }
  }

  if (currentCombined) {
    combinedData.push({
      id: currentCombined.ids.join("__"),
      role: "user",
      content: `<${currentCombined.tags.join(", ")}> INFORMATION: usr has sent media files. Which describe: ${currentCombined.contents.join(". ")} ENDINFORMATION`,
      attachments: currentCombined.attachments
    });
  }

  return combinedData;
};

export const getCustomAccountName = (user: Account) => {
  const customNames = user.settings.custom_names;

  if (!customNames || customNames.length === 0) {
    return null;
  }

  const multiWordNames = customNames.filter(
    (name) => name.value.trim().split(/\s+/).length > 1
  );

  if (multiWordNames.length > 0) {
    return multiWordNames.reduce((longest, current) => {
      return current.value.trim().split(/\s+/).length >
        longest.value.trim().split(/\s+/).length
        ? current
        : longest;
    }, multiWordNames[0]).value;
  }

  return customNames.reduce((longest, current) => {
    return current.value.length > longest.value.length ? current : longest;
  }, customNames[0]).value;
};
