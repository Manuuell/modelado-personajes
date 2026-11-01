import type { Tarjeta } from './mejoras.ts';

// Tarjetas de muestra para los talleres (mejoras.html y mapa.html?mejoras).

/** Muestras con los textos de data.ts y creator/stats.ts del juego. */
export const MUESTRA: Tarjeta[] = [
  { id: 'interferencia', tipo: 'herramienta', titulo: 'Campo de interferencia', texto: 'Ruido de radio a máxima potencia. Frena y desgasta a lo que entra.', color: '#d07bff', nivel: 1, nivelMax: 6 },
  { id: 'cortador', tipo: 'herramienta', titulo: 'Cortador de plasma', texto: 'daño 14 → 18 · disparos 2 → 3', color: '#ffb347', nivel: 4, nivelMax: 6 },
  { id: 'iman', tipo: 'pasiva', titulo: 'Electroimán', texto: '+35 % radio para recoger chatarra.', color: '#9fb4ff', nivel: 2, nivelMax: 5 },
  { id: 'mochila', tipo: 'equipo', titulo: 'Mochila cohete', texto: 'Dos depósitos de plasma a los lados de ADA. Vuela por encima de la horda: arriba no te tocan.', control: 'Mantén Espacio en el aire', color: '#ff8a3d', nivel: 1, nivelMax: 3 },
];

export const OTRAS: Tarjeta[] = [
  { id: 'nova-plasma', tipo: 'especial', titulo: 'Nova de plasma', texto: 'Al recibir un golpe, explotas en plasma que quema a lo cercano.', color: '#56e5ee', nivel: 2 },
  { id: 'blindaje', tipo: 'pasiva', titulo: 'Placas de blindaje', texto: '+20 de integridad máxima y la restaura.', color: '#9fb4ff', nivel: 5, nivelMax: 5 },
  { id: 'parche', tipo: 'reparar', titulo: 'Parche de emergencia', texto: 'Restaura 40 de integridad del traje.', color: '#7ef0a0' },
];
