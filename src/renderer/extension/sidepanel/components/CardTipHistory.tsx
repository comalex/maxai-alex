import { Text, Card, CardBody } from "@chakra-ui/react";
import React from "react";
import type { FC } from "react";
import { Status } from "../../config/constants";
import { type Payment } from "../../config/types";

interface CardHistoryProps extends Payment {}

const CardTipHistory: FC<CardHistoryProps> = (tip) => {
  return (
    <Card w="full" border={"1px"} borderRadius={"20px"} borderColor={"#E8E8E8"}>
      <CardBody
        display={"flex"}
        gap={"8px"}
        alignItems={"center"}
        justifyContent={"space-between"}
      >
        <Text textAlign="left" fontWeight={"500"} fontSize={"14px"}>
          <Text
            as={"span"}
            fontWeight={"400"}
            fontSize={"14px"}
            color={"#989898"}
          >
            Date:
          </Text>{" "}
          {new Date(tip.time).toLocaleString()}
        </Text>
        <Text
          fontSize={"16px"}
          fontWeight={500}
          whiteSpace={"nowrap"}
          textAlign="left"
          paddingX={"16px"}
          paddingY={"8px"}
          borderRadius={"10px"}
          backgroundColor={
            tip.paidStatus === Status.notPaid ? "#F45252" : "#00BB83"
          }
          color={"white"}
        >
          ${tip.price}
        </Text>
      </CardBody>
    </Card>
  );
};

export { CardTipHistory };
