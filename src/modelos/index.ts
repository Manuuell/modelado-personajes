import { crearAltarDesafio } from './altar-desafio.ts';
import { crearAltarJefe } from './altar-jefe.ts';
import { crearAstronauta } from './astronauta.ts';
import { crearAvispa } from './avispa.ts';
import { crearBaliza } from './baliza.ts';
import { crearCaja } from './caja-premio.ts';
import { crearCaparazon } from './caparazon.ts';
import { crearHeraldo } from './heraldo.ts';
import { crearNave, crearNavePosada } from './nave.ts';
import { crearNpcBotanica } from './npc-botanica.ts';
import { crearNpcChatarrero } from './npc-chatarrero.ts';
import { crearNpcMecanica } from './npc-mecanica.ts';
import { crearNpcVigia } from './npc-vigia.ts';
import { crearOjoHelios } from './ojo-helios.ts';
import { crearRecolector } from './recolector.ts';
import { crearRefugio } from './refugio.ts';
import { crearSaltador } from './saltador.ts';
import { crearSegador } from './segador.ts';
import { crearSegadorJefe } from './segador-jefe.ts';
import { crearSembrador } from './sembrador.ts';
import { crearTorreVelo } from './torre-velo.ts';
import type { Modelo } from './kit.ts';

export type { Animacion, Modelo } from './kit.ts';

/**
 * Todo lo modelado, en el orden del visor. `tipo` fija el presupuesto de
 * triángulos (ver test/modelos.test.ts): la horda sale a cientos y se dibuja
 * a detalle 0,45; jugador, jefes, NPC, piezas del mapa y la nave de la
 * cinemática (escena), de uno en uno; los objetos (cajas de premio) pueden ser
 * docenas y van más justos.
 */
export type Tipo = 'jugador' | 'horda' | 'jefe' | 'npc' | 'mapa' | 'objeto' | 'escena';

export const CATALOGO: { id: string; nombre: string; tipo?: Tipo; crear: () => Modelo }[] = [
  { id: 'astronauta', nombre: 'Especialista de ARES-IX', tipo: 'jugador', crear: crearAstronauta },
  { id: 'recolector', nombre: 'Recolector', tipo: 'horda', crear: crearRecolector },
  { id: 'baliza', nombre: 'Baliza', tipo: 'horda', crear: crearBaliza },
  { id: 'segador', nombre: 'Segador', tipo: 'horda', crear: crearSegador },
  { id: 'saltador', nombre: 'Saltador', tipo: 'horda', crear: crearSaltador },
  { id: 'avispa', nombre: 'Avispa', tipo: 'horda', crear: crearAvispa },
  { id: 'caparazon', nombre: 'Caparazón', tipo: 'horda', crear: crearCaparazon },
  { id: 'sembrador', nombre: 'Sembrador', tipo: 'horda', crear: crearSembrador },
  { id: 'segador-jefe', nombre: 'Segador, Jefe de Cosecha', tipo: 'jefe', crear: crearSegadorJefe },
  { id: 'heraldo', nombre: 'Heraldo del Velo', tipo: 'jefe', crear: crearHeraldo },
  { id: 'ojo-helios', nombre: 'Ojo de HELIOS', tipo: 'jefe', crear: crearOjoHelios },
  { id: 'npc-mecanica', nombre: 'Iris, la mecánica', tipo: 'npc', crear: crearNpcMecanica },
  { id: 'npc-vigia', nombre: 'Tali, la vigía', tipo: 'npc', crear: crearNpcVigia },
  { id: 'npc-botanica', nombre: 'Lis, la botánica', tipo: 'npc', crear: crearNpcBotanica },
  { id: 'npc-chatarrero', nombre: 'Bruno, el chatarrero', tipo: 'npc', crear: crearNpcChatarrero },
  { id: 'altar-cosecha', nombre: 'Altar de la Cosecha', tipo: 'mapa', crear: () => crearAltarJefe('cosecha') },
  { id: 'altar-heraldo', nombre: 'Altar del Velo', tipo: 'mapa', crear: () => crearAltarJefe('heraldo') },
  { id: 'altar-ojo', nombre: 'Altar del Ojo', tipo: 'mapa', crear: () => crearAltarJefe('ojo') },
  { id: 'altar-desafio', nombre: 'Ara del Sol', tipo: 'mapa', crear: crearAltarDesafio },
  { id: 'caja-suministros', nombre: 'Caja de suministros', tipo: 'objeto', crear: () => crearCaja('suministros') },
  { id: 'caja-helios', nombre: 'Cofre de HELIOS', tipo: 'objeto', crear: () => crearCaja('helios') },
  { id: 'caja-reliquia', nombre: 'Cofre de reliquia', tipo: 'objeto', crear: () => crearCaja('reliquia') },
  { id: 'torre-velo', nombre: 'Torre del Velo', tipo: 'mapa', crear: crearTorreVelo },
  { id: 'refugio', nombre: 'Refugio', tipo: 'mapa', crear: crearRefugio },
  { id: 'nave', nombre: 'Nave de ARES-IX', tipo: 'escena', crear: crearNave },
  { id: 'nave-posada', nombre: 'Nave de ARES-IX (posada)', tipo: 'mapa', crear: crearNavePosada },
];
