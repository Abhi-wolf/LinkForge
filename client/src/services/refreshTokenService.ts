import axios from "axios";

export const refreshTokenFunc = async (refreshToken: string) => {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_BASE_URL}/trpc/auth.refreshToken`,
      {
        refreshToken,
      },
      {
        withCredentials: true,
      },
    );

    return {
      refreshToken: response.data.result.data.refreshToken,
      success: true,
    };
  } catch (error) {
    console.log("REFRESH TOKEN ERROR = ", error);
    return {
      refreshToken: null,
      success: false,
    };
  }
};
