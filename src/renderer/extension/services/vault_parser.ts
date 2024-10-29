import type { Vault } from "~config/types";

import { getAccountIdFromProfile } from "./only_fans_parser";

export const ONLY_FANS_ELEMENT_CLASS_NAMES = {
  ACTIVE_VAULT_CONTAINER: "div.b-rows-lists__item.m-current",
  VAULT_NAME: "div.b-rows-lists__item__name",
  VAULT_MEDIA_COUNT: "div.b-rows-lists__item__count"
};

export const vaultParser = (): Partial<Vault> => {
  const vaultContainer = document.body.querySelector(
    ONLY_FANS_ELEMENT_CLASS_NAMES.ACTIVE_VAULT_CONTAINER
  );
  const vaultNameElement =
    vaultContainer &&
    vaultContainer.querySelector(ONLY_FANS_ELEMENT_CLASS_NAMES.VAULT_NAME);
  const vaultName = vaultNameElement
    ? vaultNameElement.textContent.trim()
    : null;
  const imageCountElement = vaultContainer
    ? vaultContainer.querySelector(
        ONLY_FANS_ELEMENT_CLASS_NAMES.VAULT_MEDIA_COUNT
      )
    : null;
  const imageCountMatch = imageCountElement
    ? imageCountElement.textContent.match(/\d+/)
    : null;
  const imageCount = imageCountMatch ? parseInt(imageCountMatch[0], 10) : 0;

  if (!vaultName) {
    return null;
  }

  return {
    accountId: getAccountIdFromProfile(),
    name: vaultName,
    mediaCount: imageCount
  };
};
