import { ICONOS } from './iconos.ts';
import { mostrarMejoras } from './mejoras.ts';
import { MUESTRA, OTRAS } from './mejoras-muestra.ts';

// Taller de mejoras (solo desarrollo, /mejoras.html): todos los iconos y la
// subida de nivel con tarjetas de muestra (los textos y colores del juego).
//
//   ?vista=tarjetas (por defecto) · ?vista=otras (otro reparto) · ?vista=iconos
//
// Clic en el fondo o R: vuelve a repartir. Al acabar de entrar, el título
// pasa a «listo».

/** Nombre y color de cada icono para la hoja. */
const FICHAS: Record<string, [string, string]> = {
  cortador: ['Cortador de plasma', '#ffb347'], pulso: ['Pulso EMP de ADA', '#5ee0ff'], dron: ['Dron de mantenimiento', '#c9f27a'],
  interferencia: ['Campo de interferencia', '#d07bff'],
  velocidad: ['Servos de pierna', '#9fb4ff'], iman: ['Electroimán', '#9fb4ff'], blindaje: ['Placas de blindaje', '#9fb4ff'],
  enfriamiento: ['Disipador térmico', '#9fb4ff'], area: ['Amplificador de ADA', '#9fb4ff'], reparacion: ['Nanosellador', '#9fb4ff'],
  mochila: ['Mochila cohete', '#ff8a3d'], tabla: ['Aerotabla', '#5ee0ff'], botas: ['Botas de impulso', '#ffd25a'],
  'nova-plasma': ['Nova de plasma', '#56e5ee'], 'pulso-ada': ['Pulso de ADA', '#56e5ee'], enjambre: ['Enjambre reparador', '#56e5ee'],
  caparazon: ['Caparazón de chatarra', '#56e5ee'], sobremarcha: ['Sobremarcha', '#56e5ee'], 'eco-helios': ['Eco de HELIOS', '#56e5ee'],
  parche: ['Parche de emergencia', '#7ef0a0'], generico: ['(sin icono)', '#ffd25a'],
};

const params = new URLSearchParams(location.search);
const vista = params.get('vista') ?? 'tarjetas';
const ui = document.getElementById('ui')!;

if (vista === 'iconos') {
  const hoja = document.createElement('div');
  hoja.className = 'hoja';
  for (const [id, svg] of Object.entries(ICONOS)) {
    const [nombre, color] = FICHAS[id] ?? [id, '#ffd25a'];
    const f = document.createElement('figure');
    f.style.setProperty('--c', color);
    f.innerHTML = `<div class="losa">${svg}</div><figcaption></figcaption>`;
    f.querySelector('figcaption')!.textContent = nombre;
    hoja.appendChild(f);
  }
  ui.appendChild(hoja);
  document.title += ' · listo';
} else {
  const tarjetas = vista === 'otras' ? OTRAS : MUESTRA;
  let quitar = () => {};
  const repartir = () => {
    quitar();
    quitar = mostrarMejoras(vista === 'otras' ? 12 : 8, tarjetas, (i) => {
      const aviso = document.getElementById('aviso')!;
      aviso.textContent = `Elegida: ${tarjetas[i].titulo} · clic o R para repartir otra vez`;
      quitar = () => {};
    });
    window.setTimeout(() => { if (!document.title.includes('listo')) document.title += ' · listo'; }, 1600);
  };
  repartir();
  window.addEventListener('keydown', (e) => { if (e.key === 'r' || e.key === 'R') repartir(); });
  document.getElementById('fondo')!.addEventListener('click', repartir);
}
