import {
  getAccountIdFromProfile,
  getAccountNameFromProfile,
  getDocument
} from "./only_fans_parser";

export const parseHtml = async (currentWebviewId: string) => {
  const doc = await getDocument(currentWebviewId);
  return {
    accountId: await getAccountIdFromProfile(doc),
    accountName: await getAccountNameFromProfile(doc)
  };
};
