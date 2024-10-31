import {
  getAccountIdFromProfile,
  getAccountNameFromProfile,
  getDocument
} from "./only_fans_parser";

export const parseHtml = async () => {
  const doc = await getDocument();
  return {
    accountId: await getAccountIdFromProfile(doc),
    accountName: await getAccountNameFromProfile(doc)
  };
};
