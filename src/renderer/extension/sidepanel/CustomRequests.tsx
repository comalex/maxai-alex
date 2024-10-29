import {
  Button,
  Checkbox,
  FormControl,
  FormLabel,
  Textarea,
  VStack,
  useToast,
  Spinner,
  InputGroup,
  InputLeftElement,
  Box
} from "@chakra-ui/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import React from "react";
import { useForm } from "react-hook-form";
import type { CustomRequest, CustomRequestInput } from "../config/types";
import { sentry } from "../sentryHelper";
import { CustomInput } from "../sidepanel/components/CustomInput";
import { useGlobal } from "../sidepanel/hooks/useGlobal";

import { api } from "./api";
import CustomRequestsTracker from "./components/CustomRequestTracker";
import PageInfo from "./components/PageInfo";

export const sendSms = async ({
  group_id,
  messageBody
}: {
  group_id: string;
  messageBody: string;
}) => {
  const url = "https://gate.whapi.cloud/messages/text";
  const headers = {
    accept: "application/json",
    authorization: `Bearer jdTEdakxYoqEz2CoHUcL1pys5D73syOJ`,
    "content-type": "application/json"
  };
  const data = {
    typing_time: 0,
    to: group_id,
    body: messageBody
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      sentry.captureException(
        new Error(`HTTP error! status: ${response.status}`)
      );
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return true;
  } catch (error) {
    sentry.captureException(error);
    console.error("Failed to send SMS:", error);
    throw error;
  }
};

