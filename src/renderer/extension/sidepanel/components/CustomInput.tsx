import { Input, type InputProps } from "@chakra-ui/react";
import { forwardRef, type FC } from "react";

interface CustomInputProps extends InputProps {}

const CustomInput: FC<CustomInputProps> = forwardRef((props, ref) => {
  return (
    <Input
      borderRadius={"16px"}
      border={"1px"}
      borderColor={"#E8E8E8"}
      _disabled={{
        backgroundColor: "#E8E8E8"
      }}
      padding={"16px"}
      height={"49px"}
      fontSize={"15px"}
      color={"#606060"}
      backgroundColor={"#F1F6FE"}
      {...props}
      ref={ref}
    />
  );
});

CustomInput.displayName = "CustomInput";

export { CustomInput };
