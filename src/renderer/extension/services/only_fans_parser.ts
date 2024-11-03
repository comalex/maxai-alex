import { getWebviewHTML } from "../../utils";
import { Status } from "../config/constants";
import {
  type Message,
  type OnlyFansMessage,
  type Payment,
  PaymentType
} from "../config/types";
import { generateMessageId } from "../services/utils";

export const ONLY_FANS_ELEMENT_CLASS_NAMES = {
  CHAtS_CONVERSATION_CONTAINER: "b-chats__conversations-content",
  CHATS_CONVERSATION_SCROLL_WRAPPER: "b-chats__scrollbar",
  CHATS_CONVERSATION_WRAPPER: "b-chat__messages-wrapper",
  CHAT_MESSAGE_MEDIA_WRAPER: "b-chat__message__media-wrapper",
  CHAT_MESSAGE_MEDIA_ITEM_CONTAINER: "b-post__media__item-inner",
  CHAT_MESSAGE_AUDIO_ITEM_CONTAINER: "chat-audio",
  MESSAGE_SECTION: "b-chat__item-message",
  CHAT_MESSAGE: "b-chat__message",
  CHAT_MESSAGE_TEXT_BODY: "b-chat__message__body",
  CHAT_MESSAGE_TEXT: "b-chat__message__text",
  MESSAGE_FROM_ME: "m-from-me"
};

function stableStringify(obj: any): string {
  if (typeof obj !== "object" || obj === null) {
    return JSON.stringify(obj);
  }

  const sortedObj = Array.isArray(obj)
    ? obj.map(stableStringify)
    : Object.keys(obj)
        .sort()
        .reduce((acc, key) => {
          acc[key] = stableStringify(obj[key]);
          return acc;
        }, {} as any);

  return JSON.stringify(sortedObj);
}

const determinePaymentStatus = (messageElement: Element): string => {
  const contentMessageElement = messageElement.closest(
    ".b-chat__message__content"
  );
  const nextTimeElement = contentMessageElement?.nextElementSibling;
  const paymentStateElement = nextTimeElement?.querySelector(
    ".b-chat__message__payment-state"
  );
  let paid = "";

  if (paymentStateElement) {
    paid = /not/.test(paymentStateElement.textContent || "")
      ? "unpurchased"
      : "purchased";
  }

  return paid;
};

