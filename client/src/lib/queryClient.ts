import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { auth } from "./firebase";

async function getAuthHeaders(): Promise<HeadersInit> {
  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      const idToken = await currentUser.getIdToken();
      return {
        'Authorization': `Bearer ${idToken}`,
      };
    } catch (error) {
      console.warn('Failed to get auth token:', error);
    }
  }
  return {};
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(url: string, options?: RequestInit): Promise<any> {
  const authHeaders = await getAuthHeaders();
  
  const res = await fetch(url, {
    credentials: "include",
    ...options,
    headers: {
      ...authHeaders,
      ...options?.headers,
    },
  });

  await throwIfResNotOk(res);
  return await res.json();
}

export async function apiRequestRaw(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const authHeaders = await getAuthHeaders();
  
  const res = await fetch(url, {
    method,
    headers: {
      ...authHeaders,
      ...(data ? { "Content-Type": "application/json" } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const authHeaders = await getAuthHeaders();
    
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      headers: authHeaders,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