const CustomRequests = () => {
  const { userId, account, agency, logger, jwtToken, user, userUUID } =
    useGlobal();
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();
  const toast = useToast();
  const mutation = useMutation({
    mutationFn: sendSms,
    onSuccess: () => {
      toast({
        title: "Custom request submitted.",
        description: "Your custom request has been submitted successfully.",
        status: "success",
        duration: 1000,
        isClosable: true
      });
    },
    onError: (error) => {
      sentry.captureException(error);
      toast({
        title: "Error",
        description: "Failed to send the custom request.",
        status: "error",
        duration: 1000,
        isClosable: true
      });
    }
  });

  const {
    data: customRequests,
    error: customRequestsError,
    isLoading: isCustomRequestsLoading
  } = useQuery<CustomRequest[], Error>({
    queryKey: ["customRequests"],
    queryFn: async () => {
      if (!jwtToken) {
        throw new Error("No JWT token found");
      }
      const response = await api.fetchCustomRequestsByAccountUUID(
        account.uuid,
        jwtToken
      );
      if (!response.success) {
        throw new Error(response.error || "Failed to fetch custom requests");
      }
      return response.data || [];
    }
  });

  const onSubmit = async (data: any) => {
    if (!account?.settings?.whatsapp_channel) {
      toast({
        title: "Error",
        description:
          "Please specify the whatsapp group chat name on the Settings tab",
        status: "error",
        duration: 1000,
        isClosable: true
      });
      return;
    }

    const basePrice = parseFloat(data.price);
    const customTurnaroundPrice = data.expressTurnaround
      ? account?.settings?.express_turnaround_amount || 0
      : 0;
    const totalPrice = basePrice + customTurnaroundPrice;

    const messageBody = [
      `MaxAI: New Custom Request from User`,
      `Title: ${data.title}`,
      `Promised Delivery Date: ${data.deliveryDate}`,
      `Description: ${data.description}`,
      `Video Duration: ${data.videoDuration} minutes`,
      `Username: ${userId || ""}`,
      `User Custom Name: ${user.currentUserName ? user.currentUserName : ""}`,
      `Onlyfans User's Profile: https://onlyfans.com/${userId || ""}`,
      `Express Turnaround: ${data.expressTurnaround ? "Yes" : "No"}`,
      ...(data.expressTurnaround
        ? [`Turnaround Price: $${customTurnaroundPrice} USD`]
        : []),
      `Price: $${data.price} USD`,
      `Total Price: $${totalPrice} USD`,
      `Channel: OnlyFans`
    ].join("\n");
    logger.debug(messageBody);
    mutation.mutate({
      group_id: account?.settings?.whatsapp_channel,
      messageBody
    });

    const formattedDate = new Date(data.deliveryDate).toISOString();

    const customRequestInput: CustomRequestInput = {
      description: data.description,
      promised_delivery_date: formattedDate,
      video_duration: data.videoDuration,
      user_name: userId,
      turnaround_price: customTurnaroundPrice,
      base_price: basePrice,
      account_id: account.uuid,
      title: data.title,
      user_uuid: userUUID
    };

    await api.createCustomRequest(jwtToken, customRequestInput);
  };

  return (
    <>
      <VStack
        backgroundColor="white"
        p={4}
        borderRadius="10px"
        spacing={4}
        as="form"
        onSubmit={handleSubmit(onSubmit)}
      >
        <PageInfo
          title={"Custom Requests"}
          text={
            "Submit your custom requests with detailed descriptions and pricing. Optionally, choose express turnaround for faster delivery."
          }
        />
        <FormControl mt={4}>
          <FormLabel>User Name</FormLabel>
          <CustomInput
            placeholder="User Name"
            value={userId}
            isReadOnly
            style={{ backgroundColor: "#E8E8E8" }}
          />
        </FormControl>
        <FormControl mt={4}>
          <FormLabel>Request Title</FormLabel>
          <CustomInput
            placeholder="Request Title"
            {...register("title", { required: true })}
          />
        </FormControl>
        <FormControl mt={4}>
          <FormLabel>Request Description</FormLabel>
          <Textarea
            padding={"16px"}
            borderRadius={"16px"}
            border={"1px"}
            borderColor={"#E8E8E8"}
            backgroundColor={"#F1F6FE"}
            placeholder="Enter details about the custom media request. Include what the user would like to be called, what the Creator should do, what the creator should wear, and any other specifics about what the user wants to see in the video"
            {...register("description", { required: true })}
            height="200px"
          />
        </FormControl>
        <FormControl mt={4}>
          <FormLabel>Agreed Base Price</FormLabel>
          <InputGroup>
            <InputLeftElement
              pointerEvents="none"
              color="#606060"
              fontSize={"15px"}
              padding={"16px"}
              height={"100%"}
            >
              $
            </InputLeftElement>
            <CustomInput
              placeholder="Price ($USD)"
              type="number"
              paddingLeft={"28px"}
              {...register("price", { required: true })}
            />
          </InputGroup>
        </FormControl>
        <FormControl mt={4}>
          <FormLabel>Video Duration</FormLabel>
          <CustomInput
            placeholder="Video Duration (minutes)"
            {...register("videoDuration", { required: true })}
          />
        </FormControl>
        <FormControl mt={4}>
          <FormLabel>Promised Date</FormLabel>
          <CustomInput
            placeholder="Agreed delivery date"
            type="date"
            {...register("deliveryDate", { required: true })}
          />
        </FormControl>
        <Box width={"100%"}>
          {account?.settings?.express_turnaround_amount !== null && (
            <Checkbox mt={4} {...register("expressTurnaround")}>
              ${account?.settings?.express_turnaround_amount} express turnaround
            </Checkbox>
          )}
        </Box>
        <Button
          mt={4}
          type="submit"
          width={"100%"}
          height={"56px"}
          borderRadius={"10px"}
          backgroundColor={"#5449F6"}
          color={"white"}
          _disabled={{
            backgroundColor: "#E8E8E8"
          }}
          _hover={{
            backgroundColor: "#2a20c2"
          }}
          isDisabled={mutation.status === "pending"}
        >
          {mutation.status === "pending" ? <Spinner size="sm" /> : "Submit"}
        </Button>
      </VStack>
      {customRequests && customRequests.length > 0 && (
        <CustomRequestsTracker customRequests={customRequests} />
      )}
    </>
  );
};

export default CustomRequests;
