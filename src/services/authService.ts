import { apiFetch, setAuthToken, removeAuthToken } from './api';
import { Usuario } from '../tipos';

export interface SesionResponse {
  token: string;
  usuario: Usuario;
}

export const authService = {
  /**
   * Ingreso a la aplicación con email y contraseña.
   * Endpoint según README de la API: POST /auth/ingreso
   */
  async login(email: string, contrasena: string): Promise<SesionResponse> {
    const sesion = await apiFetch<SesionResponse>('/auth/ingreso', {
      method: 'POST',
      body: JSON.stringify({ email, contrasena }),
    });

    // Guardamos el token en SecureStore inmediatamente tras el éxito
    if (sesion?.token) {
      await setAuthToken(sesion.token);
    }

    return sesion;
  },

  /**
   * Registro de un nuevo usuario jugador.
   * Endpoint: POST /auth/registro
   */
  async registro(datos: {
    nombre: string;
    email: string;
    contrasena: string;
    telefono: string;
  }): Promise<SesionResponse> {
    const sesion = await apiFetch<SesionResponse>('/auth/registro', {
      method: 'POST',
      body: JSON.stringify(datos),
    });

    if (sesion?.token) {
      await setAuthToken(sesion.token);
    }

    return sesion;
  },

  /**
   * Cierre de sesión: elimina el token seguro.
   */
  async logout(): Promise<void> {
    await removeAuthToken();
  },

  /**
   * Obtener los datos del usuario autenticado actualmente.
   * Endpoint: GET /yo
   */
  async getPerfil(): Promise<Usuario> {
    return apiFetch<Usuario>('/yo');
  },
};
