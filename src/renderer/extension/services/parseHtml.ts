import {
  getAccountIdFromProfile,
  getAccountNameFromProfile
} from "./only_fans_parser";

export const parseHtml = () => {
  return {
    accountId: getAccountIdFromProfile(),
    accountName: getAccountNameFromProfile()
  };
};
