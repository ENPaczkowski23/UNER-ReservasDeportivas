import * as SecureStore from 'expo-secure-store';

export const API_BASE_URL = 'http://192.168.1.5:3000';

const TOKEN_KEY = 'auth_token';

export async function getAuthToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Error al leer el token de SecureStore:', error);
    return null;
  }
}

export async function setAuthToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (error) {
    console.error('Error al guardar el token en SecureStore:', error);
  }
}

export async function removeAuthToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Error al eliminar el token de SecureStore:', error);
  }
}

interface RequestOptions extends RequestInit {
  token?: string | null;
}

/**
 * Cliente HTTP centralizado.
 * Desempaqueta la respuesta de la API:
 * - Si es lista: { datos: [...], meta: {...} } -> retorna { datos, meta }
 * - Si es recurso único: { datos: {...}, meta: null } -> retorna datos
 * - Si es error: { error: { codigo, mensaje } } -> lanza Error(mensaje)
 */
export async function apiFetch<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, ...customConfig } = options;

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Si no se pasó un token explícito, intentamos leer el que está guardado
  const authToken = token !== undefined ? token : await getAuthToken();
  if (authToken) {
    defaultHeaders['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      ...defaultHeaders,
      ...headers,
    },
    ...customConfig,
  });

  // Si la respuesta es 204 No Content (ej: en DELETE)
  if (response.status === 204) {
    return null as T;
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    // La cátedra define que los errores vienen como: { error: { codigo, mensaje } }
    const mensaje = body?.error?.mensaje || body?.message || `Error del servidor (${response.status})`;
    throw new Error(mensaje);
  }

  // Si la respuesta trae meta, devolvemos todo el objeto { datos, meta }
  if (body && 'meta' in body && body.meta !== null) {
    return body as T;
  }

  // Si es un recurso único envuelto en { datos: {...} }
  if (body && 'datos' in body) {
    return body.datos as T;
  }

  return body as T;
}
