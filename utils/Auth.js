import { getUserDetail } from "./Device";

export const getAuthToken = async () => {
  const storedCredentials = sessionStorage.getItem('credentials');
  if (storedCredentials) {
    const creds = JSON.parse(storedCredentials);
    if (!creds.exp || creds.exp < Date.now()) {
      sessionStorage.removeItem('credentials');
    } else {
      return creds.token;
    }
  }

  const user = getUserDetail();
  const response = await fetch(`/api/getToken?user=${user.deviceId}`);
  const data = await response.json();
  sessionStorage.setItem('credentials', JSON.stringify(data));
  return data.token;
};