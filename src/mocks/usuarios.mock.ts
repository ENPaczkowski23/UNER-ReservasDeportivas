import { Usuario } from "../tipos";

export const USUARIOS_MOCK: Usuario[] = [
  {
    id: 'usr-207',
    nombre: 'Emiliano Ruiz',
    email: 'emiliano@mail.com',
    telefono: '3455-401122',
    rol: 'jugador',
    espaciosFavoritos: ['esp-02'],
    cancelacionesTardias: 1,
    ausencias: 0,
  },
  {
    id: 'usr-marcelo',
    nombre: 'Marcelo (Encargado)',
    email: 'marcelo@villaguay.gob.ar',
    telefono: '3455-442211',
    rol: 'encargado',
    espaciosFavoritos: [],
    cancelacionesTardias: 0,
    ausencias: 0,
  },
  {
    id: 'usr-admin',
    nombre: 'Nahuel Ojeda (Director)',
    email: 'deportes@villaguay.gob.ar',
    telefono: '3455-414141',
    rol: 'administrador',
    espaciosFavoritos: [],
    cancelacionesTardias: 0,
    ausencias: 0,
  },
];