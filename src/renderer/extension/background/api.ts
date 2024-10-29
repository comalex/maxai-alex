import { API_URL } from "../config/constants";
import type { Model } from "../config/types";

export function getURL(path = "") {
  return `${API_URL}${path}`;
}

type ApiResponse = {
  status: string;
  models: Model[];
};

export async function login(
  email: string,
  password: string,
  extVersion: number | null
): Promise<any> {
  try {
    const json_data = {
      email: email,
      password: password,
      credentials: "email",
      ext_version: extVersion
    };
    const headers = {
      "Content-Type": "application/json"
    };

    const response = await fetch(getURL("/v1/api/login"), {
      method: "POST",
      headers: headers,
      body: JSON.stringify(json_data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (result.status !== "success") {
      throw new Error(`API error! status: ${result.status}`);
    }
    // Save email to local store
    try {
      await localStorage.setItem('userEmail', email);
      console.log("Email saved to local storage.");
    } catch (storageError) {
      console.error("Error saving email to local storage:", storageError);
    }
    return result;
  } catch (error) {
    console.error("Error fetching list of models:", error);
    return [];
  }
}

export async function getListOfModels(jwt: string): Promise<Model[]> {
  try {
    const response = await fetch(getURL("/v1/api/models"), {
      method: "GET",
      headers: {
        "Content-type": "application/json",
        Authorization: `Bearer ${jwt}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse = await response.json();
    if (result.status !== "success") {
      throw new Error(`API error! status: ${result.status}`);
    }

    return result.models;
  } catch (error) {
    console.error("Error fetching list of models:", error);
    return [];
  }
}
