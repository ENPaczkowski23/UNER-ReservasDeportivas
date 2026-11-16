import { Espacio } from '../tipos';
import { apiFetch } from './api';

export interface RespuestaEspacios {
    datos: Espacio[];
    meta: {
        total: number;
        pagina: number;
        porPagina: number;
    };
}

export const espaciosService = {

    async getEspacios(): Promise<Espacio[]> {
        const respuesta = await apiFetch<RespuestaEspacios>('/espacios');
        return respuesta.datos;
    },

    async getEspacioPorId(id: string): Promise<Espacio> {
        return await apiFetch<Espacio>(`/espacios/${id}`);
    }
};