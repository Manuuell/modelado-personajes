import { crearAstronauta } from './astronauta.ts';
import { crearBaliza } from './baliza.ts';
import { crearNave } from './nave.ts';
import { crearRecolector } from './recolector.ts';
import type { Modelo } from './kit.ts';

export type { Animacion, Modelo } from './kit.ts';

/**
 * Todos los personajes modelados, en el orden del visor. `tipo` fija el
 * presupuesto de triángulos (ver test/modelos.test.ts): la horda sale a
 * cientos y se dibuja a detalle 0,45; jugador, jefes y escena (la nave de la
 * cinemática), de uno en uno.
 */
export const CATALOGO: { id: string; nombre: string; tipo?: 'jugador' | 'horda' | 'jefe' | 'escena'; crear: () => Modelo }[] = [
  { id: 'astronauta', nombre: 'Especialista de ARES-IX', tipo: 'jugador', crear: crearAstronauta },
  { id: 'recolector', nombre: 'Recolector', tipo: 'horda', crear: crearRecolector },
  { id: 'baliza', nombre: 'Baliza', tipo: 'horda', crear: crearBaliza },
  { id: 'nave', nombre: 'Nave de ARES-IX', tipo: 'escena', crear: crearNave },
];
