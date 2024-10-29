import type { PlasmoMessaging } from "../../../plasmohq/messaging";
import { EXTENSION_MESSAGE_TYPES } from "~config/constants";

const refreshPage = (tabId: number) => {
  chrome.tabs.reload(tabId, {}, () => {
    console.log("Page refreshed");
  });
};

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
            data: "No active tab found data.ts"
          });
          return;
        }
        let content;

        try {
          switch (req.body.type) {
            case EXTENSION_MESSAGE_TYPES.ADD_LISTENERS:
              content = await chrome.tabs.sendMessage(currentTab.id, {
                type: EXTENSION_MESSAGE_TYPES.ADD_LISTENERS
              });
              break;
            case EXTENSION_MESSAGE_TYPES.READ_HTML:
              content = await chrome.tabs.sendMessage(currentTab.id, {
                type: EXTENSION_MESSAGE_TYPES.READ_HTML
              });
              break;
            case EXTENSION_MESSAGE_TYPES.ADD_URL_CHANGE_LISTENERS:
              content = await chrome.tabs.sendMessage(currentTab.id, {
                type: EXTENSION_MESSAGE_TYPES.ADD_URL_CHANGE_LISTENERS
              });
              break;
            case EXTENSION_MESSAGE_TYPES.CHECK_PROCESSING_MESSAGE:
              content = await chrome.tabs.sendMessage(currentTab.id, {
                type: EXTENSION_MESSAGE_TYPES.CHECK_PROCESSING_MESSAGE
              });
              break;
            case EXTENSION_MESSAGE_TYPES.REFRESH_OF_PAGE:
              content = await chrome.tabs.sendMessage(currentTab.id, {
                type: EXTENSION_MESSAGE_TYPES.REFRESH_OF_PAGE
              });
              break;
            default:
              throw new Error("Unsupported message type");
          }
          res.send({
            success: true,
            data: content
          });
        } catch (sendMessageError) {
          console.log("Error sending message to tab:", sendMessageError);
          refreshPage(currentTab?.id || 0);
          res.send({
            success: false,
            data: "Error sending message to tab, page refreshed"
          });
        }
      }
    );
  } catch (err) {
    console.log(err);
    res.send({
      success: false,
      data: []
    });
  }
};
export default handler;
