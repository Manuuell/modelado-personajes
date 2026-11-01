import { crearAstronauta } from './astronauta.ts';
import { crearAvispa } from './avispa.ts';
import { crearBaliza } from './baliza.ts';
import { crearCaparazon } from './caparazon.ts';
import { crearRecolector } from './recolector.ts';
import { crearSaltador } from './saltador.ts';
import { crearSegador } from './segador.ts';
import { crearSembrador } from './sembrador.ts';
import type { Modelo } from './kit.ts';

export type { Animacion, Modelo } from './kit.ts';

/**
 * Todos los personajes modelados, en el orden del visor. `tipo` fija el
 * presupuesto de triángulos (ver test/modelos.test.ts): la horda sale a
 * cientos y se dibuja a detalle 0,45; jugador y jefes, de uno en uno.
 */
export const CATALOGO: { id: string; nombre: string; tipo?: 'jugador' | 'horda' | 'jefe'; crear: () => Modelo }[] = [
  { id: 'astronauta', nombre: 'Especialista de ARES-IX', tipo: 'jugador', crear: crearAstronauta },
  { id: 'recolector', nombre: 'Recolector', tipo: 'horda', crear: crearRecolector },
  { id: 'baliza', nombre: 'Baliza', tipo: 'horda', crear: crearBaliza },
  { id: 'segador', nombre: 'Segador', tipo: 'horda', crear: crearSegador },
  { id: 'saltador', nombre: 'Saltador', tipo: 'horda', crear: crearSaltador },
  { id: 'avispa', nombre: 'Avispa', tipo: 'horda', crear: crearAvispa },
  { id: 'caparazon', nombre: 'Caparazón', tipo: 'horda', crear: crearCaparazon },
  { id: 'sembrador', nombre: 'Sembrador', tipo: 'horda', crear: crearSembrador },
];