export const parsePayments = (document: Document): Payment[] => {
  const messageContainers = document.querySelectorAll(
    `.${ONLY_FANS_ELEMENT_CLASS_NAMES.MESSAGE_SECTION}`
  );
  const messages: Payment[] = [];
  messageContainers?.forEach((parent) => {
    try {
      const messageElements = parent.querySelectorAll(
        '[at-attr="chat_message"]'
      );
      const parentTimeElement = parent.querySelector(
        ".b-chat__message__system.m-timeline .b-chat__messages__time span"
      );
      Array.from(messageElements).forEach((messageEl) => {
        const tipElement = messageEl.querySelector(
          '.b-chat__message__tip-text [at-attr="msg_tip"]'
        );
        const priceElement =
          tipElement || messageEl.querySelector('[at-attr="payment_state"]');
        // if (messageEl.querySelector(".b-chat__replied-message") && priceElement) {
        //   debugger;
        // }
        if (
          messageEl.querySelector(".b-chat__replied-message") &&
          messageEl.querySelectorAll(".m-message-content-bg").length <= 1
        ) {
          return;
        }

        const parentElement = priceElement?.closest(".b-chat__message__time");
        const previousSibling = parentElement?.previousElementSibling;
        const mediaContainer = previousSibling?.querySelector(
          ".b-chat__message__media-wrapper"
        );
        let mediaItem = mediaContainer?.querySelectorAll(
          '[at-attr="media_locator"]'
        );
        let mediaPaymentTypes = [];
        const audioItem = mediaContainer?.querySelector(".b-audioplayer");
        if (audioItem) {
          mediaPaymentTypes.push("audio");
        } else {
          mediaItem?.forEach((item) => {
            const videoType = item.querySelector(".video-js");
            const imageType = item.querySelector("img");
            const gifType = item.querySelector(".post_gif");
            if (videoType) {
              mediaPaymentTypes.push("video");
            } else if (imageType) {
              mediaPaymentTypes.push("image");
            } else if (gifType) {
              mediaPaymentTypes.push("gif");
            }
          });
        }

        const id = "";
        const priceText = priceElement ? priceElement.textContent.trim() : "";
        const priceMatch = priceText.match(/\$(\d+(\.\d{1,2})?)/);
        const price = priceMatch ? parseFloat(priceMatch[1]) : 0;
        const paidStatus = tipElement
          ? Status.paid
          : priceText.includes("not paid yet")
            ? Status.notPaid
            : Status.paid;

        let timeElement = messageEl.querySelector(
          ".b-chat__message__time > span[title]"
        );

        if (messageEl.classList.contains("m-time-hidden")) {
          let sibling = messageEl.nextElementSibling;
          for (
            let attempts = 0;
            sibling &&
            sibling.classList.contains("m-time-hidden") &&
            attempts < 3;
            attempts++
          ) {
            sibling = sibling.nextElementSibling;
          }
          if (sibling && !sibling.classList.contains("m-time-hidden")) {
            timeElement = sibling.querySelector(
              ".b-chat__message__time > span[title]"
            );
          }
        }
        // if (!timeElement) {
        //   timeElement = parent.querySelector(".b-chat__message__time > span");
        // }
        let fullDateText = parentTimeElement
          ? parentTimeElement.getAttribute("title")
          : null; // May 9, 12:00 am
        if (fullDateText === "Today") {
          fullDateText = new Date().toLocaleDateString();
        } else if (fullDateText === "Yesterday") {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          fullDateText = yesterday.toLocaleDateString();
        }

        const dateText = fullDateText ? fullDateText.split(",")[0] : null; // Extract only the date part
        let timeText = timeElement ? timeElement.textContent.trim() : null;
        if (!timeText) {
          let sibling = messageEl.nextElementSibling;
          while (sibling) {
            const timeSpan = sibling.querySelector(
              "span.b-chat__message__time"
            );
            if (timeSpan) {
              timeText = timeSpan.textContent.trim();
              break;
            }
            sibling = sibling.nextElementSibling;
          }
        }

        let year: number | string = new Date().getFullYear(); // Default to current year

        // Check if fullDateText contains a year
        const yearMatch =
          parentTimeElement && parentTimeElement.textContent
            ? parentTimeElement.textContent.match(/\b\d{4}\b/)
            : fullDateText
              ? fullDateText.match(/\b\d{4}\b/)
              : null;
        if (yearMatch) {
          year = yearMatch[0];
        }

        if (year) {
          timeText = timeText
            .replace("Today", "")
            .replace("Yesterday", "")
            .trim();
        }
        const dateTimeString =
          dateText && timeText ? `${dateText}, ${year}, ${timeText}` : null;
        let time = "";
        if (dateTimeString) {
          try {
            const parsedDate = Date.parse(
              dateTimeString.replace(
                "Today",
                new Date().toISOString().split("T")[0]
              )
            );
            if (!isNaN(parsedDate)) {
              const localDate = new Date(parsedDate);
              // PREVENT DOUBLE SUB of timezone shift
              // const utcDate = new Date(
              //   localDate.getUTCFullYear(),
              //   localDate.getUTCMonth(),
              //   localDate.getUTCDate(),
              //   localDate.getUTCHours(),
              //   localDate.getUTCMinutes(),
              //   localDate.getUTCSeconds()
              // );
              // time = utcDate.toISOString();
              time = localDate.toISOString();
            } else {
              time = "";
            }
          } catch (error) {
            console.error("Error parsing dateTimeString:", error);
          }
        }
        const statusElement = messageEl.querySelector(
          'svg[data-icon-name="icon-done-all"]'
        );
        const status = statusElement ? Status.read : Status.notRead;

        const imageElement = messageEl.querySelector("img");
        const imageUrl = imageElement ? imageElement.src : null;
        const messageType = tipElement ? PaymentType.TIP : PaymentType.PURCHASE;

        const isMessageFromMe = messageEl.classList.contains(
          ONLY_FANS_ELEMENT_CLASS_NAMES.MESSAGE_FROM_ME
        );

        if (isMessageFromMe && messageType === PaymentType.TIP) {
          // we don't want to show payments not from us
          return;
        }
        // if (time === "" || time === undefined || time === null) {
        //   debugger;
        // }

        messages.push({
          id,
          price,
          time,
          status,
          paidStatus,
          imageUrl,
          type: messageType,
          vaultName: "Unknown", // Assuming vault name is unknown for simplicity
          content: messageEl ? messageEl.textContent.trim() : null,
          mediaTypes: mediaPaymentTypes
        });
      });
    } catch (e) {
      console.log(e);
    }
  });

  const filteredMessages = messages.filter((p) => p.price !== 0);

  // Prevent duplicate times in case of multiple payments in the same second
  const adjustDuplicateTimes = (messages: Payment[]) => {
    const timeMap = new Map();

    messages.forEach((message) => {
      let originalTime = message.time;
      while (timeMap.has(originalTime)) {
        let newTime = new Date(originalTime);
        newTime.setSeconds(newTime.getSeconds() + 1);
        message.time = newTime.toISOString();
        originalTime = message.time;
      }
      timeMap.set(message.time, true);
    });

    return messages;
  };

  const adjustedMessages = adjustDuplicateTimes(filteredMessages);
  return adjustedMessages;
};

