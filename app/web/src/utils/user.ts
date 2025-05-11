import axios from "axios";
import { APP_STAGE, BACKEND_USER_API } from "./common";
import { HelperFunctionResponse } from "@/constants/common";

export const handleGetUserSubscription = async (
  auth: AuthContextType | undefined
): Promise<number> => {
  if (!auth) {
    return 0;
  }

  try {
    const { data, status } = await axios.get(
      `${BACKEND_USER_API}/${APP_STAGE}/users`,
      {
        headers: {
          "Content-Type": "application/json",
          "x-refresh-token": auth?.authState.refreshToken,
          Authorization: `Bearer ${auth?.authState.token}`,
        },
      }
    );

    if (status !== 200) {
      return 0;
    }

    return data.users.subscription;
  } catch (error) {
    return 0;
  }
};

export const handlePatchUserSubscription = async (
  auth: AuthContextType | undefined,
  subscription: number
): Promise<HelperFunctionResponse> => {
  if (!auth) {
    return HelperFunctionResponse.ERROR;
  }

  try {
    const { status } = await axios.patch(
      `${BACKEND_USER_API}/${APP_STAGE}/users`,
      { subscription },
      {
        headers: {
          "Content-Type": "application/json",
          "x-refresh-token": auth?.authState.refreshToken,
          Authorization: `Bearer ${auth?.authState.token}`,
        },
      }
    );

    if (status !== 200) {
      return HelperFunctionResponse.ERROR;
    }

    return HelperFunctionResponse.SUCCESS;
  } catch (error) {
    return HelperFunctionResponse.ERROR;
  }
};
