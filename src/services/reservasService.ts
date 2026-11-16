import { Reserva, Turno } from "../tipos";
import { apiFetch } from "./api";

export interface RespuestaTurnos {
    datos: Turno[];
    meta: {
        total: number;
        pagina: number;
        porPagina: number;
    };
}
export const reservasService = {

    async getTurnos(espacioId: string, fecha: string): Promise<Turno[]> {
        const res = await apiFetch<RespuestaTurnos>(`/espacios/${espacioId}/turnos?fecha=${fecha}`);
        return res.datos;
    },
    
    async crearReserva(turnoId: string, cantidadPersonas: number = 10): Promise<Reserva> {
        return await apiFetch<Reserva>(`/reservas`, {
            method: 'POST',
            body: JSON.stringify({ turnoId, cantidadPersonas, }),
        });
    },

    async getMisReservas(cuando: 'proximas' | 'pasadas' = 'proximas'): Promise<Reserva[]> {
        const res = await apiFetch<{ datos: Reserva[] }>(`/yo/reservas?cuando=${cuando}`);
        return res.datos;
    },

    async cancelarReserva(reservaId: string, motivo?: string): Promise<void> {
        await apiFetch<void>(`/reservas/${reservaId}/cancelacion`, {
            method: 'POST',
            body: JSON.stringify({  }),
        });
    }
}