export const isProcessingContentPresent = (): boolean => {
  const processingContentElement = doc.querySelector(
    "div.b-processing-content"
  );
  const spinnerElement = doc.querySelector(
    'div.b-audioplayer svg[data-icon-name="icon-loading"]'
  );
  return !!processingContentElement || !!spinnerElement;
};

export const refreshOfPage = (): void => {
  try {
    window.location.reload();
  } catch (error) {
    console.log(error);
  }
};

export const parseSubsFun = () => {
  const subs = [];

  const accountsTable = doc.querySelector(
    "table.b-table.m-responsive.m-default-table.m-bottom-gap"
  );
  if (accountsTable) {
    const userRows = accountsTable.getElementsByTagName("tr");
    for (const userRow of userRows) {
      const userId = userRow.querySelector("span.g-user-username");
      const subPrice = userRow.querySelector(
        "td.m-responsive__grid__data-cell.m-fans-table-cell"
      );
      let subDuration = userRow.querySelector("td.text-right");
      const userName = userRow.querySelector("div.g-user-name");

      const subDate = subDuration?.textContent?.trim()?.includes(",")
        ? (() => {
            const dateParts = subDuration?.textContent?.trim().split(", ");
            const [monthDay, year] = dateParts;
            const date = new Date(`${monthDay} ${year} UTC`);
            date.setUTCHours(0, 0, 0, 0);
            return date;
          })()
        : null;

      if (subDate) {
        subDuration = null;
      }

      const subPriceText = subPrice?.textContent?.trim();
      const subPriceValue =
        subPriceText === "free"
          ? 0.0
          : parseFloat(subPriceText?.replace("$", "") || "")?.toFixed(2) || "";
      if (userName?.textContent?.trim()) {
        subs.push({
          userName: userName?.textContent?.trim() || "",
          userId: userId?.textContent?.trim() || "",
          subPrice: subPriceValue || "0.00",
          subDuration: subDuration?.textContent?.trim() || null,
          subDate: subDate || null
        });
      }
    }
  }
  return subs;
};

export async function getDocument(currentWebviewId: string): Promise<Document> {
  const parser = new DOMParser();
  const htmlString = await getWebviewHTML(currentWebviewId);
  // console.log("htmlString", htmlString)
  return parser.parseFromString(htmlString || '', 'text/html');
}



