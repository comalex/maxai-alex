import { Text, Card, CardBody, Image, Box, Spinner } from "@chakra-ui/react";
import React, { useState } from "react";
import type { FC } from "react";
import { Status } from "../../config/constants";
import { type Payment } from "../../config/types";

interface CardHistoryProps extends Payment {}

const CardPurchaseHistory: FC<CardHistoryProps> = (purchase) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  return (
    <Card w="full" border={"1px"} borderRadius={"20px"} borderColor={"#E8E8E8"}>
      <CardBody
        display={"flex"}
        gap={"8px"}
        alignItems={"center"}
        justifyContent={"space-between"}
      >
        {!isError && purchase.imageUrl && (
          <Box
            width={"80px"}
            height={"80px"}
            position={"relative"}
            backgroundColor={"#E9E9E9"}
            borderRadius={"10px"}
          >
            {isLoading && (
              <Spinner
                position={"absolute"}
                top={"35%"}
                margin={"auto"}
                left={0}
                right={0}
              />
            )}
            <Image
              width={"80px"}
              height={"80px"}
              src={purchase.imageUrl}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsError(true);
              }}
              borderRadius={"10px"}
              alt={"avatar-purchase"}
            />
          </Box>
        )}
        <Box>
          <Text fontSize="md" textAlign="left">
            Date: {new Date(purchase.time).toLocaleString()}
          </Text>
          <Text
            fontSize="md"
            textAlign="left"
            color={
              purchase.paidStatus === Status.notPaid ? "#F45252" : "#00BB83"
            }
          >
            Amount: ${purchase.price}
          </Text>
        </Box>
        <Text
          fontSize={"16px"}
          fontWeight={500}
          whiteSpace={"nowrap"}
          textAlign="left"
          paddingX={"16px"}
          paddingY={"8px"}
          borderRadius={"10px"}
          backgroundColor={
            purchase.paidStatus === Status.notPaid ? "#F45252" : "#00BB83"
          }
          color={"white"}
        >
          {purchase.paidStatus}
        </Text>
      </CardBody>
    </Card>
  );
};

export { CardPurchaseHistory };
