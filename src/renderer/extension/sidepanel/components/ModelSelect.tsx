import { FormLabel, HStack, Select, useToast } from "@chakra-ui/react";
import React from "react";
import { useGlobal } from "../../sidepanel/hooks/useGlobal";

type ModelSelectProps = {
  disabled?: boolean;
  label?: string;
};

export const ModelSelect = ({ label, disabled = false }: ModelSelectProps) => {
  const toast = useToast();
  const { models } = useGlobal();

  const { selectedModel, setSelectedModel } = useGlobal();

  return (
    <HStack width="full" justifyContent="start" margin="10px">
      {label === undefined ? (
        <FormLabel
          htmlFor="model-select"
          paddingTop="1"
          width="auto"
          minWidth="max-content"
        >
          Select a model:
        </FormLabel>
      ) : null}
      <Select
        id="model-select"
        value={selectedModel?.uuid}
        onChange={(e) => {
          const model = models?.find((model) => model.uuid === e.target.value);
          if (model?.uuid) {
            setSelectedModel(model);
          } else {
            toast({
              title: "Model is not selected",
              status: "error",
              duration: 1000,
              isClosable: true
            });
          }
        }}
        disabled={disabled}
      >
        <option value="">Select model</option>
        {models?.map((model) => (
          <option key={model.uuid} value={model.uuid}>
            {model.influencer_character_last_name
              ? `${model.influencer_character} ${model.influencer_character_last_name}`
              : model.influencer_character}
          </option>
        ))}
      </Select>
    </HStack>
  );
};