export const parseMessagesFromSelectedThread = async (currentWebviewId: string): Message => {
  const messages: OnlyFansMessage[] = [];
  const doc = await getDocument(currentWebviewId);
  // console.log("doc", doc)
  let currentUsernameElement = doc.querySelector(
    "div.current span.g-user-name"
  );
  if (!currentUsernameElement) {
    currentUsernameElement = doc.querySelector(
      "div.g-user-name.m-nowrap-text span.g-user-name"
    );
  }
  const currentUsername = currentUsernameElement
    ? currentUsernameElement.childNodes[0].textContent.trim()
    : null;

  let changedUserNameElement =
    currentUsernameElement.querySelector("span.g-gray-text");
  if (!changedUserNameElement) {
    changedUserNameElement = currentUsernameElement.nextElementSibling || null;
  }
  const customUserName = changedUserNameElement
    ? changedUserNameElement.textContent.replace(/[()]/g, "").trim()
    : null;

  const currentUserIdElement = doc.querySelector(
    ".b-chat__header__wrapper .g-user-realname__wrapper"
  );
  const user_id = currentUserIdElement
    ? currentUserIdElement.getAttribute("href")?.replace("/", "").trim()
    : null;
  const chatsConversationWrapper = doc.querySelector(
    `div.${ONLY_FANS_ELEMENT_CLASS_NAMES.CHAtS_CONVERSATION_CONTAINER} .${ONLY_FANS_ELEMENT_CLASS_NAMES.CHATS_CONVERSATION_WRAPPER}`
  );
  if (!chatsConversationWrapper) {
    return null;
  }
  const messageSections = chatsConversationWrapper.querySelectorAll(
    `div.${ONLY_FANS_ELEMENT_CLASS_NAMES.MESSAGE_SECTION}`
  );
  messageSections.forEach((messageSection) => {
    const parentTimeElement = messageSection.querySelector(
      ".b-chat__message__system.m-timeline .b-chat__messages__time span"
    );

    let timeElement = messageSection.querySelector(
      ".b-chat__message__time > span[title]"
    );

    let fullDateText = parentTimeElement
      ? parentTimeElement.getAttribute("title")
      : null; // May 9, 12:00 am
    if (fullDateText === "Today") {
      fullDateText = new Date().toLocaleDateString();
    } else if (fullDateText === "Yesterday") {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      fullDateText = yesterday.toLocaleDateString();
    }

    const dateText = fullDateText ? fullDateText.split(",")[0] : null; // Extract only the date part
    let timeText = timeElement ? timeElement.textContent.trim() : null;
    if (!timeText) {
      let sibling = messageSection.nextElementSibling;
      while (sibling) {
        const timeSpan = sibling.querySelector("span.b-chat__message__time");
        if (timeSpan) {
          timeText = timeSpan.textContent.trim();
          break;
        }
        sibling = sibling.nextElementSibling;
      }
    }

    let year: number | string = new Date().getFullYear(); // Default to current year

    // Check if fullDateText contains a year
    const yearMatch =
      parentTimeElement && parentTimeElement.textContent
        ? parentTimeElement.textContent.match(/\b\d{4}\b/)
        : fullDateText
          ? fullDateText.match(/\b\d{4}\b/)
          : null;
    if (yearMatch) {
      year = yearMatch[0];
    }

    if (year) {
      timeText = timeText.replace("Today", "").replace("Yesterday", "").trim();
    }
    const dateTimeString =
      dateText && timeText ? `${dateText}, ${year}, ${timeText}` : null;
    let time = "";
    if (dateTimeString) {
      try {
        const parsedDate = Date.parse(
          dateTimeString.replace("Today", new Date().toLocaleDateString())
        );
        time = isNaN(parsedDate) ? "" : new Date(parsedDate).toISOString();
      } catch (error) {
        console.error("Error parsing dateTimeString:", error);
      }
    }

    const chatMessages = messageSection.querySelectorAll(
      `div.${ONLY_FANS_ELEMENT_CLASS_NAMES.CHAT_MESSAGE}`
    );
    chatMessages.forEach((chatMessageElement) => {
      try {
        const messageId = generateMessageId(chatMessageElement);

        const isMessageFromMe = chatMessageElement.classList.contains(
          ONLY_FANS_ELEMENT_CLASS_NAMES.MESSAGE_FROM_ME
        );
        const chatMessageBody = chatMessageElement.querySelector(
          `div.${ONLY_FANS_ELEMENT_CLASS_NAMES.CHAT_MESSAGE_TEXT_BODY}`
        );
        if (chatMessageBody) {
          const chatMessageBodyChildDivs =
            chatMessageBody.querySelectorAll("div");
          chatMessageBodyChildDivs.forEach((chatMessageBodyChildElement) => {
            try {
              if (
                chatMessageBodyChildElement.classList.contains(
                  ONLY_FANS_ELEMENT_CLASS_NAMES.CHAT_MESSAGE_TEXT
                )
              ) {
                const tipTextElement =
                  chatMessageBodyChildElement.querySelector(
                    "span.b-chat__message__tip-text"
                  );
                if (tipTextElement?.textContent) {
                  const messageTip = chatMessageBodyChildElement.querySelector(
                    "span.b-chat__message__text-content"
                  )?.textContent;
                  const regex = /\$\d+(\.\d{2})?/;
                  const match = tipTextElement?.textContent.match(regex);
                  const regexForPost = /under this/;
                  const amount = match[0];
                  if (!messageTip || messageTip?.[0] !== "“") {
                    const tipContent = regexForPost.test(
                      tipTextElement?.textContent
                    )
                      ? `<${amount}_tip_for_post> ${messageTip || ""}`
                      : `<${amount}_tip> ${messageTip || ""}`;
                    messages.push({
                      id: messageId + "_" + tipContent.length,
                      role: isMessageFromMe ? "influencer" : "user",
                      content: tipContent,
                      time: time
                    });
                  }
                } else {
                  messages.push({
                    id:
                      messageId +
                      "_" +
                      chatMessageBodyChildElement.textContent.length,
                    role: isMessageFromMe ? "influencer" : "user",
                    content: chatMessageBodyChildElement.textContent,
                    time: time
                  });
                }
              } else if (
                chatMessageBodyChildElement.classList.contains(
                  ONLY_FANS_ELEMENT_CLASS_NAMES.CHAT_MESSAGE_MEDIA_WRAPER
                )
              ) {
                const mediaItemContainers =
                  chatMessageBodyChildElement.querySelectorAll(
                    `div.${ONLY_FANS_ELEMENT_CLASS_NAMES.CHAT_MESSAGE_MEDIA_ITEM_CONTAINER}`
                  );
                const audioItemContainers =
                  chatMessageBodyChildElement.querySelectorAll(
                    `div.${ONLY_FANS_ELEMENT_CLASS_NAMES.CHAT_MESSAGE_AUDIO_ITEM_CONTAINER}`
                  );
                const gimpMessages =
                  chatMessageBodyChildElement.querySelectorAll(
                    "img.m-giphy-img"
                  );
                const mediaUrls = [];
                gimpMessages.forEach((gimpMessage) => {
                  const gifUrl = gimpMessage?.getAttribute("src");
                  if (gifUrl) {
                    mediaUrls.push({
                      type: "image",
                      url: gifUrl,
                      paid: determinePaymentStatus(gimpMessage)
                    });
                  }
                });
                mediaItemContainers.forEach((mediaItemContainer) => {
                  try {
                    const imageElement =
                      mediaItemContainer.querySelector("img");
                    const videoElement =
                      mediaItemContainer.querySelector(".video-js");
                    const gifElement =
                      mediaItemContainer.querySelector(".post_gif");
                    if (gifElement) {
                      const backgroundImage =
                        gifElement.querySelector(".b-post__media-bg");

                      if (backgroundImage) {
                        const style = backgroundImage.getAttribute("style");
                        const urlMatch = style.match(/url\("(.+?)"\)/);
                        if (urlMatch) {
                          mediaUrls.push({
                            type: "image",
                            url: urlMatch[1],
                            paid: determinePaymentStatus(gifElement)
                          });
                        }
                      }
                    } else if (videoElement) {
                      const videoPreviewElement =
                        videoElement.querySelector("img");
                      mediaUrls.push({
                        type: "video",
                        url: videoPreviewElement?.src || "",
                        paid: determinePaymentStatus(videoElement)
                      });
                    } else if (imageElement) {
                      mediaUrls.push({
                        type: "image",
                        url: imageElement.src,
                        paid: determinePaymentStatus(imageElement)
                      });
                    }
                  } catch (error) {
                    console.error(
                      "Error processing media item container:",
                      error
                    );
                  }
                });
                audioItemContainers.forEach((audioItemContainer) => {
                  try {
                    const audioElement =
                      audioItemContainer.querySelector(".b-audioplayer");
                    if (audioElement) {
                      const audioTime = audioElement.querySelector(
                        ".b-audioplayer__timing"
                      ).textContent;
                      mediaUrls.push({
                        type: "audio",
                        url: "audio" + audioTime,
                        paid: determinePaymentStatus(audioElement)
                      });
                    }
                  } catch (error) {
                    console.error(
                      "Error processing audio item container:",
                      error
                    );
                  }
                });

                if (mediaUrls.length > 0) {
                  const role = isMessageFromMe ? "influencer" : "user";
                  const mediaTypes = mediaUrls
                    .map((media) =>
                      media.paid ? media.paid + "_" + media.type : media.type
                    )
                    .join(", ");
                  const mediaIdentString = mediaUrls
                    .map((media) =>
                      media.type === "image" || media.type === "video"
                        ? media.url?.split("/")[6]
                        : media.url
                    )
                    .join(", ");
                  messages.push({
                    id: mediaIdentString,
                    role: role,
                    content: `<${mediaTypes}>`,
                    attachments: mediaUrls,
                    time: time
                  });
                }
              }
            } catch (error) {
              console.error(
                "Error processing chat message body child element:",
                error
              );
            }
          });
        }
      } catch (error) {
        console.error("Error processing chat message element:", error);
      }
    });
  });
  let payments = [];
  try {
    payments = parsePayments(doc);
  } catch (e) {
    console.log(e);
  }

  let accountId = getAccountIdFromProfile(doc);
  let accountName = getAccountNameFromProfile(doc);
  const result = {
    accountId,
    accountName,
    user_id: user_id,
    username: currentUsername,
    customUsername: customUserName,
    messages: messages.map((m) => {
      const messageCopy = {
        ...m,
        attachments: m?.attachments
          ? m?.attachments?.map((a) => ({ ...a, url: m.id, paid: "" }))
          : []
      };
      return {
        ...m,
        id: stableStringify(messageCopy)
          .split('')
          .map((char) => char.charCodeAt(0).toString(16).padStart(2, '0'))
          .join('')
      };
    }),
    payments: payments.map((payment) => ({ ...payment, user_id }))
  };

  console.log("Parsed data:", result);

  return result;
};

export function getAccountNameFromProfile(doc): string | null {
  const profileElement = doc.querySelector(".g-user-name.m-verified");
  if (profileElement) {
    // Extract the text content and trim any extra whitespace
    const accountName = profileElement.childNodes[0].textContent?.trim();
    return accountName || null;
  }
  return null;
}

export function getAccountIdFromProfile(doc): string | null {
  const profileElement = doc.querySelector('a[data-name="Profile"]');
  let accountId = null;
  if (profileElement) {
    const href = profileElement.getAttribute("href");
    return href ? href.replace(/\//g, "").trim() : null;
  }
  return accountId;
}
