import type { PlasmoMessaging } from "../../../plasmohq/messaging";
import { EXTENSION_MESSAGE_TYPES } from "~config/constants";

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  try {
    chrome.tabs.query(
      { active: true, currentWindow: true },
      async function (tabs) {
        const currentTab = tabs[0];
        if (!currentTab) {
          console.log("No active tab found");
          res.send({
            success: false,
            data: "No active tab found-thread-messages"
          });
          res.send({
            success: false,
            data: []
          });
        }
        const content = await chrome.tabs.sendMessage(currentTab.id, {
          type: EXTENSION_MESSAGE_TYPES.RETRIEVE_ONLY_FANS_SUBS
        });
        res.send({
          success: true,
          data: content
        });
      }
    );
  } catch (err) {
    console.log("EXTENSION_MESSAGE_TYPES.RETRIEVE_ONLY_FANS_SUBS end", err);
    res.send({
      success: false,
      data: []
    });
  }
};

export default handler;
