import type { PlasmoMessaging } from "../../../plasmohq/messaging";

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];
    if (!currentTab) {
      console.log("No active tab found");
      res.send({
        success: false,
        data: "No active tab foundactive-tab-url"
      });
      res.send({
        success: false,
        data: null
      });
    }
    res.send({ success: true, data: currentTab.url });
  } catch (err) {
    console.log("## Error while getting active tab url");
    console.log({ err });
    res.send({
      success: false,
      data: null
    });
  }
};

export default handler;
