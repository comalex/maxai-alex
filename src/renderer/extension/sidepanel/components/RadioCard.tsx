import { Box, useRadio } from "@chakra-ui/react";

export function RadioCard(props) {
  const { getInputProps, getCheckboxProps } = useRadio(props);

  const input = getInputProps();
  const checkbox = getCheckboxProps();

  return (
    <Box as="label">
      <input {...input} />
      <Box
        {...checkbox}
        fontSize="13px"
        cursor="pointer"
        borderWidth="1.5px"
        borderRadius="15px"
        _checked={{
          bg: "#F1F6FE",
          color: "#5449F6",
          borderColor: "#5449F6"
        }}
        px={2}
        py={1}
      >
        {props.children}
      </Box>
    </Box>
  );
}
