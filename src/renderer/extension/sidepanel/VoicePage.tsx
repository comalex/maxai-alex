import {
  Button,
  FormControl,
  FormLabel,
  Textarea,
  VStack,
  Spinner,
  Text,
  Box
} from "@chakra-ui/react";
import React, { useState, useEffect } from "react";
import { PageName } from "../config/types";
import { GeneratePen, DownloadIcon } from "../icons";
import { api } from "../sidepanel/api";
import AudioPlayer from "../sidepanel/components/AudioPlayer";
import { useGlobal } from "../sidepanel/hooks/useGlobal";

import useAudioGenerator from "./hooks/useAudioGenerator";

export const downloadAudio = (audioUrl) => {
  const link = document.createElement("a");
  link.href = audioUrl;
  link.download = "voice-note.mp3";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const VoicePage = () => {
  const [text, setText] = useState("");
  const {
    generateAudio,
    setIsAudioGenerating,
    isAudioGenerating,
    audioUrl,
    clear: clearAudio
  } = useAudioGenerator();
  // const audioUrl = "https://s3-us-east-2.amazonaws.com/user-chat-files-public/20240621101839_old_QQEFZV5FGFAS0I9CCTP55NVK7RSLR65E.mp3"
  const {
    agency,
    activeTab,
    account,
    jwtToken,
    autoPlayState,
    setAutoPlayState,
    voiceGenAbility
  } = useGlobal();
  const [charactersRemaining, setCharactersRemaining] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (agency?.settings?.voice_generation_characters_remaining !== undefined) {
      setCharactersRemaining(
        agency.settings.voice_generation_characters_remaining
      );
    }
  }, [agency]);

  useEffect(() => {
    clearAudio();
  }, [activeTab]);

  const handleTextChange = (event) => {
    setText(event.target.value);
  };

  const handleGenerateAudio = async () => {
    clearAudio();
    await generateAudio(text, account.uuid);
    setCharactersRemaining((prev) => prev - text.length);
  };

  const cancelGeneration = () => {
    setIsAudioGenerating(false);
  };

  useEffect(() => {
    if (audioUrl) {
      fetchAgency();
    }
  }, [audioUrl]);

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

  const getNextMonthName = () => {
    const date = new Date();
    const nextMonth = new Date(date.setMonth(date.getMonth() + 1));
    nextMonth.setDate(1);
    return nextMonth.toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric"
    });
  };

  return (
    <VStack
      backgroundColor={"white"}
      padding={"16px"}
      borderRadius={"10px"}
      spacing={4}
    >
      <FormControl>
        <FormLabel fontSize={"16px"} fontWeight={500} color={"#0E0E0E"}>
          Generate Voice Recording
        </FormLabel>
        <Textarea
          fontSize={"15px"}
          backgroundColor={"#F4F4F4"}
          border={"1px"}
          borderRadius={"16px"}
          color={"#606060"}
          borderColor={"#E8E8E8"}
          placeholder="Enter text to convert to speech"
          value={text}
          onChange={handleTextChange}
        />
        <Box
          display={"flex"}
          justifyContent={"space-between"}
          alignItems={"flex-end"}
        >
          <Text mt={2} fontSize={"10px"} color="#606060">
            {isLoading ? (
              <Spinner size="sm" mr={2} />
            ) : (
              `${charactersRemaining} characters remaining,`
            )}
          </Text>
          <Text fontSize={"10px"} color="#606060">
            {text?.length || 0} characters
          </Text>
        </Box>
        <Box>
          <Text
            fontSize={"10px"}
            color="#606060"
            display={"flex"}
            justifyContent={"space-between"}
            alignItems={"flex-end"}
          >
            resets on {getNextMonthName()}
          </Text>
        </Box>
      </FormControl>
      <Button
        onClick={() => {
          if (isAudioGenerating) {
            cancelGeneration();
            setIsLoading(false);
          } else {
            handleGenerateAudio();
            setIsLoading(true);
          }
        }}
        colorScheme="blue"
        display={"flex"}
        gap={"8px"}
        w={"100%"}
        borderRadius={"10px"}
        color={"#5433FF"}
        backgroundColor={"#F1F6FE"}
        _hover={{
          backgroundColor: "#dbe7fa"
        }}
        border={"2px"}
        borderColor={"#5433FF"}
        isDisabled={!voiceGenAbility}
      >
        {isAudioGenerating ? (
          <>
            <Spinner size="sm" mr={2} />
            Cancel
          </>
        ) : (
          <>
            <GeneratePen /> Generate Audio
          </>
        )}
      </Button>
      {/* <Checkbox
        disabled={isAudioGenerating}
        isChecked={autoPlayState}
        onChange={() => setAutoPlayState(!autoPlayState)}
      >
        Autoplay {autoPlayState ? "On" : "Off"}
      </Checkbox> */}

      {audioUrl && activeTab === PageName.VoicePage && (
        <Box
          mt={4}
          display={"flex"}
          alignItems={"center"}
          gap={"8px"}
          justifyContent={"space-between"}
          w="100%"
        >
          <Box
            borderRadius={"200px"}
            boxShadow={"0px 0px 18px -1px #5449F6"}
            border={"2px"}
            borderColor={"#5433FF"}
          >
            <AudioPlayer audioUrl={audioUrl} audioText={text} />
          </Box>
          <Button
            width={"50px"}
            border={"2px"}
            borderColor={"#5433FF"}
            height={"40px"}
            backgroundColor={"#F1F6FE"}
            borderRadius={"10px"}
            onClick={() => {
              downloadAudio(audioUrl);
            }}
            leftIcon={<DownloadIcon />}
            iconSpacing={0}
          ></Button>
        </Box>
      )}
    </VStack>
  );
};

export default VoicePage;
