import {
  FormControl,
  FormLabel,
  Input,
  FormHelperText,
  Button,
  Spinner,
  useToast,
  Tooltip,
  Divider,
  VStack,
  Box,
  Textarea,
  Checkbox,
  Text
} from "@chakra-ui/react";
import React, { useEffect, useMemo, useReducer, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import type { AccountSettings, CustomContentPricing } from "../config/types";
import { sentry } from "../sentryHelper";

import { useGlobal } from "./hooks/useGlobal";

type State = {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
};

type Action =
  | { type: "SAVE_REQUEST" }
  | { type: "SAVE_SUCCESS" }
  | { type: "SAVE_ERROR" };

const initialState: State = {
  isLoading: false,
  isSuccess: false,
  isError: false
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "SAVE_REQUEST":
      return { ...state, isLoading: true, isSuccess: false, isError: false };
    case "SAVE_SUCCESS":
      return { ...state, isLoading: false, isSuccess: true };
    case "SAVE_ERROR":
      return { ...state, isLoading: false, isError: true };
    default:
      return state;
  }
};

const GeneralSettings: React.FC<{
  logout: () => void;
  isPermitted: boolean;
}> = ({ logout, isPermitted }) => {
  const [zoom, setZoom] = useState(localStorage.getItem("zoom") || 100);
  const {
    isDebugMode,
    accountId,
    setDebugMode,
    account,
    updateAccount,
    setAutoPlayState,
    setAutoGenerateResponseState,
    autoPlayState,
    autoGenerateResponseState
  } = useGlobal();

  const { register, handleSubmit, control, reset } = useForm<AccountSettings>({
    defaultValues: {
      express_turnaround_amount:
        account?.settings?.express_turnaround_amount ?? 0,
      deprioritized_user_window:
        account?.settings?.deprioritized_user_window ?? 0,
      message_threshold: account?.settings?.message_threshold ?? 0,
      discount_percentage: account?.settings?.discount_percentage ?? 0,
      whatsapp_channel: account?.settings?.whatsapp_channel,
      custom_content_pricing: account?.settings?.custom_content_pricing,
      customs_price_list: account?.settings?.customs_price_list,
      auto_play_state: account?.settings?.auto_play_state,
      auto_generate_response_state:
        account?.settings?.auto_generate_response_state
    }
  });

  useEffect(() => {
    if (account?.settings) {
      reset({
        express_turnaround_amount:
          account.settings.express_turnaround_amount ?? 0,
        deprioritized_user_window:
          account.settings.deprioritized_user_window ?? 0,
        message_threshold: account.settings.message_threshold ?? 0,
        discount_percentage: account.settings.discount_percentage ?? 0,
        whatsapp_channel: account.settings.whatsapp_channel,
        custom_content_pricing: account.settings.custom_content_pricing,
        customs_price_list: account.settings.customs_price_list,
        auto_play_state: account.settings.auto_play_state,
        auto_generate_response_state:
          account.settings.auto_generate_response_state
      });
    }
  }, [account, reset]);

  const { fields } = useFieldArray({
    control,
    name: "custom_content_pricing"
  });

  const handleChangeZoom = (event) => {
    const value = +event.target.value;
    document.body.style.zoom = `${value / 100}`;
    localStorage.setItem("zoom", `${value}`);
    setZoom(value);
  };

  const groupedFields = useMemo(() => {
    return fields.reduce(
      (acc, field) => {
        const { group, ...rest } = field;
        if (!acc[group]) {
          acc[group] = [];
        }
        acc[group].push({ group, ...rest });
        return acc;
      },
      {} as { [key: string]: Array<CustomContentPricing> }
    );
  }, []);

  const [state, dispatch] = useReducer(reducer, initialState);
  const toast = useToast();

  const onSubmit = async (data: any) => {
    if (!accountId) {
      toast({
        title: "Error",
        description:
          "Account ID is not detected. Please try restarting the page and extension.",
        status: "error",
        duration: 1000,
        isClosable: true
      });
      return;
    }
    dispatch({ type: "SAVE_REQUEST" });
    try {
      const { whatsapp_channel, whatsapp_channel_link, ...updatedSettings } =
        account?.settings || {};
      await updateAccount({
        ...account,
        settings: {
          ...(updatedSettings as AccountSettings),
          express_turnaround_amount: data.express_turnaround_amount
            ? parseInt(data.express_turnaround_amount, 10)
            : null,
          deprioritized_user_window: data.deprioritized_user_window
            ? parseInt(data.deprioritized_user_window, 10)
            : null,
          message_threshold: data.message_threshold
            ? parseInt(data.message_threshold, 10)
            : null,
          discount_percentage: data.discount_percentage
            ? parseInt(data.discount_percentage, 10)
            : null,
          custom_content_pricing: data.custom_content_pricing,
          customs_price_list: data.customs_price_list
            ? data.customs_price_list
            : "",
          auto_play_state: autoPlayState,
          auto_generate_response_state: autoGenerateResponseState
        }
      });
      dispatch({ type: "SAVE_SUCCESS" });
      toast({
        title: "Success",
        description: "Settings saved successfully.",
        status: "success",
        duration: 1000,
        isClosable: true
      });
    } catch (error) {
      console.log(error);
      dispatch({ type: "SAVE_ERROR" });
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        status: "error",
        duration: 1000,
        isClosable: true
      });
    }
  };

  useEffect(() => {
    const zoom = localStorage.getItem("zoom") || 100;
    document.body.style.zoom = `${+zoom / 100}`;
  }, []);

  return (
    <FormControl
      as="form"
      onSubmit={handleSubmit(onSubmit)}
      backgroundColor="white"
      p={4}
      borderRadius="10px"
      display="flex"
      flexDirection="column"
      gap={4}
    >
      <FormControl
        display="flex"
        gap={4}
        width="100%"
        alignItems="center"
        justifyContent="center"
      >
        {isPermitted && (
          <Button
            // width="50%"
            variant="unstyled"
            p={4}
            borderRadius="10px"
            backgroundColor="#5433FF"
            display="flex"
            color="white"
            _hover={{
              backgroundColor: "#360FFF"
            }}
            aria-label="Toggle Debug Mode"
            onClick={() => {
              sentry.captureException(new Error("error"));
              setDebugMode(!isDebugMode);
            }}
          >
            {isDebugMode ? "🐞 Debug Mode Enabled" : "🐛 Debug Mode Disabled"}
          </Button>
        )}
        {"   "}
        <Tooltip label="Log out" aria-label="Log out Tooltip">
          <Button
            // width="50%"
            variant="unstyled"
            display="flex"
            p={4}
            borderRadius="10px"
            backgroundColor="#2F3341"
            color="white"
            _disabled={{
              backgroundColor: "#2F3341",
              opacity: "30%"
            }}
            _hover={{
              backgroundColor: "#2F3341"
            }}
            onClick={logout}
          >
            Log out
          </Button>
        </Tooltip>
      </FormControl>

      <FormControl display="flex" flexDirection="column" gap={2}>
        <Checkbox
          width="fit-content"
          variant="unstyled"
          display="inline-flex"
          borderColor="#5433FF"
          iconColor="#5433FF"
          _checked={{
            bg: "none",
            borderColor: "#5433FF"
          }}
          _hover={{
            bg: "none",
            borderColor: "#5433FF"
          }}
          _focus={{
            boxShadow: "none"
          }}
          _before={{
            content: '""',
            display: "none"
          }}
          sx={{
            "& .chakra-checkbox__control": {
              backgroundColor: "transparent",
              borderColor: "#5433FF"
            },
            "& .chakra-checkbox__control[data-checked]": {
              backgroundColor: "transparent",
              borderColor: "#5433FF"
            }
          }}
          isChecked={autoPlayState}
          onChange={() => setAutoPlayState(!autoPlayState)}
        >
          <Text fontSize="14px" fontWeight={400}>
            Autoplay
          </Text>
        </Checkbox>
        <Checkbox
          width="fit-content"
          variant="unstyled"
          display="inline-flex"
          borderColor="#5433FF"
          iconColor="#5433FF"
          _checked={{
            bg: "none",
            borderColor: "#5433FF"
          }}
          _hover={{
            bg: "none",
            borderColor: "#5433FF"
          }}
          _focus={{
            boxShadow: "none"
          }}
          _before={{
            content: '""',
            display: "none"
          }}
          sx={{
            "& .chakra-checkbox__control": {
              backgroundColor: "transparent",
              borderColor: "#5433FF"
            },
            "& .chakra-checkbox__control[data-checked]": {
              backgroundColor: "transparent",
              borderColor: "#5433FF"
            }
          }}
          isChecked={autoGenerateResponseState}
          onChange={() =>
            setAutoGenerateResponseState(!autoGenerateResponseState)
          }
        >
          <Text fontSize="14px" fontWeight={400}>
            Autogenerate Response
          </Text>
        </Checkbox>
      </FormControl>

      {/*<FormControl style={{ marginBottom: "1rem" }}>*/}
      {/*  <FormLabel>WhatsApp Channel</FormLabel>*/}
      {/*  {account?.settings?.whatsapp_channel_link && (*/}
      {/*    <Link*/}
      {/*      href={account.settings.whatsapp_channel_link}*/}
      {/*      isExternal*/}
      {/*      color="teal.500"*/}
      {/*    >*/}
      {/*      {account.settings.whatsapp_channel_link}*/}
      {/*    </Link>*/}
      {/*  )}*/}
      {/*</FormControl>*/}
      <FormControl width="100%" display="flex" flexDirection="column" gap={2}>
        <Text fontSize="15px" fontWeight={400}>
          Zoom Page
        </Text>
        <Input
          variant="unstyled"
          borderRadius="16px"
          border="1px solid #E8E8E8"
          backgroundColor="#FFFDFD"
          p={4}
          color="#606060"
          type="number"
          onChange={handleChangeZoom}
          placeholder="0"
          value={zoom}
        />
      </FormControl>
      <FormControl width="100%" display="flex" flexDirection="column" gap={2}>
        <Text fontSize="15px" fontWeight={400}>
          Express Turnaround Amount ($USD)
        </Text>
        <Input
          variant="unstyled"
          borderRadius="16px"
          border="1px solid #E8E8E8"
          backgroundColor="#FFFDFD"
          p={4}
          color="#606060"
          type="number"
          {...register("express_turnaround_amount")}
          placeholder="Express turnaround amount"
        />
      </FormControl>
      {/* <FormControl width="100%" display="flex" flexDirection="column" gap={2}>
        <Text fontSize="15px" fontWeight={400}>
          Deprioritized User Duration
        </Text>
        <Input
          variant="unstyled"
          borderRadius="16px"
          border="1px solid #E8E8E8"
          backgroundColor="#FFFDFD"
          p={4}
          color="#606060"
          type="number"
          {...register("deprioritized_user_window")}
          placeholder="Enter number of days"
        />
      </FormControl> */}
      {/* <FormHelperText>
        This is how long a user will remain Deprioritized (in days) before the
        Deprioritized status will be cleared
      </FormHelperText> */}
      <FormControl width="100%" display="flex" flexDirection="column" gap={2}>
        <Text fontSize="15px" fontWeight={400}>
          Message Threshold
        </Text>
        <Input
          variant="unstyled"
          borderRadius="16px"
          border="1px solid #E8E8E8"
          backgroundColor="#FFFDFD"
          p={4}
          color="#606060"
          type="number"
          {...register("message_threshold")}
          placeholder="Enter number of messages"
        />
      </FormControl>
      {/* <FormHelperText>
        This is the number of messages to check for user activity (purchases or
        tips)
      </FormHelperText> */}
      {/* <FormControl width="100%" display="flex" flexDirection="column" gap={2}>
        <Text fontSize="15px" fontWeight={400}>
          Discount Percentage
        </Text>
        <Input
          variant="unstyled"
          borderRadius="16px"
          border="1px solid #E8E8E8"
          backgroundColor="#FFFDFD"
          p={4}
          color="#606060"
          type="number"
          {...register("discount_percentage")}
          placeholder="Enter discount percentage"
        />
      </FormControl> */}
      {/* <FormHelperText>
        This is the discount amount on the next user payment (in percentage)
      </FormHelperText>

      <Divider /> */}
      {/* <FormControl width="100%" display="flex" flexDirection="column" gap={4}>
        <Text fontSize="15px" fontWeight={400}>
          Custom Content Pricing
        </Text>
        <Box display="flex" flexDirection="column" gap={2}>
          <Text fontSize="12px" fontWeight={400}>
            Content Pricing offer:
          </Text>
          <Textarea
            {...register("customs_price_list")}
            variant="unstyled"
            borderRadius="16px"
            border="1px solid #E8E8E8"
            backgroundColor="#F1F6FE"
            color="#606060"
            p={4}
            rows={6}
            whiteSpace="pre-wrap"
            maxLength={1000}
            placeholder="$150 for a 5 minute video, $250 for a 10 minute video. Add an extra $100 for any custom costumes or latex catsuits. I also sell photo packs, 5 for $100 or 10 for $150. Custom voice notes, $50 for 60 seconds, $100 for 5 minutes. And I also sell my used panties, $150 for a pair."
            style={{
              resize: "none",
              width: "100%",
              height: "160px",
              overflow: "auto"
            }}
          />
        </Box>
      </FormControl> */}

      {/*{Object.entries(groupedFields).map(([group, _fields]) => (*/}
      {/*  <div*/}
      {/*    key={group}*/}
      {/*    style={{*/}
      {/*      marginBottom: "1.5rem",*/}
      {/*      borderBottom: "1px solid #e2e8f0",*/}
      {/*      paddingBottom: "1rem"*/}
      {/*    }}*/}
      {/*  >*/}
      {/*    <FormLabel*/}
      {/*      mt={4}*/}
      {/*      fontWeight="bold"*/}
      {/*    >{`Custom Content Pricing - ${group}`}</FormLabel>*/}
      {/*    {_fields.map((field, index) => {*/}
      {/*      const fieldIndex = fields.findIndex((f) => f?.id === field?.id);*/}
      {/*      return (*/}
      {/*        <div key={index} style={{ marginBottom: "1.5rem" }}>*/}
      {/*          <HStack mt={2} mb={2} spacing={4}>*/}
      {/*            <FormLabel mb={0} whiteSpace="nowrap" width="150px">*/}
      {/*              Price ($USD)*/}
      {/*            </FormLabel>*/}
      {/*            <Input*/}
      {/*              type="number"*/}
      {/*              {...register(`custom_content_pricing.${fieldIndex}.price`)}*/}
      {/*              placeholder="Enter price"*/}
      {/*            />*/}
      {/*          </HStack>*/}

      {/*          <HStack mt={2} mb={2} spacing={4}>*/}
      {/*            <FormLabel mb={0} whiteSpace="nowrap" width="150px">*/}
      {/*              Description*/}
      {/*            </FormLabel>*/}
      {/*            <Input*/}
      {/*              type="text"*/}
      {/*              {...register(*/}
      {/*                `custom_content_pricing.${fieldIndex}.description`*/}
      {/*              )}*/}
      {/*              placeholder="Enter description"*/}
      {/*            />*/}
      {/*          </HStack>*/}
      {/*        </div>*/}
      {/*      );*/}
      {/*    })}*/}
      {/*  </div>*/}
      {/*))}*/}

      <Box
        width="100%"
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        <Button
          width="100%"
          maxWidth="350px"
          type="submit"
          variant="unstyled"
          p={4}
          borderRadius="10px"
          backgroundColor="#5433FF"
          display="flex"
          color="white"
          _hover={{
            backgroundColor: "#360FFF"
          }}
          isLoading={state.isLoading}
        >
          {state.isLoading ? <Spinner size="sm" /> : "Save"}
        </Button>
      </Box>
    </FormControl>
  );
};
export default GeneralSettings;
