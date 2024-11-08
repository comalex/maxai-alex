import {
  VStack,
  Button,
  FormControl,
  FormLabel,
  Input,
  useToast,
  Box,
} from '@chakra-ui/react';
import React, { useState } from 'react';
import { login } from '../background/api';

// import packageJson from "../../package.json";

interface LoginProps {
  onLoginSuccess: (data: {
    jwtChatToken: string;
    jwtToken: string;
    memberUUID: string;
    email: string;
    voiceGenAbility: number;
  }) => void;
}

export const EXT_VERSION = '0.8';
// export const EXT_VERSION = packageJson?.version
//   ? Number(packageJson.version)
//   : null;

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const getToken = async () => {
    setIsLoading(true);
    try {
      console.log('start');
      const response = await login(email, password, EXT_VERSION);
      const data = response?.data;
      setIsLoading(false);
      if (!data) {
        throw new Error('Try please later');
      }

      const jwtChatToken = data.chat_jwt_token;
      const jwtToken = data.token;
      const memberUUID = data.uuid;
      const voiceGenAbility = data.voice_generation_ability;
      if (!jwtChatToken || !jwtToken) {
        throw new Error('Failed, please try later.');
      }
      onLoginSuccess({
        jwtChatToken,
        jwtToken,
        memberUUID,
        email,
        voiceGenAbility,
      });
    } catch (error) {
      setIsLoading(false);
      toast({
        title: 'Login failed',
        description: error.message,
        status: 'error',
        duration: 1000,
        isClosable: true,
      });
    }
  };

  return (
    <VStack
      spacing={4}
      align="stretch"
      padding={4}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          getToken();
        }
      }}
    >
      <FormControl id="email">
        <FormLabel>Email address</FormLabel>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </FormControl>
      <FormControl id="password">
        <FormLabel>Password</FormLabel>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </FormControl>
      <Button colorScheme="blue" isLoading={isLoading} onClick={getToken}>
        Login
      </Button>
      {EXT_VERSION && <Box>v{EXT_VERSION}</Box>}
    </VStack>
  );
};

export default Login;
