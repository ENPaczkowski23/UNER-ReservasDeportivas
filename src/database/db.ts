import * as SQLite from 'expo-sqlite';
import { Reserva } from '../tipos';

const DB_LOCAL = 'reservas_deportivas.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;

async function getDB(): Promise<SQLite.SQLiteDatabase> {
    if (!dbInstance) {
        dbInstance = await SQLite.openDatabaseAsync(DB_LOCAL);

        await dbInstance.execAsync(
            `CREATE TABLE IF NOT EXISTS reservas_locales (
                id TEXT PRIMARY KEY NOT NULL,
                turnoId TEXT NOT NULL,
                espacioId TEXT NOT NULL,
                usuarioId TEXT NOT NULL,
                cantidadPersonas INTEGER NOT NULL,
                codigoQr TEXT NOT NULL,
                estado TEXT NOT NULL,
                ingresoEn TEXT,
                creadaEn TEXT NOT NULL,
                cancelableHasta TEXT NOT NULL,
                momento TEXT NOT NULL -- 'proximas' o 'pasadas'
            );`
        );
    }
    return dbInstance;
    
}

export const localDB = {

    async guardarReservas(reservas: Reserva[], momento: 'proximas' | 'pasadas'): Promise<void> {
        try {
            const db = await getDB();

            await db.withTransactionAsync(async () => {
                await db.runAsync('DELETE FROM reservas_locales WHERE momento = ?', [momento]);

                for (const r of reservas) {
                    await db.runAsync(
                        `INSERT OR REPLACE INTO reservas_locales 
                            (id, turnoId, espacioId, usuarioId, cantidadPersonas, codigoQr, estado, ingresoEn, creadaEn, cancelableHasta, momento)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                            r.id,
                            r.turnoId,
                            r.espacioId,
                            r.usuarioId,
                            r.cantidadPersonas,
                            r.codigoQr,
                            r.estado,
                            r.ingresoEn,
                            r.creadaEn,
                            r.cancelableHasta,
                            momento,
                            ]
                    );
                }
            });
        } catch (error) {
            console.error('Error al guardar reservas en SQLite:', error);
        }
    },

    async obtenerReservas(momento: 'proximas' | 'pasadas'): Promise<Reserva[]> {
        try {
            const db = await getDB();
            const rows = await db.getAllAsync<any>(
                'SELECT * FROM reservas_locales WHERE momento = ? ORDER BY creadaEn DESC',
                [momento]
            );

            return rows.map((row) => ({
                id: row.id,
                turnoId: row.turnoId,
                espacioId: row.espacioId,
                usuarioId: row.usuarioId,
                cantidadPersonas: row.cantidadPersonas,
                codigoQr: row.codigoQr,
                estado: row.estado,
                ingresoEn: row.ingresoEn,
                creadaEn: row.creadaEn,
                cancelableHasta: row.cancelableHasta,
            }));
        } catch (error) {
            console.error('Error al leer reservas de SQLite:', error);
            return [];
        }
    },
}