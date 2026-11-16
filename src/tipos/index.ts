export interface Coordenadas {
  latitud: number;
  longitud: number;
}
//  Espacio Deportivo
export interface Espacio {
  id: string;
  nombre: string; 
  deporteId: string; 
  complejo: string; 
  superficie: string;
  techado: boolean;
  iluminacion: boolean;
  capacidad: number;
  precioPorHora: number;
  coordenadas: Coordenadas;
  imagenes: string[];
  videoUrl: string | null; // null si no tiene video de recorrido
  reglas: string;
  activo: boolean;
}

export interface Deporte {
  id: string; 
  nombre: string;
  icono: string; // Nombre del ícono 
  color: string;
}

export type EstadoTurno = 'libre' | 'reservado' | 'fijo' | 'mantenimiento';

export interface Turno {
  id: string; 
  espacioId: string; 
  fecha: string; // Formato "AAAA-MM-DD" (ISO sin hora)
  inicio: string; // "19:00"
  fin: string; // "20:00"
  estado: EstadoTurno;
  reservaId: string | null;
  motivoBloqueo: string | null; 
  precio: number;
  titularFijo?: string | null; // Nombre del grupo si es reserva fija
  esPasado?: boolean; // Para deshabilitar turnos de horas ya transcurridas
}

export type EstadoReserva = 'confirmada' | 'cancelada' | 'cumplida' | 'ausente';

export interface Reserva {
  id: string; 
  turnoId: string;
  espacioId: string;
  usuarioId: string;
  cantidadPersonas: number;
  codigoQr: string; // "VGY-1180-0219-19"
  estado: EstadoReserva;
  ingresoEn: string | null; 
  creadaEn: string; // ISO 8601 con zona horaria
  cancelableHasta: string; // ISO 8601 (hasta 4 horas antes del turno)
}

export interface ReservaFija {
  id: string; 
  espacioId: string;
  titular: string; 
  dia: 0 | 1 | 2 | 3 | 4 | 5 | 6; 
  inicio: string; 
  fin: string;
  desde: string;
  hasta: string | null; 
  activa: boolean;
}

export type Rol = 'jugador' | 'encargado' | 'administrador';

export interface Usuario {
  id: string; 
  nombre: string; 
  email: string;
  telefono: string;
  rol: Rol;
  espaciosFavoritos: string[];
  cancelacionesTardias: number;
  ausencias: number;
}

export interface ApiResponse<T> {
  datos: T;
  meta?: {
    total: number;
    pagina: number;
    porPagina: number;
  };
}
export interface ApiError {
  error: {
    codigo: string;
    mensaje: string;
  };
}