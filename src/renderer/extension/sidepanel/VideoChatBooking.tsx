import { Box, Heading, Spinner, useToast } from "@chakra-ui/react";
import { useMutation } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { InlineWidget, useCalendlyEventListener } from "react-calendly";
import { CALENDLY_API_KEY } from "../config/constants";
import { sentry } from "../sentryHelper";
import { sendSms } from "../sidepanel/CustomRequests";

import { useGlobal } from "./hooks/useGlobal";

type CalendlyEvent = {
  resource: {
    calendar_event: null;
    created_at: string;
    end_time: string;
    event_guests: any[];
    event_memberships: {
      buffered_end_time: string;
      buffered_start_time: string;
      user: string;
      user_email: string;
      user_name: string;
    }[];
    event_type: string;
    invitees_counter: {
      active: number;
      limit: number;
      total: number;
    };
    location: {
      location: null;
      type: string;
    };
    meeting_notes_html: null;
    meeting_notes_plain: null;
    name: string;
    start_time: string;
    status: string;
    updated_at: string;
    uri: string;
  };
};

const VideoChatBooking = () => {
  const [availableTimes, setAvailableTimes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { jwtToken, user, account, userId } = useGlobal();
  const toast = useToast();

  const formatTime = (dateTime: string) => {
    const date = new Date(dateTime);
    const hours = date.getUTCHours().toString().padStart(2, "0");
    const minutes = date.getUTCMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const formatDate = (dateTime: string) => {
    const date = new Date(dateTime);
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
    const day = date.getUTCDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const fetchAvailableTimes = async () => {
      // https://calendly.com/integrations/api_webhooks
      // try {
      //   const response = await fetch("https://api.calendly.com/scheduled_events?user=https://api.calendly.com/users/EGDCAB35J4HHCBL5", {
      //     headers: {
      //       Authorization: `Bearer ${calendlyToken}`,
      //     },
      //   });
      //   const data = await response.json();
      //   const times = data.collection.filter(event => new Date(event.start_time) > new Date());
      //   setAvailableTimes(times);
      //   setIsLoading(false);
      // } catch (error) {
      //   console.error("Error fetching available times:", error);
      //   setIsLoading(false);
      const mockedTimes = [
        {
          start_time: new Date(
            Date.now() + 1 * 24 * 60 * 60 * 1000
          ).toISOString()
        }
      ];
      setAvailableTimes(mockedTimes);
      setIsLoading(false);
      // }
    };

    fetchAvailableTimes();
  }, [jwtToken]);

  useCalendlyEventListener({
    onProfilePageViewed: () => console.log("onProfilePageViewed"),
    onDateAndTimeSelected: (e) => console.log("onDateAndTimeSelected", e),
    onEventTypeViewed: () => console.log("onEventTypeViewed"),
    onEventScheduled: async (e) => {
      const eventUri = e.data.payload.event.uri;
      try {
        const response = await fetch(eventUri, {
          headers: {
            Authorization: `Bearer ${CALENDLY_API_KEY || ""}`
          }
        });
        const eventData = await response.json();
        submitBooking(eventData);
        toast({
          title: "Booking Successful!",
          description: "Your video chat booking was successfully created.",
          status: "success",
          duration: 5000,
          isClosable: true
        });
      } catch (error) {
        console.error("Error fetching event details:", error);
      }
    }
  });

  const mutation = useMutation({
    mutationFn: sendSms,
    onSuccess: () => {
      toast({
        title: "Video Chat Booking Successful!",
        description: "Your video chat booking was successfully created.",
        status: "success",
        duration: 1000,
        isClosable: true
      });
    },
    onError: (error) => {
      sentry.captureException(error);
      toast({
        title: "Error",
        description: "Failed to create the video chat booking.",
        status: "error",
        duration: 1000,
        isClosable: true
      });
    }
  });

  const submitBooking = (videoChatEvent: CalendlyEvent) => {
    console.log({ videoChatEvent });
    const messageBody = [
      `MaxAI: New Video Chat Booking`,
      `Event name: ${videoChatEvent?.resource?.name}`,
      `Created date: ${videoChatEvent?.resource?.created_at}`,
      `Event date: ${formatDate(videoChatEvent?.resource?.start_time)}`,
      `Event start time: ${formatTime(videoChatEvent?.resource?.start_time)}`,
      `Event end time: ${formatTime(videoChatEvent?.resource?.end_time)}`,
      `Event notes: ${videoChatEvent?.resource?.meeting_notes_plain}`,
      `Username: ${userId || ""}`,
      `User Custom Name: ${user.currentUserName ? user.currentUserName : ""}`,
      `Onlyfans User's Profile: https://onlyfans.com/${userId || ""}`,
      `Channel: OnlyFans`
    ].join("\n");
    console.log({ messageBody });
    mutation.mutate({
      group_id: account?.settings?.whatsapp_channel,
      messageBody
    });
  };

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%"
        }}
      >
        <Spinner size="xl" />
        <span style={{ marginLeft: "10px" }}>Loading available times...</span>
      </div>
    );
  }

  if (availableTimes.length === 0) {
    return (
      <div>
        Sorry, no times are available in the next 30 days. Respond to the fan
        that Gemma is not ready for video chats right now.
      </div>
    );
  }

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" boxShadow="md">
      <Heading as="h2" size="lg" mb={4}>
        Available Times for Video Chat Booking
      </Heading>
      <InlineWidget url="https://calendly.com/daniel-3-0/30min?hide_event_type_details=1&hide_gdpr_banner=1" />
      {/* <List spacing={3}>
        {availableTimes.map((time, index) => (
          <ListItem
            key={index}
            p={2}
            borderWidth="1px"
            borderRadius="md"
            boxShadow="sm"
          >
            {new Date(time.start_time).toLocaleString()}
          </ListItem>
        ))}
      </List> */}
    </Box>
  );
};

export default VideoChatBooking;
