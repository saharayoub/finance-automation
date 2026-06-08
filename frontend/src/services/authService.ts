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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
  sessionStorage.removeItem('test_auth_token');
  sessionStorage.removeItem('test_user');
  if (!msalInstance) return;
  try {
    await msalInstance.logoutPopup();
  } catch {
    // ignore
  }
}

/* ─── TEST ACCOUNT LOGIN ─── */

export async function loginWithTestAccount(email: string, password: string): Promise<{
  access_token: string;
  user: { email: string; role: string; name: string; companies: string[] };
}> {
  const response = await fetch(`${API_URL}/api/auth/login-test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Identifiants incorrects');
  }
  const data = await response.json();
  sessionStorage.setItem('test_auth_token', data.access_token);
  sessionStorage.setItem('test_user', JSON.stringify(data.user));
  return data;
}

export function getTestUser(): { email: string; role: string; name: string; companies: string[] } | null {
  try {
    const raw = sessionStorage.getItem('test_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default msalInstance;
