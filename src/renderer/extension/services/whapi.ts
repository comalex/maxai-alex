import { sentry } from "~sentryHelper";

type Participant = {
  id: string;
  rank: "creator" | "member";
};

type GroupResponse = {
  group_id: string;
  id: string;
  name: string;
  type: "group";
  timestamp: number;
  participants: Participant[];
  name_at: number;
  created_at: number;
  created_by: string;
};

const createGroup = async (): Promise<
  GroupResponse | { success: false; error: string }
> => {
  const url = "https://gate.whapi.cloud/groups";
  const headers = {
    accept: "application/json",
    authorization: `Bearer jdTEdakxYoqEz2CoHUcL1pys5D73syOJ`,
    "content-type": "application/json"
  };
  const data = {
    participants: ["380993427633"],
    subject: "Technical Support (for extension-related issues)"
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    sentry.captureException(error);
    console.error("Failed to create group:", error);
    return { success: false, error: error.message };
  }
};
// https://whapi.readme.io/reference/acceptgroupinvite
