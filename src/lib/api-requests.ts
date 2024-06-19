import type { FilteredUser, UserLoginResponse, UserResponse } from "./types";

const SERVER_ENDPOINT =
  process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000";
const NEXT_PUBLIC_API_MINHA_BASE =
  process.env.NEXT_PUBLIC_API_MINHA_BASE || "http://localhost:3331";

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("Content-Type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    if (isJson && data.errors !== null) {
      throw new Error(JSON.stringify(data.errors));
    }

    throw new Error(data.message || response.statusText);
  }

  return data as T;
}

export async function apiRegisterUser(
  credentials: string,
): Promise<FilteredUser> {
  const response = await fetch(`${SERVER_ENDPOINT}/api/auth/register`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: credentials,
  });

  return handleResponse<UserResponse>(response).then((data) => data.data.user);
}

export async function apiLoginUser(credentials: string): Promise<string> {
  const response = await fetch(`${SERVER_ENDPOINT}/api/usuario/autenticacao`, {
    //const response = await fetch("/api/usuario/autenticacao", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: credentials,
  });

  return handleResponse<UserLoginResponse>(response).then((data) => data.token);
}

export async function apiLogoutUser(): Promise<void> {
  const response = await fetch(`${SERVER_ENDPOINT}/api/usuario/logout`, {
    // const response = await fetch("/api/usuario/logout", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: "",
  });

  return handleResponse<void>(response);
}

export async function apiGetAuthUser(token?: string): Promise<FilteredUser> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  /*   console.log('apiGetAuthUser') */
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  /*   console.log(token)
  console.log(`chama api/users/me`) */
  const response = await fetch(`${SERVER_ENDPOINT}/api/users/me`, {
    method: "GET",
    credentials: "include",
    headers,
  });

  return handleResponse<UserResponse>(response).then((data) => data.data.user);
}

export async function apiExterna(
  tipo: string,
  caminho: string,
  body: string,
  token: string,
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(NEXT_PUBLIC_API_MINHA_BASE + caminho, {
    method: tipo,
    credentials: "include",
    headers,
  });

  return response;
}
