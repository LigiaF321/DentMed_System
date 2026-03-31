export const getAuthToken = () => {
  const rawToken = localStorage.getItem("token");

  if (!rawToken || rawToken === "undefined" || rawToken === "null") {
    return null;
  }

  try {
    const parsed = JSON.parse(rawToken);

    if (typeof parsed === "string") {
      return parsed;
    }

    if (parsed?.token && typeof parsed.token === "string") {
      return parsed.token;
    }
  } catch (error) {
    // No era JSON
  }

  return rawToken;
};

export const setAuthToken = (token) => {
  if (!token || typeof token !== "string") return;
  localStorage.setItem("token", token);
};

export const clearAuthToken = () => {
  localStorage.removeItem("token");
};