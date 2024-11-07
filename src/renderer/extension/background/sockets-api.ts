import io from "socket.io-client";
import { onMessage, sendMessage as __sendMessage } from "./bus";
import {
  CHAT_API_URL,
  CHAT_ID,
  EXTENSION_MESSAGE_TYPES,
  ExtensionMessageTypes
} from "../config/constants";
import {
  SOCKET_MESSAGE,
  type ExtensionMessage,
  type OnlyFansMessage
} from "../config/types";
import { EXT_VERSION } from "../sidepanel/Login";

// import { EXT_VERSION } from "~sidepanel/Login";

const _sendMessage = (props) => {
  __sendMessage({ ...props, socketApi: true });
};

const META = {
  EXT_VERSION
};


const sendMessage = (...args) => {
  try {
    args[1] = { ...args[1], ...META };
  } catch (error) {
    console.error("Error extending args[0] with META:", error);
  }

  if (!socket || !socket.connected) {
    socketInit(args[1].chat_jwt_token, () => {
      console.log("send", ...args);
      socket.emit(...args);
    });
  } else {
    console.log("send", ...args);
    socket.emit(...args);
  }
};

let socket;
let socketInit = (chatJwtToken: string, callback) => {
  if (socket && socket.connected) {
    console.log("Connected, no need to reconect");
    return;
  }
  try {
    if (socket) {
      socket.close();
    }
  } catch (error) {
    console.error("Error closing old socket:", error);
  }
  console.log("socketInit start", CHAT_API_URL);
  socket = io(CHAT_API_URL, { autoConnect: true, transports: ["websocket"] });

  socket?.on("connect_error", (error) => {
    console.log("Connection Error:", error);
  });

  socket?.on("error", (error) => {
    console.log("Error while connecting to socket");
    console.log({ error });
  });

  socket?.on("connect", () => {
    socket?.emit(SOCKET_MESSAGE.JOIN_ROOM, {
      chat_id: CHAT_ID,
      chat_jwt_token: chatJwtToken
    });
    const command = "disablevoice";
    // sendMessage({ content: `/${command}`, chatId: null });
    if (callback) {
      callback();
    }
  });

  socket?.on("free_trial_response", (data) => {
    console.log("free_trial_response", data);
  });

  socket?.on("command_response", (data) => {
    console.log("command_response", data);
    if (data.msg) {
      // decode data.msg and replace .com to empty string
      data.msg = decodeURIComponent(data.msg).replace(/.com/g, "");
      _sendMessage({
        type: EXTENSION_MESSAGE_TYPES.COMMAND_MESSAGE_TEXT,
        payload: {
          messageText: data.msg,
          type: ExtensionMessageTypes.COMMAND_MESSAGE_TEXT
        }
      });
    }
  });

  socket?.on("chat_action", (data) => {
    console.log("chat_action", data);
  });

  const handleSocketEvent = (eventType) => {
    socket?.on(eventType, (data) => {
      console.log(eventType, data);
      _sendMessage({
        type: eventType,
        payload: {
          messageText: data.msg
        }
      });
    });
  };

  handleSocketEvent(ExtensionMessageTypes.CUSTOM_MEDIA_REQUEST);
  handleSocketEvent(ExtensionMessageTypes.IRL_MEETING_REQUEST);
  handleSocketEvent(ExtensionMessageTypes.VIDEO_CHAT_REQUEST);
  handleSocketEvent(ExtensionMessageTypes.DISCOUNT_REQUEST);
  handleSocketEvent(ExtensionMessageTypes.GIFT_OPPORTUNITY);

  socket?.on("audio_response", (data) => {
    console.log("audio_response", data);
  });

  socket?.on(EXTENSION_MESSAGE_TYPES.LOGGER, (data) => {
    console.log(EXTENSION_MESSAGE_TYPES.LOGGER, data);
    _sendMessage({
      type: EXTENSION_MESSAGE_TYPES.LOGGER,
      payload: data
    });
  });

  socket?.on("generate_audio", (data) => {
    console.log("generate_audio", data);
    _sendMessage({
      type: EXTENSION_MESSAGE_TYPES.GENERATE_AUDIO,
      payload: {
        type: ExtensionMessageTypes.IMAGE_RESPONSE,
        file_url: data?.file_url
      }
    });
  });

  socket?.on("image_response", (data) => {
    _sendMessage({
      type: EXTENSION_MESSAGE_TYPES.COMMAND_MESSAGE_TEXT,
      payload: {
        type: ExtensionMessageTypes.IMAGE_RESPONSE,
        messageText: data.file_url
      }
    });
  });

  socket?.on("error", (message) => {
    const { msg } = message;
    _sendMessage({
      type: EXTENSION_MESSAGE_TYPES.ERROR,
      payload: {
        type: ExtensionMessageTypes.IMAGE_RESPONSE,
        payload: { messageText: msg }
      }
    });
  });

  socket?.on(SOCKET_MESSAGE.MESSAGE_RESPONSE, (message: any) => {
    console.log("message_response", message);
    const { msg, messageUuid, generateResponseId } = message;
    if (msg) {
        _sendMessage({
        type: EXTENSION_MESSAGE_TYPES.SUGGESTED_MESSAGE_TEXT,
        payload: { messageText: msg, messageUuid, generateResponseId }
      });
    }
  });

  socket?.on("disconnect", () => {
    console.log("socket disconnected");
    socket?.connect();
  });

  socket?.connect();
};

