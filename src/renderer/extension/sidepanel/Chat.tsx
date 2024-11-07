import { sendMessage, onMessage as _onMessage } from "../background/bus";
import {
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from "@chakra-ui/icons";
import {
  Box,
  Button,
  Card,
  CardBody,
  Center,
  IconButton,
  Spinner,
  Text,
  Textarea,
  Tooltip,
  useToast,
  VStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  HStack,
  useColorMode,
  Input,
  useRadioGroup,
  Image,
  Icon
} from "@chakra-ui/react";
import EmojiPicker from "emoji-picker-react";
import emojiRegex from "emoji-regex";
import { isArray } from "lodash";
// import spinnerGif from "../../public/images/generate_response_spinner.gif";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement
} from "react";
import { BiError } from "react-icons/bi";
import { TbDiscount } from "react-icons/tb";
import {
  DEFAULT_DRIP_MESSAGE,
  EXTENSION_MESSAGE_TYPES,
  ExtensionMessageTypes,
  MESSAGE_INTENT_ENGINE_TYPE
} from "../config/constants";
import {
  PageName,
  type CustomContentPricing,
  type ExtensionMessage,
  type MessageWithFeedbackInput,
  type OnlyFansMessage
} from "../config/types";
import {
  ArrowRightIcon,
  CopyIcon,
  DownloadAudioIcon,
  EmojiIcon,
  IRLMeetingIcon,
  PencilIcon,
  RoundedCircleIcon,
  SparkleIcon,
  SpeakerIcon,
  StrikeIcon,
  VaultIcon,
  VideoChatIcon
} from "../icons";
import { sentry } from "../sentryHelper";
import Descriptions from "../sidepanel/components/Descriptions";
import MainLoader from "../sidepanel/components/MainLoader";
import { ModelSelect } from "../sidepanel/components/ModelSelect";
import { useGlobal } from "../sidepanel/hooks/useGlobal";
import { useIsPermitted } from "../sidepanel/hooks/useIsPermitted";

import { getProcessedUserMessageSettings } from "./AIModelSettings";
import { downloadAudio } from "./VoicePage";
import { api } from "./api";
import AudioPlayer from "./components/AudioPlayer";
import ClockOutButton from "./components/ClockOutButton";
import CustomMediaRequestCard from "./components/CustomMediaRequestCard";
import { formatDate } from "./components/CustomRequestTracker";
import Deprioritized from "./components/Deprioritized";
import DividerWithText from "./components/DividerWithText";
import {
  FeedbackButtons,
  FeedbackProvider,
  FeedbackTextarea
} from "./components/Feedback";
import NoUserSelected from "./components/NoUserSelected";
import PaymentSummary from "./components/Payments";
import { RadioCard } from "./components/RadioCard";
import TimerManager, { AddTimer } from "./components/TimerManager";
import UserNote from "./components/UserNote";
import useAudioGenerator from "./hooks/useAudioGenerator";
import { useMessages } from "./hooks/useMessages";
import { usePayments } from "./hooks/usePayments";
import usePostMedia from "./hooks/usePostMedia";
import useUserHook from "./hooks/useUser";
import useWindowSize from "./hooks/useWindowSize";
import {
  addDescriptionsToAllMessages,
  addDescriptionsToMessages,
  aggregateUserContentWithTags,
  convertHistoryToString,
  mergeInformationMarkers,
  replaceInfluencerNameInString
} from "./utils";

const replacePlaceholdersWithPrices = (
  messageText: string,
  pricing: CustomContentPricing[] | null
) => {
  let updatedMessage = messageText;
  pricing?.forEach((item) => {
    const placeholder = item.value;
    const priceDescription = `${item.description} - $${item.price}`;
    updatedMessage = updatedMessage.replace(placeholder, priceDescription);
  });
  return updatedMessage;
};

interface ChatProps {
  chatJwtToken: string;
}

