import { sendMessage, onMessage } from "../../background/bus";

import { useState, useEffect } from "react";
import { EXTENSION_MESSAGE_TYPES } from "../../config/constants";
import type { ExtensionMessage } from "../../config/types";

import { useGlobal } from "./useGlobal";
import useTimeoutNotification from "./useTimeoutNotification";
// import browserRuntime from "../../browserRuntime";

interface GenerateAudioPayload {
  jwt: string;
  text: string;
  username: string;
  model?: string;
  user_id: string;
  accountUUID: string;
}

const useAudioGenerator = () => {
  const { selectedModel, userId, chatJwtToken, accountName, currentWebviewId } = useGlobal();
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isAudioGenerating, setIsAudioGenerating] = useState<boolean>(false);

  // useTimeoutNotification({
  //   loading: isAudioGenerating,
  //   msg: `Audio generation for ${accountName} is taking too long`
  // });

  const clear = (): void => {
    setAudioUrl(null);
    setIsAudioGenerating(false);
  };

  const _onMessage = (
    message: ExtensionMessage,
    sender: browserRuntime.MessageSender,
    sendResponse: (response: any) => void
  ): void => {
    if (!message.socketApi) {
      console.log("pass in onMessageSockets");
      return;
    }
    // logger.debug("useAudioGenerator onMessage", message);
    const { type } = message;
    switch (type) {
      case EXTENSION_MESSAGE_TYPES.GENERATE_AUDIO: {
        const {
          payload: { file_url }
        } = message;
        sendResponse({ status: "Message received" });
        setIsAudioGenerating(false);
        setAudioUrl(file_url);
        break;
      }

    }
  };

  useEffect(() => {
    onMessage.addListener(_onMessage);

    return () => {
      onMessage.removeListener(_onMessage);
    };
  }, []);

  const generateAudio = (text: string, accountUUID: string): void => {
    setIsAudioGenerating(true);
    const payload: GenerateAudioPayload = {
      accountUUID,
      jwt: chatJwtToken,
      text,
      username: "handsome",
      model: selectedModel?.uuid,
      user_id: userId
    };
    sendMessage({
      type: EXTENSION_MESSAGE_TYPES.GENERATE_AUDIO,
      payload,
      currentWebviewId,
    });
  };

  return {
    generateAudio,
    isAudioGenerating,
    audioUrl,
    setIsAudioGenerating,
    clear
  };
};

export default useAudioGenerator;