const sendMessageHistoryToServer = (
  jwt: string,
  model: string,
  username: string,
  user_id: string,
  messages: OnlyFansMessage[],
  lastUserMessage: string,
  accountUUID: string,
  msgGenerateResponseId: string
) => {
  const msg = {
    text: lastUserMessage,
    // text: "How about a video of you in that outfit? Something really kinky and daring, just for me to enjoy",
    // text: "How about we meet up in real life? I'd love to experience that connection face-to-face, feel your presence, and get to know you beyond the screen. 🖤",
    photo: false,
    ua: "Mozilla/5.0 (platform; rv:geckoversion) Gecko/geckotrail Firefox/firefoxversion",
    caption: "",
    // chat_id: CHAT_ID,
    chat_jwt_token: jwt,
    history: messages,
    influencer_uuid: model,
    accountUUID,
    is_extension: true,
    username,
    user_id,
    msgGenerateResponseId
  };
  console.log("sendMessageHistoryToServer", msg);
  sendMessage(SOCKET_MESSAGE.NEW_MESSAGE, msg);
};

export interface GenerateAudioParams {
  accountUUID: string;
  jwt: string;
  model: string;
  username: string;
  user_id: string;
  text: string;
}

const generateAudio = ({
  accountUUID,
  jwt,
  model,
  username,
  user_id,
  text
}: GenerateAudioParams) => {
  const msg = {
    text: text,
    accountUUID,
    command: SOCKET_MESSAGE.GENERATE_AUDIO,
    // text: "How about a video of you in that outfit? Something really kinky and daring, just for me to enjoy",
    // text: "How about we meet up in real life? I'd love to experience that connection face-to-face, feel your presence, and get to know you beyond the screen. 🖤",
    photo: false,
    ua: "Mozilla/5.0 (platform; rv:geckoversion) Gecko/geckotrail Firefox/firefoxversion",
    caption: "",
    // chat_id: CHAT_ID,
    chat_jwt_token: jwt,
    influencer_uuid: model,
    is_extension: true,
    username,
    user_id
  };

  // const command = "disablevoice";
  // sendMessage({ content: `/${command}`, chatId: null });

  console.log("generateAudio", msg);
  // sendMessage({ content: `/${SOCKET_MESSAGE.NEW_MESSAGE}`, chatId: null });
  sendMessage(SOCKET_MESSAGE.NEW_MESSAGE, msg);
  // sendMessage(SOCKET_MESSAGE.NEW_MESSAGE, msg);
};

onMessage.addListener(
  async (message: ExtensionMessage, sender, sendResponse) => {
    const { type } = message;
    if (message.socketApi) {
      console.log("pass message");
      return;
    }
    switch (type) {
      case EXTENSION_MESSAGE_TYPES.SEND_MESSAGE_HISTORY: {
        const {
          payload: {
            accountUUID,
            messages,
            lastUserMessage,
            jwt,
            model,
            username,
            user_id,
            generateResponseId
          }
        } = message;
        sendResponse({ status: "Message received" });
        sendMessageHistoryToServer(
          jwt,
          model,
          username,
          user_id,
          messages,
          lastUserMessage,
          accountUUID,
          generateResponseId
        );
        break;
      }
      case EXTENSION_MESSAGE_TYPES.GENERATE_AUDIO: {
        const {
          payload: { text, jwt, model, user_id, username, accountUUID }
        } = message;
        sendResponse({ status: "Message received" });
        generateAudio({
          accountUUID,
          jwt,
          model,
          username,
          user_id,
          text
        });
        break;
      }
      default: {
        return true;
      }
    }
  }
);
