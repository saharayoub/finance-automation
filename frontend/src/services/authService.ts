import { PublicClientApplication, AccountInfo } from '@azure/msal-browser';
import { msalConfig, loginRequest } from '../config/msalConfig';

let msalInstance: PublicClientApplication | null = null;

try {
  if (msalConfig.auth.clientId) {
    msalInstance = new PublicClientApplication(msalConfig);
  }
} catch {
  msalInstance = null;
}

export async function getAccessToken(): Promise<string | null> {
  if (!msalInstance) return null;
  try {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length === 0) return null;
    const response = await msalInstance.acquireTokenSilent({
      ...loginRequest,
      account: accounts[0],
    });
    return response.accessToken;
  } catch {
    return null;
  }
}

export function getCurrentUser(): AccountInfo | null {
  if (!msalInstance) return null;
  const accounts = msalInstance.getAllAccounts();
  return accounts.length > 0 ? accounts[0] : null;
}

export async function logout(): Promise<void> {
  if (!msalInstance) return;
  try {
    await msalInstance.logoutPopup();
  } catch {
    // ignore
  }
}

export default msalInstance;