const Chat: React.FC<ChatProps> = ({ chatJwtToken }) => {
  const {
    setUserId,
    userId: user_id,
    selectedModel,
    logger,
    setActiveTab,
    isDebugMode,
    jwtToken,
    setAccountId,
    account,
    agency,
    setAccountName,
    lastFanSpend,
    userUUID,
    payments,
    accountName,
    autoPlayState,
    setAutoPlayState,
    activeTab,
    expandSimulateBlock,
    setExpandSimulateBlock,
    autoGenerateResponseState,
    voiceGenAbility,
    currentWebviewId,
  } = useGlobal();
  const { isPermitted } = useIsPermitted();

  const prevPaymentsRef = useRef(payments);
  const [stopGenerationState, setStopGenerationState] =
    useState<boolean>(false);

  const latestStateRef = useRef({
    account,
    user_id,
    autoGenerateResponseState,
    stopGenerationState
  });

  const {
    user,
    setUserData,
    fetchedUserData,
    inputCustomUserName,
    setInputCustomUserName,
    updUserCustomName
  } = useUserHook();

  const { colorMode } = useColorMode();
  const { width: windowWidth } = useWindowSize();

  useEffect(() => {
    setInputCustomUserName(user?.currentUserName);
  }, [user]);

  useEffect(() => {
    latestStateRef.current = {
      account,
      user_id,
      autoGenerateResponseState,
      stopGenerationState
    };
  }, [account, user_id, autoGenerateResponseState, stopGenerationState]);

  useEffect(() => {
    if (user_id) setIsPictureInfo(false);
  }, [user_id]);

  const {
    getMessagesContent,
    content,
    errorGettingMessagesContent,
    setErrorGettingMessagesContent
  } = useMessages();
  const { syncPayments } = usePayments();
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const [userGeneratesResponse, setUserGeneratesResponse] = useState<
    string | null
  >(null);
  const [charactersRemaining, setCharactersRemaining] = useState(0);
  const generateResponseIdRef = useRef<string>();

  useEffect(() => {
    if (isGeneratingResponse) {
      setUserGeneratesResponse(user_id);
    } else {
      setUserGeneratesResponse(null);
    }
  }, [isGeneratingResponse]);

  useEffect(() => {
    if (errorGettingMessagesContent && isGeneratingResponse) {
      stopGeneration();
      setErrorGettingMessagesContent(null);
    }
  }, [errorGettingMessagesContent, isGeneratingResponse]);

  // useTimeoutNotification({
  //   loading: isGeneratingResponse,
  //   msg: `response is too long for model ${selectedModel?.name}`
  // });

  const [debugHistory, setDebugHistory] = useState<any>();
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setOnline] = useState(false);
  const {
    generateAudio,
    setIsAudioGenerating,
    isAudioGenerating,
    audioUrl,
    clear: clearAudio
  } = useAudioGenerator();
  const [suggestedMessageText, _setSuggestedMessageText] = useState<
    string | null
  >(null);
  const [copiedText, setCopiedText] = useState<string>("");
  const [showSuggestedMessageBox, setShowSuggestedMessageBox] = useState(false);
  const [messageUUID, setMessageUUID] = useState<string>();
  const [moderationFilterTriggered, setModerationFilterTriggered] =
    useState<boolean>(false);
  const [loadPaymentsData, setLoadPaymentsData] = useState<boolean>(false);
  const [toggleStopGenerationButton, setToggleStopGenerationButton] =
    useState<boolean>(false);
  const [toggleAutoGeneration, setToggleAutoGeneration] =
    useState<boolean>(false);

  const textareaRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [
    suggestedMessageText,
    showSuggestedMessageBox,
    toggleStopGenerationButton,
    activeTab
  ]);

  const insertEmoji = (emoji) => {
    const textarea = textareaRef.current;
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;

    const updatedText = `${suggestedMessageText.slice(0, startPos)}${emoji}${suggestedMessageText.slice(endPos)}`;
    setSuggestedMessageText(updatedText, messageUUID, true);

    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = startPos + emoji.length;
      textarea.focus();
    }, 0);

    adjustTextareaHeight();
  };

  useEffect(() => {
    if (suggestedMessageText) {
      setShowSuggestedMessageBox(true);
    }
  }, [suggestedMessageText]);

  const fetchAgency = async () => {
    if (jwtToken) {
      try {
        const agencyData = await api.getAgency(jwtToken);
        if (
          agencyData?.settings?.voice_generation_characters_remaining !==
          undefined
        ) {
          setCharactersRemaining(
            agencyData.settings.voice_generation_characters_remaining
          );
        } else {
          console.error("Invalid agency data:", agencyData);
        }
      } catch (error) {
        console.error("Failed to fetch agency data:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const [convertToVoiceError, setConvertToVoiceError] = useState<string>("");

  const handleGenerateAudio = () => {
    const voiceId = account.settings.voice_id;

    if (!voiceId) {
      if (isPermitted) {
        setConvertToVoiceError("Please set the VoiceID in account settings.");
      } else {
        setConvertToVoiceError("Please contact your manager.");
      }
    } else {
      setConvertToVoiceError("");
      generateAudio(suggestedMessageText, account.uuid);
      setCharactersRemaining((prev) => prev - suggestedMessageText.length);
    }
  };

  useEffect(() => {
    if (agency?.settings?.voice_generation_characters_remaining !== undefined) {
      setCharactersRemaining(
        agency.settings.voice_generation_characters_remaining
      );
    }
  }, [agency]);
  useEffect(() => {
    if (audioUrl) {
      fetchAgency();
    }
  }, [audioUrl]);
  const getCustomInfluencerNames = () => {
    return (
      account?.settings?.custom_names?.map((nameObj) => nameObj.value) || []
    );
  };
  // const influencerCharacterRef = useRef(selectedModel?.influencer_character);
  const influencerCharacterRef = useRef(
    selectedModel?.influencer_character_last_name
      ? `${selectedModel?.influencer_character} ${selectedModel?.influencer_character_last_name}`
      : selectedModel?.influencer_character
  );
  const customInfluencerNamesRef = useRef(getCustomInfluencerNames());

  useEffect(() => {
    influencerCharacterRef.current =
      selectedModel?.influencer_character_last_name
        ? `${selectedModel?.influencer_character} ${selectedModel?.influencer_character_last_name}`
        : selectedModel?.influencer_character;
  }, [selectedModel]);

  useEffect(() => {
    customInfluencerNamesRef.current = getCustomInfluencerNames();
  }, [account?.settings?.custom_names]);

  const setSuggestedMessageText = (
    text,
    messageUUID = null,
    editing = false
  ) => {
    if (!editing) {
      if (!text) {
        _setSuggestedMessageText(text);
        return;
      }
      let cleanedText = text.replace(/<[^>]*>/g, "");
      logger.debug("Replacing replaceStringWithInfluencerName", {
        name: influencerCharacterRef.current,
        customInfluencerNames: customInfluencerNamesRef.current,
        cleanedText
      });
      // INFO: -= Transferred this logic to chat BE =-
      // cleanedText = replaceStringWithInfluencerName(
      //   account,
      //   selectedModel,
      //   cleanedText
      // );
      logger.debug("Replaced replaceStringWithInfluencerName", {
        name: influencerCharacterRef.current,
        customInfluencerNames: customInfluencerNamesRef.current,
        cleanedText
      });
      _setSuggestedMessageText(cleanedText);
    } else {
      _setSuggestedMessageText(text);
    }
    setMessageUUID(messageUUID);
  };

  const [commandResponse, setCommandResponse] = useState<string>("");
  const [isFlashScreen, setIsFlashScreen] = useState<boolean>(true);
  const [isShowTimer, setIsShowTimer] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState(true); // State to manage editing mode

  const [debugUserMessages, setDebugUserMessages] = useState("");
  const [debugUserHistory, setDebugUserHistory] = useState(null);

  const [isEditingName, setIsEditingName] = useState(false); // State to manage the visibility of the input field and button

  const [showDebugUserHistoryInput, setShowDebugUserHistoryInput] =
    useState(false);

  const [isPictureInfo, setIsPictureInfo] = useState<boolean>(false);
  const [mediaDescriptions, setMediaDescriptions] = useState({});
  const [discountRequest, setDiscountRequest] = useState<string | null>(null);
  const [errorGeneration, setErrorGeneration] = useState<string | null>(null);
  const [aiToneGeneration, setAiToneGeneration] = useState("balanced");
  const [showEditButton, setShowEditButton] = useState(false);
  const [showGenerateButton, setShowGenerateButton] = useState(false);

  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isEditingName &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setInputCustomUserName(user.currentUserName);
        setIsEditingName(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditingName, inputRef, user]);

  const { getRootProps, getRadioProps } = useRadioGroup({
    name: "tone",
    defaultValue: "balanced",
    onChange: setAiToneGeneration
  });

  const [textTransformOptions, setTextTransformOptions] = useState({
    lowercase: false,
    noCommas: false,
    noEmojis: false
  });

  const textTransformOptionsRef = useRef(textTransformOptions);

  useEffect(() => {
    textTransformOptionsRef.current = textTransformOptions;
  }, [textTransformOptions]);

  const [banner, setBanner] = useState<{
    title: string;
    icon?: string | ReactElement;
    content: string | React.ReactNode;
    backgroundColor?: string;
    textColor?: string;
  } | null>(null);

  useEffect(() => {
    let onlineTimeout;
    const interval = setInterval(() => {
      setOnline((prevOnline) => {
        if (!prevOnline) {
          if (!onlineTimeout) {
            onlineTimeout = setTimeout(() => {
              logger.debug("Call EXTENSION_MESSAGE_TYPES.INSTALL_SCRIPT");
              // chrome.runtime.sendMessage({
              //   type: EXTENSION_MESSAGE_TYPES.INSTALL_SCRIPT
              // });
            }, 3000);
          }
        } else {
          clearTimeout(onlineTimeout);
          onlineTimeout = null;
        }
        return false;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(onlineTimeout);
    };
  }, []);

  const cancelGenerateResponse = async () => {
    refetchedPostMedia();
    setShowGenerateButton(false);
    setTimeout(() => setShowGenerateButton(true), 3000);
  };

  const { isLoadingMedia, mediaPosts, refetchedPostMedia } = usePostMedia(
    jwtToken,
    user_id,
    account,
    setMediaDescriptions
  );

  const toast = useToast();
  useEffect(() => {
    setTimeout(() => {
      if (selectedModel) {
        // logger.debug("fetchContent selected model good");
        fetchContent();
      }
    }, 2000);
  }, [selectedModel]);

  useEffect(() => {
    if (jwtToken && chatJwtToken) {
      socketConnect();
    }
  }, [jwtToken, chatJwtToken]);

  useEffect(() => {
    setSuggestedMessageText(null);
    setToggleStopGenerationButton(false);
    setShowSuggestedMessageBox(false);
    setDebugUserMessages("");
  }, [user_id]);

  // useEffect(() => {
  //   if (selectedModel && jwtToken && user_id) {
  //     // loadPayments();
  //     // setLoadPaymentsData(true);
  //   }
  // }, [jwtToken, selectedModel, user_id]);

  useEffect(() => {
    // logger.debug("setIsFlashScreen, ", selectedModel)
    logger.debug("Selected Model: ", selectedModel);
    logger.debug("User ID: ", user_id);
    if (selectedModel && user_id) {
      // logger.debug("setIsFlashScreen, set false", selectedModel)
      setIsFlashScreen(false);
    }
  }, [selectedModel, user_id]);

  const applyTextTransformations = (text, options) => {
    let transformedText = text;
    if (options?.lowercase) {
      transformedText = transformedText.toLowerCase();
    }
    if (options?.noCommas) {
      transformedText = transformedText.replace(/,/g, "");
    }
    if (options?.noEmojis) {
      const regex = emojiRegex();
      transformedText = transformedText.replace(regex, "");
    }
    return transformedText;
  };

  const handleMenuClick = useCallback((option: string, value: boolean) => {
    setTextTransformOptions((prevOptions) => ({
      ...prevOptions,
      [option]: value
    }));
  }, []);

  // useEffect(() => {
  //   if (isFlashScreen) {
  //     const timeout = setTimeout(() => {
  //       logger.debug("Reload");
  //       console.log("Reload")
  //       chrome.runtime.reload();
  //     }, 5000);

  //     return () => clearTimeout(timeout);
  //   }
  // }, [isFlashScreen]);
  const onMessageSockets = (
    message: ExtensionMessage,
    sender,
    sendResponse
  ) => {
    if (!message.socketApi) {
      console.log("pass in onMessageSockets");
      return;
    }
    const { type } = message;
    const { account, user_id, autoGenerateResponseState, stopGenerationState } =
      latestStateRef.current;
    if (message.type !== EXTENSION_MESSAGE_TYPES.FROM_FE) {
      logger.debug("Chat.tsx OnMessage: ", JSON.stringify(message));
    }

    const msgGenerateResponseId = message?.payload?.generateResponseId;
    const generateResponseId = generateResponseIdRef?.current;
    // console.log(
    //   "msgGenerateResponseId:",
    //   msgGenerateResponseId,
    //   "generateResponseId:",
    //   generateResponseId
    // );
    console.log("msgGenerateResponseId currentWebviewId", currentWebviewId)
    console.log("msgGenerateResponseId", msgGenerateResponseId)
    console.log("msgGenerateResponseId message?.payload", message?.payload)
    if (msgGenerateResponseId) {
      if (stopGenerationState) {
        logger.debug("Stop and ignore old generation");

        return;
      }
      if (msgGenerateResponseId !== generateResponseId) {
        logger.debug("Ignore old generation");

        return;
      }
      if (!msgGenerateResponseId.includes(user_id)) {
        if (autoGenerateResponseState) {
          setToggleAutoGeneration(true);
          logger.debug("Ignore old generation and start new generation");
        } else {
          stopGeneration();
          logger.debug("Ignore old generation and stop generation");
        }

        return;
      }
    }
    switch (type) {
      case EXTENSION_MESSAGE_TYPES.URL_CHANGE_LISTENER: {
        console.log("content refresh");
        getMessagesContent();
        break;
      }
      case EXTENSION_MESSAGE_TYPES.SUGGESTED_MESSAGE_TEXT: {
        const {
          payload: { messageText, messageUuid }
        } = message;
        sendResponse({ status: "Message received" });

        const msg = messageText.replace("%name%", "baby");
        const pricing = account?.settings?.custom_content_pricing || [];
        const updatedMsg = replacePlaceholdersWithPrices(msg, pricing);
        const transformedMsg = applyTextTransformations(
          updatedMsg,
          textTransformOptionsRef.current
        );
        setSuggestedMessageText(transformedMsg, messageUuid);
        setIsGeneratingResponse(false);
        break;
      }
      case ExtensionMessageTypes.MODERATION_FILTER_TRIGGERED: {
        setBanner({
          icon: <StrikeIcon mt={1} width="20px" height="20px" />,
          backgroundColor:
            "linear-gradient(88deg, #ECC889 -27.4%, #F84A4D 119.64%)",
          textColor: "black",
          title: "Moderation filter",
          content: (
            <p>Moderation filter triggered, you cannot edit this message.</p>
          )
        });

        setIsGeneratingResponse(false);
        setModerationFilterTriggered(true);

        break;
      }
      case EXTENSION_MESSAGE_TYPES.URL_CHANGE_LISTENER: {
        const {
          payload: { messageText }
        } = message;
        sendResponse({ status: "Discount request cleared" });
        setDiscountRequest(null);
        setShowSuggestedMessageBox(false);
        break;
      }
      case EXTENSION_MESSAGE_TYPES.COMMAND_MESSAGE_TEXT: {
        const {
          payload: { messageText, type }
        } = message;
        sendResponse({ status: "Message received" });
        setIsGeneratingResponse(false);
        break;
      }
      case EXTENSION_MESSAGE_TYPES.ERROR: {
        const {
          payload: { messageText }
        } = message;

        setBanner({
          icon: <Icon as={BiError} width="20px" height="20px" />,
          title: "Error Notification",
          content: <>{messageText}</>,
          backgroundColor:
            "linear-gradient(88deg, #F86C6E -27.4%, #F84A4D 119.64%), linear-gradient(88deg, #F84A4D -27.4%, #D84042 119.64%)",
          textColor: "white"
        });

        console.error("Error received: ", messageText);
        setCommandResponse("");
        sendResponse({ status: "Error received" });
        setErrorGeneration("Please try again");
        setIsGeneratingResponse(false);
        stopGeneration();
        break;
      }
      case ExtensionMessageTypes.COMMAND_MESSAGE_TEXT: {
        const {
          payload: { messageText }
        } = message;
        setCommandResponse(messageText);
        console.log("Handling COMMAND_MESSAGE_TEXT case");
        setIsGeneratingResponse(false);
        break;
      }
      case ExtensionMessageTypes.CUSTOM_MEDIA_REQUEST: {
        const {
          payload: { messageText }
        } = message;
        // setBanner({
        //   icon: <VaultIcon mt={1} width="20px" height="20px" />,
        //   backgroundColor:
        //     account.settings.accepting_custom_requests === 0
        //       ? "linear-gradient(88deg, #ECC889 -27.4%, #F84A4D 119.64%), linear-gradient(88deg, #F8B84A -27.4%, #F84A4D 119.64%)"
        //       : "linear-gradient(88deg, #47A1FA -27.4%, #AA42FF 119.64%)",
        //   textColor:
        //     account.settings.accepting_custom_requests === 0
        //       ? "black"
        //       : "white",
        //   title: "Custom Media Request",
        //   content: (
        //     <Box as="span" fontSize="sm" alignItems="center">
        //       User is asking for a custom request.{" "}
        //       {account.settings &&
        //         account.settings.accepting_custom_requests === 0 && (
        //           <strong>{`${accountName ? accountName : account.name} does not accept custom requests`}</strong>
        //         )}
        //       {account.settings &&
        //         account.settings.accepting_custom_requests === 1 && (
        //           <div>
        //             <p>
        //               Gather the required information and get the user to tip,
        //               then input the information on the
        //               <strong style={{ cursor: 'pointer', textDecorationLine: 'underline'}} onClick={() => setActiveTab(PageName.CustomRequests)}> Custom Requests </strong>
        //               tab.
        //             </p>
        //           </div>
        //         )}
        //     </Box>
        //   )
        // });

        if (account?.settings?.customs_price_list) {
          // const msg = `Hey handsome, yes! I do custom videos. Especially for someone as handsome as you. Here's the price list: ${account?.settings?.customs_price_list}. Tell me more about what you have in mind, ${user?.currentUserName}? What are you thinking of for the video?`;
          setSuggestedMessageText("");
          sendResponse({ status: "Message received" });
        } else {
          setSuggestedMessageText(messageText);
          sendResponse({ status: "Message received" });
        }
        console.log("Handling CUSTOM_MEDIA_REQUEST case");
        break;
      }
      case ExtensionMessageTypes.IRL_MEETING_REQUEST: {
        const {
          payload: { messageText }
        } = message;
        setBanner({
          icon: <IRLMeetingIcon mt={1} width="20px" height="20px" />,
          backgroundColor:
            account.settings.accepting_meeting_in_real_life === 1
              ? "linear-gradient(88deg, #4AF88C -27.4%, #4ACCF8 119.64%)"
              : "linear-gradient(88deg, #ECC889 -27.4%, #F84A4D 119.64%)",
          textColor: "black",
          title: "IRL Meeting Request",
          content: (
            <>
              <p>
                User is asking to meet{" "}
                {accountName ? accountName : account.name} in real life.
                {account.settings && (
                  <span>
                    {account.settings.accepting_meeting_in_real_life === 1 ? (
                      " Send IRL contact information."
                    ) : (
                      <b>
                        {" "}
                        {accountName ? accountName : account.name} does not
                        connect with fans in real life.
                      </b>
                    )}
                  </span>
                )}
              </p>
            </>
          )
        });
        setSuggestedMessageText("");
        // setCommandResponse("Return #9999 IRL Contact Information");
        sendResponse({ status: "Message received" });
        console.log("Handling IRL_MEETING_REQUEST case");
        break;
      }
      case ExtensionMessageTypes.VIDEO_CHAT_REQUEST: {
        const {
          payload: { messageText }
        } = message;
        setBanner({
          icon: <VideoChatIcon width="20px" height="20px" />,
          backgroundColor:
            account.settings.accepting_video_chats === 0
              ? "linear-gradient(88deg, #ECC889 -27.4%, #F84A4D 119.64%), linear-gradient(88deg, #F8B84A -27.4%, #F84A4D 119.64%)"
              : "linear-gradient(88deg, #47A1FA -27.4%, #AA42FF 119.64%)",
          textColor:
            account.settings.accepting_video_chats === 0 ? "black" : "white",
          title: "Video Chat Request",
          content: (
            <>
              User is asking for a 1:1 video chat.{" "}
              {account.settings &&
                account.settings.accepting_video_chats === 0 && (
                  <strong>{`${accountName ? accountName : account.name} does not connect with fans in video chat.`}</strong>
                )}
              {account.settings &&
                account.settings.accepting_video_chats === 1 && (
                  <div>
                    Get the fan to tip for a video chat and then schedule it on
                    the
                    <strong
                      style={{
                        cursor: "pointer",
                        textDecorationLine: "underline"
                      }}
                      onClick={() => setActiveTab(PageName.VideoChat)}
                    >
                      {" "}
                      Video Chat{" "}
                    </strong>
                    tab.
                  </div>
                )}
            </>
          )
        });

        // const msg =
        //   "Sure, handsome. I do Video Calls. It's 5 mins - $150 or 10 mins - $200. I'm available at these times: 10 AM - 12 PM, 2 PM - 4 PM, and 6 PM - 8 PM. Does this work for you?";
        setSuggestedMessageText("");
        sendResponse({ status: "Message received" });
        console.log("Handling VIDEO_CHAT_REQUEST case");
        break;
      }
      case ExtensionMessageTypes.DISCOUNT_REQUEST: {
        const {
          payload: { messageText }
        } = message;
        setBanner({
          icon: <Icon as={TbDiscount} width="20px" height="20px" />,
          title: "Discount Request",
          content: <>User wants a discount on the previously-sent message.</>,
          backgroundColor:
            "linear-gradient(88deg, #47A1FA -27.4%, #AA42FF 119.64%)",
          textColor: "white"
        });
        setDiscountRequest(
          `INFORMATION: ${
            selectedModel?.influencer_character_last_name
              ? `${selectedModel?.influencer_character} ${selectedModel?.influencer_character_last_name}`
              : selectedModel?.influencer_character
          } offers a discount ENDINFORMATION`
        );
        setSuggestedMessageText("");
        // we have to get payments here, and see last item, and give discount, {discountPercentage}
        sendResponse({ status: "Message received" });
        console.log("Handling DISCOUNT_REQUEST case");
        break;
      }
      case ExtensionMessageTypes.GIFT_OPPORTUNITY: {
        const {
          payload: { messageText }
        } = message;
        setBanner({
          icon: <VaultIcon width="20px" height="20px" />,
          title: "Send Vault Content",
          content: (
            <>
              Scroll down to see suggested vault content to include in your next
              reply
            </>
          ),
          backgroundColor:
            "linear-gradient(88deg, #47A1FA -27.4%, #AA42FF 119.64%)",
          textColor: "white"
        });
        // setSuggestedMessageText("Sure, I have a perfect gift for you. Let me fetch it for you.");
        sendResponse({ status: "Message received" });
        setCommandResponse(messageText);
        console.log("Handling GIFT_OPPORTUNITY case");
        break;
      }
      case ExtensionMessageTypes.IMAGE_RESPONSE: {
        const {
          payload: { messageText }
        } = message;
        sendResponse({ status: "Message received" });
        console.log("Handling IMAGE_RESPONSE case");
        setIsGeneratingResponse(false);
        break;
      }
      case EXTENSION_MESSAGE_TYPES.FROM_FE: {
        const event = message?.payload?.event;
        if (event === "online") {
          setOnline(true);
        } else {
          logger.debug(`EXTENSION_MESSAGE_TYPES.FROM_FE ${event}`);
          getMessagesContent();
          if (jwtToken && event === "scroll") {
            setLoadPaymentsData(true);
            api.updateLastActivity(jwtToken);
          }
        }
        break;
      }
      case EXTENSION_MESSAGE_TYPES.LOGGER: {
        const {
          payload: { msg }
        } = message;
        if (
          isArray(msg) &&
          msg.length > 0 &&
          Object.prototype.hasOwnProperty.call(
            msg[0],
            MESSAGE_INTENT_ENGINE_TYPE.NEGATIVE_ACCUSATION
          ) &&
          Object.prototype.hasOwnProperty.call(
            msg[0],
            MESSAGE_INTENT_ENGINE_TYPE.CONTROVERSIAL_TOPIC
          )
        ) {
          if (
            msg[0][MESSAGE_INTENT_ENGINE_TYPE.NEGATIVE_ACCUSATION] ||
            msg[0][MESSAGE_INTENT_ENGINE_TYPE.CONTROVERSIAL_TOPIC]
          ) {
            setModerationFilterTriggered(true);
            setBanner({
              icon: <StrikeIcon mt={1} width="20px" height="20px" />,
              backgroundColor:
                "linear-gradient(88deg, #ECC889 -27.4%, #F84A4D 119.64%)",
              textColor: "black",
              title: "Moderation filter",
              content: (
                <p>
                  Moderation filter triggered, you cannot edit this message.
                </p>
              )
            });
          }
          // if (
          //   msg[0][MESSAGE_INTENT_ENGINE_TYPE.GIFT_OPPORTUNITY] &&
          //   msg[0][MESSAGE_INTENT_ENGINE_TYPE.GIFT_SUMMARY]
          // ) {
          //   setBanner({
          //     title: "Send Vault Content",
          //     content: (
          //       <Box as="span" fontSize="sm" alignItems="center">
          //         <span
          //           onClick={() => setActiveTab(PageName.VaultList)}
          //           style={{
          //             fontWeight: "bold",
          //             color: "blue",
          //             cursor: "pointer"
          //           }}
          //         >
          //           Click Here
          //         </span>{" "}
          //         to see vault content to include in your next reply.
          //       </Box>
          //     )
          //   });
          // }
        }
        logger.debug("SOCKETS:: ", msg);
        break;
      }
      default: {
        sendResponse({ status: "Message received" });
      }
    }
  };

  useEffect(() => {
    _onMessage.addListener(onMessageSockets);
    return () => {
      _onMessage.removeListener(onMessageSockets);
    };
  }, []);

  useEffect(() => {
    if (
      showGenerateButton &&
      autoGenerateResponseState &&
      suggestedMessageText === null &&
      !isGeneratingResponse &&
      !stopGenerationState
    ) {
      checkIsMediaLastUserMessage(false, true);
    }
  }, [showGenerateButton, autoGenerateResponseState, suggestedMessageText]);

  useEffect(() => {
    if (showGenerateButton && toggleAutoGeneration && !stopGenerationState) {
      checkIsMediaLastUserMessage(false, true);
      setToggleAutoGeneration(false);
    }
  }, [showGenerateButton, toggleAutoGeneration]);

  const fetchContent = async (showError = true) => {
    try {
      // logger.debug("Chat + fetchContent" + JSON.stringify(selectedModel));
      const content = await getMessagesContent();
      if (content && content.user_id) {
        // logger.debug(
        //   `set: userId ${content.user_id},accountId: ${content.accountId}`
        // );
        setUserId(content.user_id);
        setAccountId(content.accountId);
        setAccountName(content.accountName);
      }
      return content;
    } catch (error) {
      sentry.captureException(error);
      console.error("Failed to fetch content:", error);
      setIsFlashScreen(false);
      logger.debug("Failed to fetch content:", error);
      if (showError) {
        toast({
          title: "Error",
          description: error.toString(),
          status: "error",
          duration: 1000,
          isClosable: true
        });
      }
    }
  };

  const getLastUserMessage = useCallback(async () => {
    const content = await getMessagesContent();
    let messageHistory = content.messages.filter((el) => el.content[0] !== "“");
    const lastUserMessageIndex = messageHistory.findLastIndex(
      (message) => message.role === "user"
    );
    let lastUserMessage;
    if (debugUserMessages) {
      lastUserMessage = debugUserMessages;
    } else {
      let empty = getProcessedUserMessageSettings(
        agency?.settings?.blank_user_message_settings,
        selectedModel?.influencer_character || selectedModel?.name
      );
      if (
        lastUserMessageIndex !== -1 &&
        lastUserMessageIndex === messageHistory.length - 1
      ) {
        lastUserMessage = messageHistory[lastUserMessageIndex].content;
      } else {
        lastUserMessage = empty;
      }
    }

    const hasUserMessage = messageHistory.some(
      (message) => message.role === "user"
    );
    if (!hasUserMessage) {
      messageHistory.unshift({
        role: "user",
        content: "<blank> <start>"
      });
    }
    return {
      messageHistory,
      lastUserMessage
    };
  }, [
    agency?.settings?.blank_user_message_settings,
    debugUserMessages,
    getMessagesContent,
    isDebugMode,
    selectedModel?.name
  ]);

  const generateResponse = async (
    update: boolean = false,
    dripMessage: string | undefined = undefined,
    rolePlayMessage: boolean = false
  ) => {
    try {
      setModerationFilterTriggered(false);
      setErrorGeneration(null);
      const content = await getMessagesContent();
      const latestMediaDescription = await refetchedPostMedia();
      const influencerAudioMessagesDescriptions =
        latestMediaDescription?.data?.influencerAudioMessages || [];

      if (!update) {
        setDebugHistory(null);
        clearAudio();
        setCommandResponse("");
        setBanner(null);
        await socketConnect();
        setIsGeneratingResponse(true);
      }

      let { lastUserMessage, messageHistory } = await getLastUserMessage();
      const messageHistoryWithDescription = addDescriptionsToAllMessages({
        mediaDescriptions,
        messageHistory: messageHistory,
        influencerAudioMessagesDescriptions
      });

      const influencerName = selectedModel?.influencer_character_last_name
        ? `${selectedModel?.influencer_character} ${selectedModel?.influencer_character_last_name}`
        : selectedModel?.influencer_character;

      logger.debug(
        "Replacing replaceInfluencerNameInString influencer name in text",
        {
          name: influencerName,
          customInfluencerNames: getCustomInfluencerNames(),
          lastUserMessage
        }
      );

      lastUserMessage = replaceInfluencerNameInString(
        influencerName,
        getCustomInfluencerNames(),
        lastUserMessage
      );

      const messageHistoryToSave = addDescriptionsToMessages({
        mediaDescriptions,
        messageHistory: messageHistory,
        user_id,
        agency,
        account
      });

      const hasUserMessage = messageHistory.some(
        (message) => message.role === "user"
      );

      await api.savePostMedia(jwtToken, messageHistoryToSave);

      if (!hasUserMessage) {
        messageHistory.unshift({
          role: "user",
          content: "<blank> <start>"
        });
      }

      messageHistory = aggregateUserContentWithTags(
        messageHistoryWithDescription
      );

      if (
        isDebugMode &&
        debugUserHistory?.length > 0 &&
        showDebugUserHistoryInput
      ) {
        try {
          messageHistory = JSON.parse(debugUserHistory);
        } catch (error) {
          logger.debug("Debug history:", error);
          toast({
            title: "Error",
            description: error.toString(),
            status: "error",
            duration: 1000,
            isClosable: true
          });
          return;
        }
      }

      if (discountRequest) {
        messageHistory.push({
          id: String(new Date().getTime()),
          content: discountRequest,
          role: "influencer"
        });
      }

      if (aiToneGeneration !== "balanced") {
        const toneInfoMessage = `INFORMATION: ${selectedModel?.influencer_character?.toUpperCase()} responds in a ${aiToneGeneration === "sexy" ? "seductive" : "platonic"} tone ENDINFORMATION`;
        const lastUserMessageIndex = messageHistory.findLastIndex(
          (message) => message.role === "user"
        );
        if (lastUserMessage.includes("<blank>")) {
          lastUserMessage = mergeInformationMarkers(
            lastUserMessage,
            toneInfoMessage
          );
        } else {
          if (lastUserMessageIndex !== -1) {
            messageHistory[lastUserMessageIndex].content =
              mergeInformationMarkers(
                messageHistory[lastUserMessageIndex].content.replace(
                  /\n+$/,
                  ""
                ),
                toneInfoMessage
              );
            lastUserMessage = mergeInformationMarkers(
              lastUserMessage,
              toneInfoMessage
            );
          }
          if (lastUserMessage?.content) {
            lastUserMessage.content = mergeInformationMarkers(
              lastUserMessage.content.replace(/\n+$/, ""),
              toneInfoMessage
            );
          }
        }
      }

      if (dripMessage) {
        if (dripMessage.length > 0 && dripMessage.includes("<blank>")) {
          messageHistory.push({
            role: "influencer",
            content: dripMessage
          });
        } else {
          messageHistory.push({
            role: "influencer",
            content: DEFAULT_DRIP_MESSAGE
          });
        }
      }

      if (rolePlayMessage) {
        const lastMessageRole =
          messageHistory.length > 0
            ? messageHistory[messageHistory.length - 1].role
            : "user";
        if (lastMessageRole === "influencer") {
          lastUserMessage = `${debugUserMessages.length > 0 ? debugUserMessages + " INFORMATION: Start a roleplay ENDINFORMATION" : "<blank> INFORMATION: XOT didn't respond to [usr]s last message. [usr] tries to restart dialogue with a seductive message. Start a roleplay ENDINFORMATION"}`;
        } else {
          lastUserMessage = `${debugUserMessages.length > 0 ? debugUserMessages + " INFORMATION: Start a roleplay ENDINFORMATION" : "<blank> INFORMATION: Start a roleplay ENDINFORMATION"}`;
        }
      }

      // replace Username if included
      messageHistory = messageHistory.map((el) => {
        if (
          user?.currentUserName &&
          el.content &&
          el.content
            ?.toLowerCase()
            .includes(user.currentUserName?.toLowerCase())
        ) {
          el.content = el.content.replace(
            new RegExp(`\\b${user.currentUserName}\\b`, "gi"),
            "[usr]"
          );
        }
        return el;
      });
      if (user?.currentUserName) {
        lastUserMessage = lastUserMessage.replace(
          new RegExp(`\\b${user.currentUserName}\\b`, "gi"),
          "[usr]"
        );
      }

      let convertHistory = convertHistoryToString(
        messageHistory,
        selectedModel?.name,
        [user.custom_user_name, content.username, content.customUsername]
      );

      // if (discountRequest) {
      //   convertHistory += discountRequest;
      // }

      setDebugHistory(convertHistory);

      if (update) {
        return;
      }

      const generateResponseId = new Date().toISOString() + user_id;
      if (generateResponseIdRef) {
        generateResponseIdRef.current = generateResponseId;
      }

      console.log("msgGenerateResponseId currentWebviewId", currentWebviewId)
      console.log("msgGenerateResponseId", generateResponseId)

      const msg = {
        type: EXTENSION_MESSAGE_TYPES.SEND_MESSAGE_HISTORY,
        payload: {
          accountUUID: account.uuid,
          messages: messageHistory,
          username: user?.currentUserName,
          model: selectedModel.uuid,
          user_id: content.user_id,
          lastUserMessage: lastUserMessage,
          influencer_uuid: selectedModel.uuid,
          jwt: chatJwtToken,
          generateResponseId
        }
      };
      logger.debug("Send message", msg);
      await sendMessage(msg);
      await refetchedPostMedia();
      setShowGenerateButton(false);
      setTimeout(() => setShowGenerateButton(true), 3000);
    } catch (e) {
      sentry.captureException(e);
      console.log(e);
      logger.debug("Error generate response: ", e);
      toast({
        title: "Error",
        description: e.toString(),
        status: "error",
        duration: 1000,
        isClosable: true
      });
      setIsGeneratingResponse(false);
      setErrorGeneration("Please try again");
      stopGeneration();
    } finally {
      if (
        account &&
        account.settings &&
        !account.settings.first_interaction_date
      ) {
        const firstInteractionDate = formatDate(new Date());
        const updatedSettings = {
          ...account.settings,
          first_interaction_date: firstInteractionDate
        };
        const dataToUpdate = {
          ...account,
          settings: updatedSettings
        };
        api.updateAccount(jwtToken, account.name, dataToUpdate);
        account.settings.first_interaction_date = firstInteractionDate;
      }
    }
  };

  const socketConnect = async () => {
    // setIsGeneratingResponse(true);
    // chrome.runtime.sendMessage({
    //   type: EXTENSION_MESSAGE_TYPES.RECONNECT,
    //   payload: {
    //     jwt: chatJwtToken
    //   }
    // });
    // setIsGeneratingResponse(false);
    // toast({
    //   title: "Connected",
    //   description: "",
    //   status: "success",
    //   duration: 3000,
    //   isClosable: true
    // });
  };

  // const loadPayments = async () => {
  //   try {
  //     setIsLoading(true);
  //     // await syncPayments();
  //   } catch (error) {
  //     logger.debug("syncPayments error", error);
  //     console.error("Failed to sync payments: ", error);
  //     toast({
  //       title: "Error",
  //       description: "Failed to sync payments. Please try again.",
  //       status: "error",
  //       duration: 1000,
  //       isClosable: true
  //     });
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const copySuggestedMessageTextToClipboard = async () => {
    try {
      if (copiedText !== suggestedMessageText) {
        setCopiedText(suggestedMessageText);
        await api.storeUserAction(jwtToken, {
          influencer_id: selectedModel.uuid,
          user_id: user_id,
          user_uuid: userUUID,
          account_id: account.name,
          type: "copy-text"
        });
      }
      await navigator.clipboard.writeText(suggestedMessageText);
      toast({
        title: "Copied!",
        description: "Message text copied to clipboard.",
        status: "success",
        duration: 1000,
        isClosable: true
      });
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const stopGeneration = (toggleStopGenerationButtonState = false) => {
    setStopGenerationState(true);
    setShowSuggestedMessageBox(false);
    if (toggleStopGenerationButtonState) {
      setToggleStopGenerationButton(true);
    }
    setIsGeneratingResponse(false);
    refetchedPostMedia();
    setShowGenerateButton(false);
    setTimeout(() => setShowGenerateButton(true), 2000);
  };

  const checkMediaMessages = useCallback(
    async (editMediaInfo = false) => {
      const { messageHistory } = await getLastUserMessage();

      let mediaMessages: boolean;
      let isLastInfluencerAudio: boolean;
      const IS_MEDIA_MESSAGE =
        /<image|_image|<video|_video|<audio|_audio|<gif|_gif/;
      if (editMediaInfo) {
        mediaMessages = messageHistory.some(
          (m) => IS_MEDIA_MESSAGE.test(m.content) && m.role === "user"
        );
      } else {
        const mediaMessagesFiltered = messageHistory.filter(
          (m) => IS_MEDIA_MESSAGE.test(m.content) && m.role === "user"
        );

        if (!mediaMessagesFiltered.length) {
          mediaMessages = false;
        }

        const lastMediaMessages = mediaMessagesFiltered.filter(
          (item, index) => index < 3
        );

        mediaMessages = lastMediaMessages.some((m) => !mediaDescriptions[m.id]);
      }

      return mediaMessages || isLastInfluencerAudio;
    },
    [getLastUserMessage, mediaDescriptions]
  );

  const checkIsMediaLastUserMessage = async (
    update = false,
    autoGeneration = false
  ) => {
    setIsGeneratingResponse(true);
    api.updateLastActivity(jwtToken);
    const mediaMessages = await checkMediaMessages();

    if (mediaMessages) {
      if (suggestedMessageText === null && autoGeneration) {
        setIsGeneratingResponse(false);
      } else {
        setIsPictureInfo(true);
      }
    } else {
      if (userGeneratesResponse !== user_id) {
        setUserGeneratesResponse(user_id);
      }
      generateResponse(update);
    }
  };

  const convertMessageHistory = useCallback(
    (messageHistory: OnlyFansMessage[]) => {
      const messageHistoryWithDescription = addDescriptionsToAllMessages({
        mediaDescriptions,
        messageHistory: messageHistory,
        influencerAudioMessagesDescriptions: []
      });

      messageHistory = aggregateUserContentWithTags(
        messageHistoryWithDescription
      );

      messageHistory = messageHistory.map((el) => {
        if (
          user?.currentUserName &&
          el.content &&
          el.content
            ?.toLowerCase()
            .includes(user.currentUserName?.toLowerCase())
        ) {
          el.content = el.content.replace(
            new RegExp(`\\b${user.currentUserName}\\b`, "gi"),
            "[usr]"
          );
        }
        return el;
      });

      let convertHistory = convertHistoryToString(
        messageHistory,
        selectedModel?.name,
        [user.custom_user_name, content.username, content.customUsername]
      );

      return convertHistory;
    },
    [mediaDescriptions, user, selectedModel, content]
  );

  const handleCreateOrUpdateMessageWithFeedback = useCallback(async () => {
    let { messageHistory } = await getLastUserMessage();
    const dataForUpdate: MessageWithFeedbackInput[] = messageHistory
      .map((item, index) => {
        if (item.content.startsWith("<") && item.content.endsWith(">")) {
          if (
            item.content.includes("purchased") &&
            !item.content.includes("unpurchased")
          ) {
            return {
              user_id: userUUID,
              message_text: item.content,
              message_type_id: 3,
              response_text: "",
              message_date: formatDate(item.time),
              feedback_text: "Purchase",
              feedback: 1,
              trainingDataHistory: convertMessageHistory(
                messageHistory.filter((it, ind) => ind < index)
              ),
              of_message_external_id: item.id,
              influencer_id: selectedModel.uuid
            };
          } else {
            if (item.content.includes("tip")) {
              return {
                user_id: userUUID,
                message_text: item.content,
                message_type_id: 2,
                response_text: "",
                message_date: formatDate(item.time),
                feedback_text: "Tip",
                feedback: 1,
                trainingDataHistory: convertMessageHistory(
                  messageHistory.filter((it, ind) => ind < index)
                ),
                of_message_external_id: item.id,
                influencer_id: selectedModel.uuid
              };
            }
          }
        }
      })
      .filter((item) => item);

    if (dataForUpdate.length > 0) {
      await api.createOrUpdateMessagesWithFeedback(jwtToken, dataForUpdate);
    }
  }, [
    getLastUserMessage,
    userUUID,
    selectedModel,
    jwtToken,
    convertMessageHistory
  ]);

  useEffect(() => {
    if (JSON.stringify(prevPaymentsRef.current) !== JSON.stringify(payments)) {
      prevPaymentsRef.current = payments;
      if (payments?.payments?.length) {
        handleCreateOrUpdateMessageWithFeedback();
      }
    }
  }, [handleCreateOrUpdateMessageWithFeedback, payments]);

  useEffect(() => {
    if (user_id) {
      setShowEditButton(false);
      setShowGenerateButton(false);
      const timer = setTimeout(() => {
        checkMediaMessages(true)
          .then((data) => {
            setShowEditButton(data);
          })
          .catch((error) => {
            console.log("error checkMediaMessages", error);
          })
          .finally(() => setShowGenerateButton(true));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [user_id]);

  useEffect(() => {
    setIsEditingName(false);
    setShowEmojiPicker(false);
  }, [activeTab, user]);

  if (!selectedModel) {
    return (
      <>
        <Text fontSize="md" color="gray.600" marginBottom="10px">
          To start using MaxAI, please select a model in the Agency Portal, and
          then force reload
        </Text>
        <Button onClick={() => window.location.reload()}>Force reload</Button>
        {/* <ModelSelect /> */}
      </>
    );
  }

  if (isFlashScreen) {
    return <MainLoader />;
  }

  if (!user_id) {
    return <NoUserSelected />;
  }

  return (
    <VStack alignItems="flex-start" width="full" gap={4}>
      <Box
        backgroundColor={colorMode === "light" ? "white" : "#212327"}
        p={4}
        borderRadius="10px"
        width="100%"
        display="flex"
        flexDirection="column"
        gap={4}
      >
        {/* USER NAME FIELD WITH STRIKES*/}
        <Box position="sticky" top="66px" zIndex="1" width="100%">
          {/*<Box*/}
          {/*  position="absolute"*/}
          {/*  top="10px"*/}
          {/*  right="10px"*/}
          {/*  width="10px"*/}
          {/*  height="10px"*/}
          {/*  backgroundColor={isOnline ? "green" : "gray"}*/}
          {/*  borderRadius="50%"*/}
          {/*/>*/}
          {!selectedModel && <ModelSelect />}
          {/* {isEditingName && (
            <CustomNameInput setIsEditingName={setIsEditingName} />
          )} */}
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            width="100%"
            // margin="15px 0"
            gap="10px"
            overflow="hidden"
          >
            <Box display="flex" flexDirection="column" gap={1}>
              {inputCustomUserName !== null && (
                <Box
                  width={`${windowWidth * 0.04}ch`}
                  ref={inputRef}
                  maxWidth={
                    inputCustomUserName
                      ? `${inputCustomUserName.length + 3}ch`
                      : ""
                  }
                  minWidth={`12ch`}
                  height="30px"
                  fontSize="md"
                  px="10px"
                  // py="1px"
                  cursor={"pointer"}
                  display="flex"
                  gap={2}
                  alignItems="center"
                  alignContent="center"
                  justifyContent="center"
                  border={isEditingName ? "1px solid #5449F6" : ""}
                  borderRadius="20px"
                  backgroundColor={isEditingName ? "#F1F6FE" : ""}
                  _hover={{
                    border: "1px solid #5449F6",
                    borderRadius: "20px",
                    backgroundColor: "#F1F6FE"
                  }}
                  className="group"
                  overflow="hidden"
                >
                  <Tooltip
                    label={
                      inputCustomUserName &&
                      inputCustomUserName.length < windowWidth * 0.05
                        ? ""
                        : inputCustomUserName
                    }
                  >
                    <Input
                      type="text"
                      p={0}
                      m={0}
                      border="none"
                      maxHeight="20px"
                      width="100%"
                      maxWidth="100%"
                      isDisabled={!isEditingName}
                      _disabled={{
                        color: "black"
                      }}
                      fontSize="sm"
                      fontWeight="500"
                      value={inputCustomUserName}
                      focusBorderColor="transparent"
                      autoFocus
                      _focus={{ boxShadow: "none" }}
                      onChange={(event) => {
                        const name = event.target.value;
                        setInputCustomUserName(name);
                      }}
                    />
                  </Tooltip>
                  {!isEditingName && (
                    <PencilIcon
                      mt={2}
                      width="20px"
                      height="20px"
                      color="#5449F6"
                      display={{ base: "none" }}
                      _groupHover={{ display: "block" }}
                      onClick={() => setIsEditingName(!isEditingName)}
                    />
                  )}
                  {isEditingName && (
                    <CheckCircleIcon
                      color="#5449F6"
                      pointerEvents={
                        !inputCustomUserName.length ? "none" : "auto"
                      }
                      opacity={!inputCustomUserName.length ? "30%" : "100%"}
                      onClick={() => {
                        updUserCustomName();
                        setIsEditingName(!isEditingName);
                      }}
                    />
                  )}
                </Box>
              )}
            </Box>
            {user && <Deprioritized user={user} setUserData={setUserData} />}
          </Box>
        </Box>

        {/* PaymentSummary BLOCK*/}
        <PaymentSummary
          loadPaymentsData={loadPaymentsData}
          setLoadPaymentsData={setLoadPaymentsData}
        />
      </Box>

      {/* SIMULATE USER MESSAGE BLOCK*/}
      {
        <Box
          backgroundColor={colorMode === "light" ? "white" : "#212327"}
          p={4}
          borderRadius="10px"
          width="100%"
          display="flex"
          flexDirection="column"
          gap={2}
        >
          <Box>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              cursor="pointer"
              onClick={() => setExpandSimulateBlock(!expandSimulateBlock)}
            >
              <Text fontSize="16px" fontWeight={500}>
                Simulate a User Message:
              </Text>
              <Box>
                {!expandSimulateBlock && (
                  <ChevronDownIcon width="24px" height="24px" />
                )}
                {expandSimulateBlock && (
                  <ChevronUpIcon width="24px" height="24px" />
                )}
              </Box>
            </Box>
            {expandSimulateBlock && (
              <Text fontSize="12px" fontWeight={400} color="#606060">
                If you enter a message in this box, the AI model will respond to
                it as though it was the last thing the user said
              </Text>
            )}
          </Box>
          {expandSimulateBlock && (
            <Box width="100%">
              <Box width="100%" position="relative">
                <Input
                  value={debugUserMessages}
                  onChange={(e) => {
                    const updatedDebugUserMessages = e.target.value;
                    setDebugUserMessages(updatedDebugUserMessages);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (stopGenerationState) {
                        setStopGenerationState(false);
                      }
                      if (toggleStopGenerationButton) {
                        setToggleStopGenerationButton(false);
                      }
                      checkIsMediaLastUserMessage();
                    }
                  }}
                  placeholder="Speak on behalf of the user..."
                  size="md"
                  width="100%"
                  padding={6}
                  pr={16}
                  border="1px solid #E8E8E8"
                  borderRadius="16px"
                  backgroundColor="#F1F6FE"
                />
                <Button
                  variant="unstyled"
                  position="absolute"
                  display="flex"
                  alignItems="center"
                  zIndex={20}
                  right="6px"
                  top="5px"
                  px={3.5}
                  backgroundColor="#5449F6"
                  borderRadius="10px"
                  color="white"
                  isDisabled={isGeneratingResponse}
                  _disabled={{
                    backgroundColor: "#5449F6",
                    opacity: "30%"
                  }}
                  _hover={{
                    backgroundColor: "#360FFF"
                  }}
                  onClick={() => {
                    if (stopGenerationState) {
                      setStopGenerationState(false);
                    }
                    if (toggleStopGenerationButton) {
                      setToggleStopGenerationButton(false);
                    }
                    checkIsMediaLastUserMessage();
                  }}
                >
                  {isGeneratingResponse && <Spinner size="sm" />}
                  {!isGeneratingResponse && (
                    <ArrowRightIcon width="24px" height="24px" />
                  )}
                </Button>
              </Box>
              <DividerWithText>or</DividerWithText>
              <Button
                variant="unstyled"
                backgroundColor="#5449F6"
                color="white"
                onClick={() => {
                  if (stopGenerationState) {
                    setStopGenerationState(false);
                  }
                  if (toggleStopGenerationButton) {
                    setToggleStopGenerationButton(false);
                  }
                  generateResponse(false, undefined, true);
                }}
                width="100%"
                py="8px"
                px="16px"
                mt="8px"
                cursor={
                  showGenerateButton || isGeneratingResponse
                    ? "pointer"
                    : "wait"
                }
                isDisabled={!showGenerateButton || isGeneratingResponse}
                _disabled={{
                  backgroundColor: "#5449F6",
                  opacity: "30%"
                }}
                _hover={{
                  backgroundColor: "#360FFF"
                }}
              >
                <Box
                  display="flex"
                  gap={2}
                  alignItems="center"
                  justifyContent="center"
                >
                  <SparkleIcon />
                  <Text fontSize="16px" fontWeight={500}>
                    Start Roleplay
                  </Text>
                </Box>
              </Button>
            </Box>
          )}
          {/* <Checkbox
            isChecked={showDebugUserHistoryInput}
            onChange={(e) => setShowDebugUserHistoryInput(e.target.checked)}
            size="sm"
            marginTop="10px"
          >
            Add history? {"  "}
          </Checkbox> */}
          {"   "}
          {showDebugUserHistoryInput && (
            <Textarea
              value={debugUserHistory}
              onChange={(e) => {
                const updatedDebugUserHistory = e.target.value;
                setDebugUserHistory(updatedDebugUserHistory);
              }}
              placeholder='Enter your Training Data History here: [{"role": "user", "content": "Today has been so special!"}]'
              size="md"
              width="100%"
            />
          )}
        </Box>
      }

      {/* GENERATE BUTTON BLOCK */}
      {!isPictureInfo &&
        user_id &&
        // !autoGenerateResponseState &&
        !isGeneratingResponse &&
        !showSuggestedMessageBox && (
          <Box
            backgroundColor={colorMode === "light" ? "white" : "#212327"}
            p={4}
            borderRadius="10px"
            width="100%"
          >
            <Box
              width="100%"
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Text fontSize="16px" fontWeight={500}>
                Suggested Message:
              </Text>
              <Menu variant="unstyled" closeOnSelect={false} closeOnBlur={true}>
                <MenuButton
                  as={Button}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  backgroundColor="white"
                  isDisabled={!showGenerateButton && !isGeneratingResponse}
                  _disabled={{
                    opacity: "30%"
                  }}
                  position="relative"
                >
                  {Object.values(textTransformOptions).filter(Boolean).length >
                  0 ? (
                    <Box as="span" color="gray.500" fontSize="sm">
                      <Text mb={3} fontSize="24px">
                        ...
                      </Text>
                      <Text
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                        position="absolute"
                        top={0}
                        right={0}
                        px={1}
                        fontSize="xs"
                      >
                        {
                          Object.values(textTransformOptions).filter(Boolean)
                            .length
                        }
                      </Text>
                    </Box>
                  ) : (
                    <Text mb={3} fontSize="24px">
                      ...
                    </Text>
                  )}
                </MenuButton>
                <MenuList
                  width="100%"
                  borderRadius="12px"
                  bg="#F1F6FE"
                  p={0}
                  fontSize="17px"
                  color="#0E0E0E"
                >
                  <MenuItem
                    display="flex"
                    justifyContent="center"
                    borderBottom="1px solid #E8E8E8"
                    bg="#F1F6FE"
                    _hover={{ color: "#5433FF", fontWeight: "600" }}
                    color={"#5433FF"}
                    fontWeight={textTransformOptions.lowercase ? "600" : "400"}
                    onClick={() =>
                      handleMenuClick(
                        "lowercase",
                        !textTransformOptions.lowercase
                      )
                    }
                  >
                    {textTransformOptions.lowercase ? "✓ " : ""}Lowercase
                  </MenuItem>
                  <MenuItem
                    display="flex"
                    justifyContent="center"
                    borderBottom="1px solid #E8E8E8"
                    bg="#F1F6FE"
                    _hover={{ color: "#5433FF", fontWeight: "600" }}
                    color={"#5433FF"}
                    fontWeight={textTransformOptions.noCommas ? "600" : "400"}
                    onClick={() =>
                      handleMenuClick(
                        "noCommas",
                        !textTransformOptions.noCommas
                      )
                    }
                  >
                    {textTransformOptions.noCommas ? "✓ " : ""}No Commas
                  </MenuItem>
                  <MenuItem
                    display="flex"
                    justifyContent="center"
                    borderBottom="1px solid #E8E8E8"
                    bg="#F1F6FE"
                    _hover={{ color: "#5433FF", fontWeight: "600" }}
                    color={"#5433FF"}
                    fontWeight={textTransformOptions.noEmojis ? "600" : "400"}
                    onClick={() =>
                      handleMenuClick(
                        "noEmojis",
                        !textTransformOptions.noEmojis
                      )
                    }
                  >
                    {textTransformOptions.noEmojis ? "✓ " : ""}No Emojis
                  </MenuItem>
                  <HStack px={4} py={3} width="100%" {...getRootProps()}>
                    <RadioCard {...getRadioProps({ value: "sexy" })}>
                      🫦 Sexy
                    </RadioCard>
                    <RadioCard {...getRadioProps({ value: "balanced" })}>
                      😊 Balanced
                    </RadioCard>
                    <RadioCard {...getRadioProps({ value: "platonic" })}>
                      🤝 Platonic
                    </RadioCard>
                  </HStack>
                </MenuList>
              </Menu>
            </Box>

            {!!autoGenerateResponseState && !toggleStopGenerationButton && (
              <Text fontSize="12px" fontWeight={400} color="#606060">
                Please enter descriptions of past media
              </Text>
            )}
            {
              <Button
                variant="unstyled"
                backgroundColor="#5449F6"
                color="white"
                onClick={() => {
                  if (stopGenerationState) {
                    setStopGenerationState(false);
                  }
                  if (toggleStopGenerationButton) {
                    setToggleStopGenerationButton(false);
                  }
                  checkIsMediaLastUserMessage();
                }}
                width="100%"
                py="8px"
                px="16px"
                mt="8px"
                cursor={
                  showGenerateButton || isGeneratingResponse
                    ? "pointer"
                    : "wait"
                }
                isDisabled={!showGenerateButton && !isGeneratingResponse}
                _disabled={{
                  backgroundColor: "#5449F6",
                  opacity: "30%"
                }}
                _hover={{
                  backgroundColor: "#360FFF"
                }}
              >
                <Box
                  display="flex"
                  gap={2}
                  alignItems="center"
                  justifyContent="center"
                >
                  <SparkleIcon />
                  <Text fontSize="16px" fontWeight={500}>
                    Generate Response
                  </Text>
                </Box>
              </Button>
            }
            {/* {isGeneratingResponse && (
            <Box
              width="100%"
              display="flex"
              flexDirection="column"
              justifyContent="center"
              alignItems="center"
            >
              <Image
                boxSize="112px"
                objectFit="cover"
                src={spinnerGif}
                alt="spinner"
              />
              <Text fontSize="12px" fontWeight={400}>
                {"Max is thinking :)"}
              </Text>
            </Box>
          )} */}
          </Box>
        )}

      {isGeneratingResponse && !isPictureInfo && (
        <Box
          backgroundColor={colorMode === "light" ? "white" : "#212327"}
          p={4}
          borderRadius="10px"
          width="100%"
        >
          <Text fontSize="16px" fontWeight={500}>
            Suggested Message:
          </Text>
          <Box
            width="100%"
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
          >
            {/* <Image */}
            {/*   boxSize="112px" */}
            {/*   objectFit="cover" */}
            {/*   src={spinnerGif} */}
            {/*   alt="spinner" */}
            {/* /> */}
            <Text fontSize="12px" fontWeight={400}>
              {userGeneratesResponse === user_id
                ? "Max is thinking :)"
                : "Stopping generation ..."}
            </Text>
            <Button
              variant="unstyled"
              size="sm"
              p={4}
              mt={2}
              borderRadius="10px"
              backgroundColor="#F45252"
              display="flex"
              color="white"
              _hover={{
                backgroundColor: "#FDD9D9"
              }}
              onClick={() => stopGeneration(true)}
            >
              {userGeneratesResponse === user_id
                ? "Stop Generation"
                : "Stop Generation Immediately"}
            </Button>
          </Box>
          {errorGeneration && (
            <Box
              as="span"
              color="red"
              display="flex"
              width="100%"
              justifyContent="center"
              fontSize="md"
            >
              {errorGeneration}
            </Box>
          )}
        </Box>
      )}

      {isPictureInfo ? (
        isLoadingMedia ? (
          <Spinner />
        ) : (
          <>
            <Descriptions
              setIsPictureInfo={setIsPictureInfo}
              stopGeneration={stopGeneration}
              generateResponse={generateResponse}
              setMediaDescriptions={setMediaDescriptions}
              mediaDescriptions={mediaDescriptions}
              cancelGenerateResponse={cancelGenerateResponse}
              refetchedPostMedia={refetchedPostMedia}
              getLastUserMessage={getLastUserMessage}
              mediaPosts={mediaPosts}
              isPictureInfo={isPictureInfo}
            >
              <Button
                variant="unstyled"
                p={2}
                borderRadius="10px"
                border="2px solid #5449F6"
                backgroundColor="#F1F6FE"
                fontSize="16px"
                fontWeight={500}
                color="#5449F6"
                display="flex"
                alignItems="center"
                _hover={{
                  backgroundColor: "#CFE0FC"
                }}
                onClick={async () => {
                  setIsPictureInfo(false);
                  await generateResponse();
                  setTimeout(async () => {
                    const { data: fetchedPostMedia } =
                      await refetchedPostMedia();
                    if (fetchedPostMedia.success) {
                      const mediaDict = fetchedPostMedia.data.reduce(
                        (acc, item) => {
                          acc[item.external_id] = item;
                          return acc;
                        },
                        {}
                      );
                      setMediaDescriptions(mediaDict);
                    }
                  }, 1000);
                }}
              >
                Skip
              </Button>
            </Descriptions>
          </>
        )
      ) : null}

      {!isPictureInfo && user_id && (
        <>
          {/* <HStack
            backgroundColor={colorMode === "light" ? "white" : "#212327"}
            p={4}
            borderRadius="10px"
            width="100%"
            justifyContent="space-between"
            {...getRootProps()}
          >
            <RadioCard {...getRadioProps({ value: 'sexy' })}>
              🫦 Sexy
            </RadioCard>
            <RadioCard {...getRadioProps({ value: 'balanced' })}>
              😊 Balanced
            </RadioCard>
            <RadioCard {...getRadioProps({ value: 'platonic' })}>
              🤝 Platonic
            </RadioCard>
            <RadioGroup
              onChange={setAiToneGeneration}
              value={aiToneGeneration}
              defaultValue="balanced"
              width="100%"
              display="flex"
              justifyContent="center"
              gap={5}
            >
              <Radio value="sexy">🫦 Sexy</Radio>
              <Radio value="balanced">😊 Balanced</Radio>
              <Radio value="platonic">🤝 Platonic</Radio>
            </RadioGroup>
            <Menu closeOnSelect={true} closeOnBlur={true}>
              <MenuButton
                as={Button}
                display="flex"
                alignItems="center"
                justifyContent="center"
                backgroundColor='white'
              >
                {Object.values(textTransformOptions).filter(Boolean).length >
                0 ? (
                  <Box as="span" color="gray.500" fontSize="sm">
                    {Object.values(textTransformOptions).filter(Boolean).length}
                  </Box>
                ) : (
                  <Text mb={3} fontSize='24px'>...</Text>
                )}
              </MenuButton>
              <MenuList>
                <MenuItem
                  onClick={() =>
                    handleMenuClick(
                      "lowercase",
                      !textTransformOptions.lowercase
                    )
                  }
                >
                  {textTransformOptions.lowercase ? "✓ " : ""}Lowercase
                </MenuItem>
                <MenuItem
                  onClick={() =>
                    handleMenuClick("noCommas", !textTransformOptions.noCommas)
                  }
                >
                  {textTransformOptions.noCommas ? "✓ " : ""}No Commas
                </MenuItem>
                <MenuItem
                  onClick={() =>
                    handleMenuClick("noEmojis", !textTransformOptions.noEmojis)
                  }
                >
                  {textTransformOptions.noEmojis ? "✓ " : ""}No Emojis
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack> */}
          {/* <HStack
            width="100%"
            margin="15px 0"
            display="flex"
            justifyContent="center"
          > */}

          {/* LAST FAN BLOCK */}
          {/* <Box
            display="flex"
            gap={2}
            width="100%"
            fontSize="md"
            textAlign="center"
            margin="15px 0"
            fontWeight="bold"
          >
            <Text color="black">Last Fan Spend:</Text>
            <Text
              color={
                lastFanSpend === Infinity
                  ? "red"
                  : lastFanSpend < 10
                    ? "black"
                    : "red"
              }
            >
              {lastFanSpend === Infinity
                ? "Too Long Ago or Never"
                : lastFanSpend === 0
                  ? "Just now"
                  : `${lastFanSpend} Messages ago`}
            </Text>
          </Box> */}

          {/* GENERATE BUTTON BLOCK */}

          {/* <Box width="100%" display="flex" gap="8px">
            <Button
              colorScheme={isGeneratingResponse ? "blue" : "telegram"}
              onClick={
                isGeneratingResponse
                  ? stopGeneration
                  : () => checkIsMediaLastUserMessage()
              }
              width={
                account?.settings && account?.settings.drip_message
                  ? "70%"
                  : "100%"
              }
              // padding="8px"
              // margin="15px"
              isDisabled={!showGenerateButton}
            >
              {isGeneratingResponse ? (
                <>
                  <Spinner size="md" marginRight="8px" />
                  Stop Generation
                </>
              ) : (
                "Generate Response"
              )}
            </Button>
            {account?.settings && account?.settings.drip_message && (
              <Button
                colorScheme="teal"
                onClick={
                  isGeneratingResponse
                    ? stopGeneration
                    : () =>
                        generateResponse(false, account.settings.drip_message)
                }
                width="30%"
                isDisabled={!showGenerateButton}
                isLoading={isGeneratingResponse}
              >
                Drip Message
              </Button>
            )}
          </Box> */}

          {/* {!isGeneratingResponse && (
              <Checkbox
                onChange={() => setEditMediaInfo(!editMediaInfo)}
                isChecked={editMediaInfo}
              >
                Edit
              </Checkbox>
            )} */}
          {/* </HStack> */}

          {/* EDIT PAST MEDIA DESCRIPTIONS BLOCK */}
          {/* {showEditButton && !isGeneratingResponse && (
            <Button
              onClick={async () => {
                const mediaMessages = await checkMediaMessages(true);
                if (mediaMessages) {
                  setIsPictureInfo(true);
                }
              }}
              width="100%"
              hidden={!showEditButton}
              isDisabled={!showGenerateButton}
            >
              Edit Past Media Descriptions
            </Button>
          )}
          {errorGeneration && (
            <Box
              as="span"
              color="red"
              display="flex"
              width="100%"
              justifyContent="center"
              fontSize="md"
            >
              {errorGeneration}
            </Box>
          )} */}
        </>
      )}
      {!isGeneratingResponse && showSuggestedMessageBox && (
        <FeedbackProvider
          messageUUID={messageUUID}
          trainingDataHistory={debugHistory}
          suggestedMessageText={suggestedMessageText}
        >
          {banner && (
            <CustomMediaRequestCard
              title={banner.title}
              content={banner.content}
              icon={banner.icon}
              backgroundColor={banner.backgroundColor}
              textColor={banner.textColor}
            />
          )}
          <Card
            style={{
              width: "100%",
              boxShadow: "none",
              backgroundColor: colorMode === "light" ? "white" : "#212327",
              borderRadius: "10px"
            }}
          >
            <CardBody gap={4} display={"flex"} flexDirection={"column"}>
              <Box>
                <Box
                  width="100%"
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Text fontSize="16px" fontWeight={500}>
                    Suggested Message:
                  </Text>
                  <Menu
                    variant="unstyled"
                    closeOnSelect={false}
                    closeOnBlur={true}
                  >
                    <MenuButton
                      as={Button}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      backgroundColor="white"
                      isDisabled={!showGenerateButton && !isGeneratingResponse}
                      _disabled={{
                        opacity: "30%"
                      }}
                      position="relative"
                    >
                      {Object.values(textTransformOptions).filter(Boolean)
                        .length > 0 ? (
                        <Box as="span" color="gray.500" fontSize="sm">
                          <Text mb={3} fontSize="24px">
                            ...
                          </Text>
                          <Text
                            display="flex"
                            justifyContent="center"
                            alignItems="center"
                            position="absolute"
                            top={0}
                            right={0}
                            px={1}
                            fontSize="xs"
                          >
                            {
                              Object.values(textTransformOptions).filter(
                                Boolean
                              ).length
                            }
                          </Text>
                        </Box>
                      ) : (
                        <Text mb={3} fontSize="24px">
                          ...
                        </Text>
                      )}
                    </MenuButton>
                    <MenuList
                      width="100%"
                      borderRadius="12px"
                      bg="#F1F6FE"
                      p={0}
                      fontSize="17px"
                      color="#0E0E0E"
                      zIndex={40}
                    >
                      <MenuItem
                        display="flex"
                        justifyContent="center"
                        borderBottom="1px solid #E8E8E8"
                        bg="#F1F6FE"
                        _hover={{ color: "#5433FF", fontWeight: "600" }}
                        color={"#5433FF"}
                        fontWeight={
                          textTransformOptions.lowercase ? "600" : "400"
                        }
                        onClick={() =>
                          handleMenuClick(
                            "lowercase",
                            !textTransformOptions.lowercase
                          )
                        }
                      >
                        {textTransformOptions.lowercase ? "✓ " : ""}Lowercase
                      </MenuItem>
                      <MenuItem
                        display="flex"
                        justifyContent="center"
                        borderBottom="1px solid #E8E8E8"
                        bg="#F1F6FE"
                        _hover={{ color: "#5433FF", fontWeight: "600" }}
                        color={"#5433FF"}
                        fontWeight={
                          textTransformOptions.noCommas ? "600" : "400"
                        }
                        onClick={() =>
                          handleMenuClick(
                            "noCommas",
                            !textTransformOptions.noCommas
                          )
                        }
                      >
                        {textTransformOptions.noCommas ? "✓ " : ""}No Commas
                      </MenuItem>
                      <MenuItem
                        display="flex"
                        justifyContent="center"
                        borderBottom="1px solid #E8E8E8"
                        bg="#F1F6FE"
                        _hover={{ color: "#5433FF", fontWeight: "600" }}
                        color={"#5433FF"}
                        fontWeight={
                          textTransformOptions.noEmojis ? "600" : "400"
                        }
                        onClick={() =>
                          handleMenuClick(
                            "noEmojis",
                            !textTransformOptions.noEmojis
                          )
                        }
                      >
                        {textTransformOptions.noEmojis ? "✓ " : ""}No Emojis
                      </MenuItem>
                      <HStack px={4} py={3} width="100%" {...getRootProps()}>
                        <RadioCard {...getRadioProps({ value: "sexy" })}>
                          🫦 Sexy
                        </RadioCard>
                        <RadioCard {...getRadioProps({ value: "balanced" })}>
                          😊 Balanced
                        </RadioCard>
                        <RadioCard {...getRadioProps({ value: "platonic" })}>
                          🤝 Platonic
                        </RadioCard>
                      </HStack>
                    </MenuList>
                  </Menu>
                </Box>

                <Text fontSize="12px" fontWeight={400} color="#606060">
                  Press the Copy Text button (after you have finished reading
                  and editing the message, if needed)
                </Text>
              </Box>
              {isEditing ? (
                <Box
                  display={"flex"}
                  position="relative"
                  flexDirection={"column"}
                >
                  <Textarea
                    ref={textareaRef}
                    value={suggestedMessageText}
                    onChange={(e) =>
                      setSuggestedMessageText(e.target.value, messageUUID, true)
                    }
                    style={{
                      width: "100%",
                      textAlign: "left",
                      userSelect: "none"
                    }}
                    borderRadius="16px"
                    borderBottomLeftRadius={0}
                    borderBottomRightRadius={0}
                    border="2px solid #5433FF"
                    backgroundColor="#F1F6FE"
                    boxShadow="0px 0px 18px -1px #5449F6"
                    pb={2}
                    resize="none"
                    fontSize="15px"
                    rows={3}
                    readOnly={moderationFilterTriggered}
                    paddingBottom="40px"
                    lineHeight="1.5"
                    _hover={{
                      border: "2px solid #5449F6"
                    }}
                    _focus={{
                      border: "2px solid #5449F6",
                      outline: "none",
                      boxShadow: "0px 0px 18px -1px #5449F6"
                    }}
                    onCopy={(e) => e.preventDefault()}
                  />
                  <Box position="absolute" width="100%" bottom={-14}>
                    <Button
                      display="flex"
                      gap={2}
                      alignItems="center"
                      borderRadius="16px"
                      borderTopLeftRadius={0}
                      borderTopRightRadius={0}
                      boxShadow="0px 4px 15px -1px #5433FF"
                      width="100%"
                      variant="unstyled"
                      backgroundColor="#5433FF"
                      onClick={copySuggestedMessageTextToClipboard}
                      fontSize="16px"
                      fontWeight={500}
                      color="white"
                      zIndex={20}
                      _hover={{
                        backgroundColor: "#360FFF"
                      }}
                    >
                      <CopyIcon mt={1} width="20px" height="20px" />
                      <Text>Copy Text</Text>
                    </Button>
                    <Text
                      display="flex"
                      justifyContent="flex-end"
                      fontSize="12px"
                      color="#606060"
                    >
                      {suggestedMessageText?.length || 0} characters
                    </Text>
                    <Box position="absolute" bottom={16} left={4} zIndex={20}>
                      <EmojiIcon
                        width="28px"
                        height="28px"
                        color="#5433FF"
                        cursor="pointer"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      />
                      {showEmojiPicker && (
                        <Box
                          position="absolute"
                          bottom={8}
                          left={0}
                          zIndex={100}
                          mt={2}
                        >
                          <EmojiPicker
                            onEmojiClick={(event) => {
                              insertEmoji(event.emoji);
                              setShowEmojiPicker(false);
                            }}
                            width="300px"
                            height="300px"
                            searchDisabled
                            skinTonesDisabled
                          />
                        </Box>
                      )}
                    </Box>
                    <Box
                      position="absolute"
                      display="flex"
                      gap={2}
                      alignItems="center"
                      bottom={16}
                      right={4}
                      zIndex={20}
                      px={2}
                      py={1}
                      backgroundColor="#5433FF"
                      borderRadius="10px"
                      cursor="pointer"
                      onClick={() => checkIsMediaLastUserMessage()}
                    >
                      <SparkleIcon width="18px" height="18px" color="white" />
                      <Text fontSize="12px" fontWeight={500} color="white">
                        Regenerate
                      </Text>
                    </Box>
                  </Box>
                </Box>
              ) : (
                <Text
                  style={{ width: "100%", textAlign: "left" }}
                  fontSize="lg"
                >
                  {suggestedMessageText}
                </Text>
              )}

              <Center
                sx={{
                  mt: "50px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  alignItems: "flex-start"
                }}
              >
                {/* <Button
                  colorScheme={"green"}
                  onClick={copySuggestedMessageTextToClipboard}
                  marginRight="8px"
                >
                  Copy Text
                </Button> */}
                {!moderationFilterTriggered && (
                  <Box
                    width="100%"
                    display="flex"
                    justifyContent="space-between"
                  >
                    <Box
                      display="flex"
                      flexDirection="column"
                      gap={1}
                      width="100%"
                    >
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        gap={windowWidth > 360 ? "none" : "1"}
                        alignItems="center"
                        width="100%"
                      >
                        <Tooltip
                          label="Generate audio text from last message"
                          aria-label="Generate Audio Tooltip"
                        >
                          <Button
                            onClick={
                              isAudioGenerating
                                ? () => {
                                    setIsAudioGenerating(false);
                                  }
                                : handleGenerateAudio
                            }
                            isDisabled={!voiceGenAbility}
                            variant="unstyled"
                            p={2}
                            borderRadius="10px"
                            border="2px solid #5449F6"
                            backgroundColor="#F1F6FE"
                            fontSize="16px"
                            fontWeight={500}
                            color="#5449F6"
                            display="flex"
                            alignItems="center"
                            _hover={{
                              backgroundColor: "#CFE0FC"
                            }}
                          >
                            {isAudioGenerating ? (
                              <>
                                <Spinner size="sm" marginRight="8px" />
                                Cancel
                              </>
                            ) : (
                              <Box display="flex" alignItems="center" gap={0.5}>
                                <SpeakerIcon
                                  mt={1}
                                  width="20px"
                                  height="20px"
                                />
                                <Text>Convert to voice</Text>
                              </Box>
                            )}
                          </Button>
                        </Tooltip>
                        <Box display="flex" alignItems="flex-start">
                          <FeedbackButtons />
                        </Box>
                      </Box>
                      {convertToVoiceError ? (
                        <Text fontSize="12px" fontWeight={500} color="red">
                          {convertToVoiceError}
                        </Text>
                      ) : (
                        <Text fontSize="12px" fontWeight={500} color="#606060">
                          {charactersRemaining} characters remaining
                        </Text>
                      )}
                    </Box>
                    {/* AUTOPLAY CHECKBOX */}
                    {/* {!audioUrl && !isAudioGenerating && (
                      <Checkbox
                        width="100%"
                        display="inline-flex"
                        justifyContent="center"
                        alignItems="center"
                        isChecked={autoPlayState}
                        disabled={isAudioGenerating}
                        onChange={() => setAutoPlayState(!autoPlayState)}
                      >
                        <Text fontSize="xs">
                          Autoplay {autoPlayState ? "On" : "Off"}
                        </Text>
                      </Checkbox>
                    )} */}
                  </Box>
                )}
                {audioUrl && activeTab === PageName.Message && (
                  <Box width="100%">
                    {/* AUTOPLAY CHECKBOX */}
                    {/* <Box display="flex" gap={2} alignItems="center">

                      <Checkbox
                        disabled={isAudioGenerating}
                        isChecked={autoPlayState}
                        onChange={() => setAutoPlayState(!autoPlayState)}
                      >
                        <Text fontSize="xs">
                          Autoplay {autoPlayState ? "On" : "Off"}
                        </Text>
                      </Checkbox>
                    </Box> */}
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <Box
                        borderRadius={"200px"}
                        boxShadow={"0px 0px 18px -1px #5449F6"}
                        border={"2px"}
                        borderColor={"#5433FF"}
                      >
                        <AudioPlayer
                          audioUrl={audioUrl}
                          audioText={suggestedMessageText}
                        />
                      </Box>
                      <Button
                        border={"2px"}
                        borderColor={"#5433FF"}
                        backgroundColor={"#F1F6FE"}
                        borderRadius={"10px"}
                        onClick={() => downloadAudio(audioUrl)}
                        leftIcon={
                          <DownloadAudioIcon
                            width="20px"
                            height="20px"
                            color="#5433FF"
                          />
                        }
                        iconSpacing={0}
                        _hover={{
                          backgroundColor: "#CFE0FC"
                        }}
                      ></Button>
                    </Box>
                  </Box>
                )}
              </Center>
              <FeedbackTextarea />
            </CardBody>
          </Card>

          {commandResponse && (
            <Card style={{ width: "100%", marginTop: "20px" }}>
              <CardBody gap={8} display={"flex"} flexDirection={"column"}>
                <Text fontSize="lg" fontWeight={"bold"}>
                  Vault Content:
                </Text>
                <Text fontSize="md" fontWeight={"bold"}>
                  Please go retrieve the content below from the Vault and send
                  it with your message
                </Text>
                <Textarea
                  placeholder="No content to share"
                  value={commandResponse}
                />
              </CardBody>
            </Card>
          )}
        </FeedbackProvider>
      )}

      {/* USER NOTE BLOCK */}
      {user_id && <UserNote user={user} setUserData={setUserData} />}

      {/* TIMER BLOCK*/}
      <Box width="100%" display="flex" flexDirection="column" gap={4}>
        {!isShowTimer && <AddTimer setIsShowTimer={setIsShowTimer} />}
        <TimerManager
          setUserData={setUserData}
          user={user}
          isShowTimerForm={isShowTimer}
          setIsShowTimer={setIsShowTimer}
        />
      </Box>

      <Box
        width="100%"
        display="flex"
        alignItems="center"
        gap={4}
        justifyContent="space-between"
      >
        <ClockOutButton />

        <Tooltip label="Reload extension" aria-label="Reload extension">
          <IconButton
            size="sm"
            aria-label="Reload extension"
            icon={<RoundedCircleIcon width="24px" height="24px" />}
            onClick={() => window.location.reload()}
            color="#2F3341"
            backgroundColor="#F8F7F8"
            border="1px solid #E8E8E8"
            borderRadius="10px"
            p={4}
          />
        </Tooltip>
      </Box>

      {isDebugMode && debugHistory && (
        <Box width="100%" margin="15px 0">
          <Text fontSize="md" marginBottom="4px">
            Training Data History:
          </Text>
          <Textarea
            height="200px"
            value={debugHistory}
            isReadOnly
            size="md"
            width="100%"
            style={{ whiteSpace: "pre-wrap" }}
          />
          <Button
            onClick={async () => {
              await navigator.clipboard.writeText(debugHistory);
            }}
            size="md"
            marginTop="4px"
            colorScheme="green"
          >
            Copy to Clipboard
          </Button>
          <Button
            onClick={async () => {
              generateResponse(true);
            }}
            size="md"
            marginTop="4px"
            colorScheme="blue"
          >
            Update
          </Button>
        </Box>
      )}
    </VStack>
  );
};

Chat.displayName = "Chat";

export default Chat;
