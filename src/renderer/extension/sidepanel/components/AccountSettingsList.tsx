import { ListItem, Text, UnorderedList, Link, Box } from "@chakra-ui/react";
import React from "react";

const AccountSettingsList = ({ settings }) => {
  const wrapLinksInText = (text) => {
    if (!text) return null;
    let parsedText;
    try {
      parsedText = JSON.parse(text);
    } catch (e) {
      console.log(e);
      return null;
    }

    const urlRegex = /(https?:\/\/[^\s]+)/g;

    // Split the text into lines
    const lines = parsedText.split("\n");

    // Process each line to wrap URLs in <Link> components
    const processedLines = lines.flatMap((line, lineIndex) => {
      // Split each line by URLs
      const parts = line.split(urlRegex);

      // Map each part to either a <Link> or a <span>
      const lineComponents = parts.map((part, index) => {
        if (urlRegex.test(part)) {
          return (
            <Link
              key={`${lineIndex}-${index}`}
              href={part}
              color="blue"
              isExternal
            >
              {part}
            </Link>
          );
        } else {
          return (
            <span
              key={`${lineIndex}-${index}`}
              dangerouslySetInnerHTML={{ __html: part }}
            />
          );
        }
      });

      // Add a <br /> element after each line (except the last line)
      return [...lineComponents, <br key={`br-${lineIndex}`} />];
    });

    // Remove the last <br /> element to avoid an extra line break at the end
    if (processedLines.length > 0) {
      processedLines.pop(); // Remove the last <br /> element
    }

    return processedLines;
  };
  return (
    <UnorderedList>
      {/*{settings?.y && (*/}
      {/*  <ListItem>*/}
      {/*    <Text fontSize="sm" textAlign="left">*/}
      {/*      <strong>Character Card: </strong>*/}
      {/*      {settings.y}*/}
      {/*    </Text>*/}
      {/*  </ListItem>*/}
      {/*)}*/}
      {/*{settings?.express_turnaround_amount !== undefined && (*/}
      {/*  <ListItem>*/}
      {/*    <Text fontSize="sm" textAlign="left">*/}
      {/*      <strong>Express Turnaround Amount: </strong>*/}
      {/*      {settings.express_turnaround_amount}*/}
      {/*    </Text>*/}
      {/*  </ListItem>*/}
      {/*)}*/}
      {/*{settings?.deprioritized_user_window !== undefined && (*/}
      {/*  <ListItem>*/}
      {/*    <Text fontSize="sm" textAlign="left">*/}
      {/*      <strong>Deprioritized User Window: </strong>*/}
      {/*      {settings.deprioritized_user_window}*/}
      {/*    </Text>*/}
      {/*  </ListItem>*/}
      {/*)}*/}
      {/*{settings?.message_threshold !== undefined && (*/}
      {/*  <ListItem>*/}
      {/*    <Text fontSize="sm" textAlign="left">*/}
      {/*      <strong>Message Threshold: </strong>*/}
      {/*      {settings.message_threshold}*/}
      {/*    </Text>*/}
      {/*  </ListItem>*/}
      {/*)}*/}
      {/*{settings?.discount_percentage !== undefined && (*/}
      {/*  <ListItem>*/}
      {/*    <Text fontSize="sm" textAlign="left">*/}
      {/*      <strong>Discount Percentage: </strong>*/}
      {/*      {settings.discount_percentage}*/}
      {/*    </Text>*/}
      {/*  </ListItem>*/}
      {/*)}*/}
      {settings?.biographical_information && (
        <ListItem>
          <Text fontSize="md" textAlign="left">
            <strong>Biographical information: </strong>
            <br />
            <Box marginLeft={4}>
              {wrapLinksInText(settings.biographical_information)}
            </Box>
          </Text>
        </ListItem>
      )}
      {settings?.custom_names?.length && (
        <ListItem>
          <Text fontSize="md" textAlign="left">
            <strong>Custom Names: </strong>
            <UnorderedList styleType="'- '">
              {settings.custom_names.map((n) => (
                <ListItem key={n.value}>{n.value}</ListItem>
              ))}
            </UnorderedList>
          </Text>
        </ListItem>
      )}
      {settings?.drip_message && (
        <ListItem>
          <Text fontSize="md" textAlign="left">
            <strong>Drip Message: </strong>
            <br />
            <Box marginLeft={4}>{settings.drip_message}</Box>
          </Text>
        </ListItem>
      )}
      {/*{settings?.model?.name && (*/}
      {/*  <ListItem>*/}
      {/*    <Text fontSize="sm" textAlign="left">*/}
      {/*      <strong>Selected Model: </strong>*/}
      {/*      {settings.model.name}*/}
      {/*    </Text>*/}
      {/*  </ListItem>*/}
      {/*)}*/}
      {/*{settings?.custom_content_pricing && (*/}
      {/*  <ListItem>*/}
      {/*    <Text fontSize="sm" textAlign="left">*/}
      {/*      <strong>Custom Content Pricing: </strong>*/}
      {/*    </Text>*/}
      {/*    <UnorderedList styleType="'- '">*/}
      {/*      {Object.entries(settings.custom_content_pricing).map(*/}
      {/*        ([key, _fields]: [*/}
      {/*          string,*/}
      {/*          { group?: string; price?: string; description?: string }*/}
      {/*        ]) => (*/}
      {/*          <ListItem key={key}>*/}
      {/*            <Text fontSize="sm" textAlign="left">*/}
      {/*              <strong>{`Custom Content Pricing - ${_fields?.group || ""}`}</strong>*/}
      {/*              <UnorderedList styleType="'- '">*/}
      {/*                <ListItem>*/}
      {/*                  <Text fontSize="sm" textAlign="left">*/}
      {/*                    Price ($USD): {_fields?.price || ""}*/}
      {/*                  </Text>*/}
      {/*                </ListItem>*/}
      {/*                <ListItem>*/}
      {/*                  <Text fontSize="sm" textAlign="left">*/}
      {/*                    Description: {_fields?.description || ""}*/}
      {/*                  </Text>*/}
      {/*                </ListItem>*/}
      {/*              </UnorderedList>*/}
      {/*            </Text>*/}
      {/*          </ListItem>*/}
      {/*        )*/}
      {/*      )}*/}
      {/*    </UnorderedList>*/}
      {/*  </ListItem>*/}
      {/*)}*/}
    </UnorderedList>
  );
};

export default AccountSettingsList;
