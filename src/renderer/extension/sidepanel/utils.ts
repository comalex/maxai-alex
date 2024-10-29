import type { Account, AccountSettings, Model } from "../config/types";
import { sentry } from "../sentryHelper";

export function convertHistoryToString(
  history,
  model,
  usernames = [],
  maxSentences = undefined
) {
  const mergeMessages = (messages) => {
    return messages
      .map((msg) => {
        // Split the content into sentences based on punctuation (., ?, !)
        const sentences = msg.content
          .split(/(?<=[.?!])\s+/)
          .filter(Boolean)
          .map((sentence) => {
            usernames
              ?.filter((username) => username !== " " && username !== null)
              .forEach((username) => {
                try {
                  // Split the username into parts (e.g., first and last name)
                  const nameParts = username?.split(" ");
                  nameParts?.forEach((part) => {
                    const regex = new RegExp(
                      `\\b${part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
                      "gi"
                    );
                    sentence = sentence.replace(
                      regex,
                      (match, offset, string) => {
                        const beforeChar = string[offset - 1];
                        const afterChar = string[offset + match.length];
                        if (
                          (beforeChar && /\w/.test(beforeChar)) ||
                          (afterChar && /\w/.test(afterChar)) ||
                          beforeChar === "'" ||
                          afterChar === "'"
                        ) {
                          return match;
                        }
                        return "[usr]";
                      }
                    );
                  });
                  // Ensure only one [usr] per username
                  sentence = sentence.replace(
                    /\[usr\](\s*\[usr\])+/gi,
                    "[usr]"
                  );
                } catch (error) {
                  sentry.captureException(error);
                  console.error(
                    "Error processing username replacement:",
                    error
                  );
                }
              });
            return sentence.replace(/\n$/, "");
          });

        // If maxSentences is undefined, use all sentences
        const limit =
          maxSentences === undefined ? sentences.length : maxSentences;

        // Join the first 'limit' sentences with a space
        const joinedSentences = sentences.slice(0, limit).join(" ");

        // Check if the last character is a punctuation mark or '>'
        const lastChar = joinedSentences.slice(-1);
        const needsPeriod = ![".", "?", "!", ">"].includes(lastChar);

        return joinedSentences?.trim() + (needsPeriod ? "." : "");
      })
      .join(" ");
  };

  let result = "";
  let currentRole = "";
  let currentMessages = [];

  if (history.length > 0 && history[0].role !== "user") {
    history.unshift({ role: "user", content: "<blank>" });
  }

  history.forEach((entry) => {
    if (entry?.content) {
      const parts = entry.content
        .split("\n")
        .filter(
          (part: string, index: number, array: string[]) =>
            part.trim() !== "" || index === array.length - 1
        );
      entry.content = parts.join(" ").trim();
      if (!entry.content.endsWith("\n")) {
        entry.content += "\n";
      }
    }

    // Change role 'user' to 'usr'
    const role = entry.role === "user" ? "usr" : entry.role;

    if (role !== currentRole) {
      if (currentMessages.length > 0) {
        result += `${currentRole}: ${mergeMessages(currentMessages)}\n`;
      }
      currentRole = role;
      currentMessages = [entry];
    } else {
      currentMessages.push(entry);
    }
  });

  if (currentMessages.length > 0) {
    result += `${currentRole}: ${mergeMessages(currentMessages)}\n`;
  }

  const formattedModel = model.replace(/Ai$/i, "").toUpperCase();
  return result.replace(/influencer:/gi, `${formattedModel}:`).trim();
}

// export function replaceInfluencerNameInString(
//   modelName: string,
//   names: string[],
//   inputString: string
// ) {
//   // Sort names by length in descending order to replace longer names first
//   const sortedNames = names.sort((a, b) => b.length - a.length);
//   const variations = sortedNames.map(
//     (name) => new RegExp(`\\b${name}\\b`, "gi")
//   );
//   return variations.reduce(
//     (str, regex) => str.replace(regex, modelName),
//     inputString
//   );
// }

const findFirstNameAndLastName = (names: string[]) => {
  let firstName = null;
  let lastName = null;
  names.forEach((name) => {
    const nameParts = name.split(" ");
    if (nameParts.length === 2) {
      [firstName, lastName] = nameParts;
    }
  });
  return { firstName, lastName };
};

export const replaceInfluencerNameInString = (
  modelName: string,
  names: string[],
  inputString: string
) => {
  const { firstName, lastName } = findFirstNameAndLastName(names);
  const modelNameParts = modelName.split(" ");
  if (modelNameParts.length === 1) {
    names.sort((a, b) => b.length - a.length);
    names.forEach((name) => {
      const nameRegex = new RegExp(`\\b${name}\\b`, "g");
      inputString = inputString.replace(nameRegex, modelName);
    });
  } else if (modelNameParts.length === 2) {
    const [modelFirstName, modelLastName] = modelName.split(" ");
    if (firstName) {
      const firstNameRegex = new RegExp(`\\b${firstName}\\b`, "g");
      inputString = inputString.replace(firstNameRegex, modelFirstName);
    }
    if (lastName) {
      const lastNameRegex = new RegExp(`\\b${lastName}\\b`, "g");
      inputString = inputString.replace(lastNameRegex, modelLastName);
    }
  }
  return inputString;
};

// export function replaceStringWithInfluencerName(
//   modelName: string,
//   names: string[],
//   inputString: string
// ) {
//   const regex = new RegExp(`\\b${modelName}\\b`, "gi");
//   return names.reduce((str, name) => str.replace(regex, name), inputString);
// }

// export const replaceStringWithInfluencerName = (
//   modelName: string | null,
//   names: string[] | null,
//   inputString: string
// ) => {
//   if (!modelName || !names || names.length === 0) {
//     return inputString;
//   }

//   const splitedNames = modelName.split(" ");
//   let nameVariations = [];
//   if (splitedNames.length > 1) {
//     nameVariations.push(modelName);
//     nameVariations = nameVariations.concat(splitedNames);
//   } else {
//     nameVariations = nameVariations.concat(modelName);
//   }
//   nameVariations.sort((a, b) => b.length - a.length);

//   const isNameVariationSameAsNames = nameVariations.some((variation) =>
//     names.includes(variation)
//   );
//   if (isNameVariationSameAsNames) {
//     const regex = new RegExp(`\\b(${nameVariations.join("|")})\\b`, "gi");
//     return inputString.replace(regex, (match) => {
//       return match.charAt(0).toUpperCase() + match.slice(1).toLowerCase();
//     });
//   }

//   nameVariations.forEach((variation) => {
//     const regex = new RegExp(`\\b${variation}\\b`, "gi");
//     inputString = inputString.replace(regex, names[0]);
//   });
//   return inputString;
// };

export const replaceStringWithInfluencerName = (
  account: Account,
  selectedModel: Model,
  inputString: string
) => {
  const {
    influencer_character: modelName,
    influencer_character_last_name: modelLastName
  } = selectedModel;
  const accountSettings: AccountSettings =
    account && account.settings ? account.settings : ({} as AccountSettings);
  const { first_name: accountFirstName, last_name: accountLastName } =
    accountSettings;

  if (accountFirstName) {
    if (modelName) {
      const modelNameRegex = new RegExp(
        `\\b${modelName}\\b|\\[ifirstname\\]`,
        "g"
      );
      inputString = inputString.replace(modelNameRegex, accountFirstName);
    }
    if (!accountLastName && modelLastName) {
      const modelLastNameRegex = new RegExp(
        `\\b${modelLastName}\\b|\\[ilastname\\]`,
        "g"
      );
      inputString = inputString.replace(modelLastNameRegex, "");
    }
  }
  if (accountLastName) {
    if (modelLastName) {
      const modelLastNameRegex = new RegExp(
        `\\b${modelLastName}\\b|\\[ilastname\\]`,
        "g"
      );
      inputString = inputString.replace(modelLastNameRegex, accountLastName);
    }
  }

  return inputString;
};

// export function replaceStringWithInfluencerName(
//   modelName: string,
//   names: string[],
//   inputString: string
// ) {
//   const longestFullName = names
//     .filter(name => name.trim().split(/\s+/).length > 1)
//     .reduce((longest, current) => current.length > longest.length ? current : longest, "");
//   const longestName = longestFullName || names.reduce((longest, current) => current.length > longest.length ? current : longest, "");
//   const regex = new RegExp(`\\b${modelName}\\b`, "gi");
//   return inputString.replace(regex, longestName);
// }

export const prepareMessagesPayload = (msg: any, originUserId) => {
  return msg?.map((message) => {
    const mediaArr = message.media
      .map((m) => {
        if (m.type && message.isFree)
          return m.type === "photo" ? "image" : m.type;
        if (m.type && !message.isFree && m.canView)
          return message.canPurchase
            ? `unpurchased_${m.type === "photo" ? "image" : m.type}`
            : `purchased_${m.type === "photo" ? "image" : m.type}`;
      })
      .filter((el) => el);
    let newMessage: {
      id: string | number;
      content: any;
      role: string;
      created_at: Date;
      updated_at: Date;
      attachments?: any[];
    } = {
      id: message.id,
      content:
        mediaArr.length > 0
          ? `<${mediaArr.join(", ")}>${message.text && ` ${message.text}\n`}`
          : `${message.text}\n`,
      role: message.fromUser.id === originUserId ? "influencer" : "user",
      created_at: message.createdAt,
      updated_at: message.changedAt
    };
    if (message.media.length > 0) {
      const filteredMedia = message.media
        .map((media) => {
          if (media.canView) {
            return {
              paid: message.isFree
                ? ""
                : message.canPurchase
                  ? "Not Paid"
                  : "Paid",
              type: media.type === "photo" ? "image" : media.type,
              url: media.src
            };
          }
        })
        .filter((el) => el);
      if (filteredMedia?.length) {
        newMessage.attachments = filteredMedia;
      }
    }
    return newMessage;
  });
};

const addImageInfoPrompt = (type: string) => {
  const mediaTypeRegex = /(image|video|audio)/i;

  if (mediaTypeRegex.test(type)) {
    if (type.includes("image") && type.includes("video")) {
      return "usr sent image(s) and / or video(s). The media shows:";
    } else if (type.includes("image")) {
      return "usr sent image(s). The image(s) show:";
    } else if (type.includes("video")) {
      return "usr sent video(s). The video(s) show:";
    }
  }

  return "";
};

export const aggregateUserContentWithTags = (data) => {
  const tagRegex = /^<[^>]+>(?: <[^>]+>)*$/;

  return data
    .reduce((acc, curr) => {
      if (
        curr.role === "user" &&
        (tagRegex.test(curr.content) || curr.content.trim() === "")
      ) {
        if (
          acc.length > 0 &&
          acc[acc.length - 1].role === "user" &&
          (tagRegex.test(acc[acc.length - 1].content) ||
            acc[acc.length - 1].content.trim() === "")
        ) {
          const previousContent = acc[acc.length - 1].content;
          const previousAttachments = acc[acc.length - 1].attachments || [];
          const currentAttachments = curr.attachments || [];
          const previousDescription = acc[acc.length - 1].description || "";
          const currentDescription = curr.description || "";

          acc[acc.length - 1].content =
            previousContent.replace(/>$/, "") +
            ", " +
            curr.content.replace(/^</, "");
          acc[acc.length - 1].attachments =
            previousAttachments.concat(currentAttachments);
          acc[acc.length - 1].description =
            previousDescription +
            (previousDescription ? ". " : "") +
            currentDescription;
        } else {
          acc.push(Object.assign({}, curr));
        }
      } else {
        acc.push(Object.assign({}, curr));
      }
      return acc;
    }, [])
    .map((el) => {
      let messageText = "";
      if (el.role === "influencer") {
        if (el.description) {
          messageText = `${el.content} ${el.description}`;
        }
      } else {
        if (el.description) {
          if (el.content.includes("audio")) {
            messageText = `${el.content} ${el.description}`;
          } else {
            messageText = `${el.content}${el.description ? ` INFORMATION: ${addImageInfoPrompt(el.content.trim())} ${el.description} ENDINFORMATION` : ""}\n`;
          }
        }
      }
      return {
        ...el,
        content: messageText || el.content
      };
    });
};

export const addDescriptionsToMessages = (data: {
  mediaDescriptions: any;
  messageHistory: any;
  user_id: string;
  agency: any;
  account: any;
}) => {
  const { mediaDescriptions, messageHistory, user_id, agency, account } = data;

  return messageHistory
    .map((message: { id: string | number; role: string; attachments: any }) => {
      if (mediaDescriptions[message.id]) {
        return {
          ...message,
          attachments: JSON.stringify(message.attachments),
          description: mediaDescriptions[message.id].description,
          user_id,
          external_id: message.id,
          agency_uuid: agency.uuid,
          account_uuid: account.uuid
        };
      }
    })
    .filter((el: any) => el);
};

export const addDescriptionsToAllMessages = (data: {
  mediaDescriptions: any;
  messageHistory: any;
  influencerAudioMessagesDescriptions: any[];
}) => {
  const {
    mediaDescriptions,
    messageHistory,
    influencerAudioMessagesDescriptions
  } = data;
  influencerAudioMessagesDescriptions.reverse();
  let audioIndex = 0;

  return [...messageHistory]
    .reverse()
    .map(
      (message: {
        id: string | number;
        role: string;
        attachments: any;
        content: string;
      }) => {
        if (
          message.role === "influencer" &&
          message.content.includes("audio>") &&
          influencerAudioMessagesDescriptions[audioIndex]
        ) {
          if (influencerAudioMessagesDescriptions[audioIndex]) {
            const audioDescription =
              influencerAudioMessagesDescriptions[audioIndex].description || "";
            audioIndex++;
            return {
              ...message,
              description: audioDescription
            };
          }
        } else if (mediaDescriptions[message.id]) {
          return {
            ...message,
            description: mediaDescriptions[message.id].description
          };
        } else {
          return message;
        }
      }
    )
    .reverse();
};

export const mergeInformationMarkers = (content: string, newInfo: string) => {
  const infoRegex = /INFORMATION: (.*?) ENDINFORMATION/g;
  const existingInfo = [...content.matchAll(infoRegex)].map(
    (match) => match[1]
  );
  if (existingInfo.length > 0) {
    const mergedInfo =
      existingInfo.join(". ") +
      ". " +
      newInfo.replace(/INFORMATION: | ENDINFORMATION/g, "");
    return (
      content.replace(infoRegex, "").trim() +
      ` INFORMATION: ${mergedInfo} ENDINFORMATION`
    );
  }
  return content.trim() + ` ${newInfo}`;
};

export const getTimezoneInfo = () => {
  const options = Intl.DateTimeFormat().resolvedOptions();
  const timezone = options.timeZone;

  const now = new Date();

  const utcOffsetMinutes = now.getTimezoneOffset();
  const utcOffsetHours = -(utcOffsetMinutes / 60);

  const formattedOffset = `UTC${utcOffsetHours >= 0 ? "+" : ""}${utcOffsetHours}:${Math.abs(utcOffsetMinutes) % 60 === 0 ? "00" : "30"}`;

  return {
    timezone,
    utcOffsetMinutes,
    formattedOffset,
    options
  };
};
