import * as THREE from 'three';
import { CATALOGO } from '../modelos/index.ts';
import type { Modelo } from '../modelos/kit.ts';
import { World } from './mundo.ts';
import { COLOCACION, NPCS } from '../contenido/mapa.ts';
import { decir, drawMinimap, setMision, showHud, updateHud, type MinimapState } from './hud.ts';
import { mostrarMejoras } from './mejoras.ts';
import { MUESTRA } from './mejoras-muestra.ts';

// Taller del mapa (solo desarrollo, /mapa.html): el mundo nuevo con el
// astronauta, el contenido del mapa colocado y algo de horda, para pasearlo
// y sacar capturas.
//
//   WASD o flechas: andar · arrastrar: girar · rueda: acercar
//   ?vista=jugador|salida|aerea|acido|vadeo|montana|ruinas|refugio|nave → encuadres fijos
//   ?vista=carta                                        → la carta del minimapa
//   &hud=0                                              → sin interfaz
//   &mejoras                                            → con la subida de nivel encima
//
// Cuando ya se ha pintado unos fotogramas, el título pasa a «listo».

const params = new URLSearchParams(location.search);
const lienzo = document.getElementById('lienzo') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const escena = new THREE.Scene();
const camara = new THREE.PerspectiveCamera(60, 1, 0.3, 1600);
const mundo = new World(escena, { arena: 130 });
// Lo que cuesta el mundo solo (sin contenido ni personajes): con --dump-dom
// sale en <body data-mundo>.
{
  let mallas = 0, tris = 0;
  escena.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const g = o.geometry as THREE.BufferGeometry;
    const n = (g.index ? g.index.count : g.attributes.position.count) / 3 * (o instanceof THREE.InstancedMesh ? o.count : 1);
    mallas++;
    tris += n;
  });
  document.body.dataset.mundo = `${mallas} mallas · ${Math.round(tris)} triángulos`;
}
// Desde arriba se quiere ver el mapa entero: sin niebla.
if (params.get('vista') === 'aerea') escena.fog = null;

let semilla = 7;
const rand = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);

// ------------------------------------------------------------ contenido

const mezcladores: THREE.AnimationMixer[] = [];
// Lo colocado, para el minimapa y el aviso de hablar.
type Marca = NonNullable<MinimapState['lugares']>[number]['tipo'];
const tipoDe = (id: string): Marca | null =>
  id === 'altar-desafio' ? 'ara' : id.startsWith('altar-') ? 'altar' : id.startsWith('caja-') ? 'caja'
    : id === 'torre-velo' ? 'torre' : id === 'refugio' ? 'refugio' : id.startsWith('npc-') ? 'npc' : null;
const colocado: { id: string; tipo: Marca; x: number; z: number }[] = [];
// Enemigos, con el índice de tipo que usa el minimapa del juego.
const TIPOS_HORDA = ['recolector', 'baliza', 'segador', 'saltador', 'avispa', 'caparazon', 'sembrador'];
const enemigos = { count: 0, x: new Float32Array(64), z: new Float32Array(64), type: new Uint8Array(64) };
function poner(id: string, x: number, z: number, giro: number, clip?: string): Modelo {
  const m = CATALOGO.find((c) => c.id === id)!.crear();
  m.raiz.position.set(x, mundo.heightAt(x, z), z);
  m.raiz.rotation.y = giro;
  escena.add(m.raiz);
  const anim = m.animaciones.find((a) => a.clip.name === clip) ?? m.animaciones[0];
  const mezclador = new THREE.AnimationMixer(m.raiz);
  mezclador.clipAction(anim.clip).play();
  mezclador.setTime(rand() * anim.clip.duration);
  mezcladores.push(mezclador);
  m.raiz.traverse((o) => { if (o instanceof THREE.Mesh && !o.userData.contorno) o.castShadow = true; });
  const tipo = tipoDe(id);
  if (tipo) colocado.push({ id, tipo, x, z });
  const t = TIPOS_HORDA.indexOf(id);
  if (t >= 0 && enemigos.count < 64) {
    enemigos.x[enemigos.count] = x; enemigos.z[enemigos.count] = z; enemigos.type[enemigos.count++] = t;
  }
  return m;
}
const haciaCentro = (x: number, z: number) => Math.atan2(-x, -z);

// Refugio con su gente alrededor.
const refugio = mundo.lugarLibre(rand, COLOCACION.refugio.distancia, 9) ?? { x: 14, z: 12 };
poner('refugio', refugio.x, refugio.z, haciaCentro(refugio.x, refugio.z));
const npcs = ['npc-mecanica', 'npc-vigia', 'npc-botanica', 'npc-chatarrero'];
npcs.forEach((id, k) => {
  const ang = haciaCentro(refugio.x, refugio.z) + (k - 1.5) * 0.7;
  const x = refugio.x + Math.sin(ang) * 7, z = refugio.z + Math.cos(ang) * 7;
  poner(id, x, z, ang + Math.PI, 'Trabajar');
});
const ocupados: { x: number; z: number; r: number }[] = [{ ...refugio, r: 14 }];
const colocar = (ids: string[], distancia: readonly [number, number], separacion: number, clip?: string) => {
  for (const id of ids) {
    const p = mundo.lugarLibre(rand, distancia, 4, ocupados);
    if (!p) continue;
    ocupados.push({ ...p, r: separacion });
    poner(id, p.x, p.z, haciaCentro(p.x, p.z), clip);
  }
};
const C = COLOCACION;
const veces = (id: string, n: number) => Array<string>(n).fill(id);
colocar(['altar-cosecha', 'altar-heraldo', 'altar-ojo'], C.altaresJefe.distancia, C.altaresJefe.separacionMinima);
colocar(veces('altar-desafio', C.aras.cuantos), C.aras.distancia, C.aras.separacionMinima);
colocar(veces('torre-velo', C.torres.cuantos), C.torres.distancia, C.torres.separacionMinima, 'Emitir');
colocar(veces('caja-helios', C.cofresHelios.cuantos), C.cofresHelios.distancia, C.cofresHelios.separacionMinima);
colocar(['caja-suministros'], [8, 14], 4);
colocar(['caja-reliquia'], [30, 50], 6);

// Algo de horda repartida en grupos.
const horda = ['recolector', 'recolector', 'recolector', 'saltador', 'avispa', 'caparazon', 'sembrador', 'baliza', 'segador'];
for (let g = 0; g < 7; g++) {
  const p = mundo.lugarLibre(rand, [28, 110], 3);
  if (!p) continue;
  for (let k = 0; k < 5; k++) {
    const id = horda[Math.floor(rand() * horda.length)];
    const x = p.x + (rand() - 0.5) * 10, z = p.z + (rand() - 0.5) * 10;
    if (mundo.acidoEn(x, z) > 0 || mundo.ocupado(x, z, 1)) continue;
    const entrada = CATALOGO.find((c) => c.id === id)!;
    const m = poner(id, x, z, haciaCentro(x, z) + (rand() - 0.5), entrada.crear().animaciones[1]?.clip.name);
    m.raiz.scale.setScalar(1.1);
  }
}

// --------------------------------------------------------------- jugador

const jugador = CATALOGO.find((c) => c.id === 'astronauta')!.crear();
escena.add(jugador.raiz);
jugador.raiz.traverse((o) => { if (o instanceof THREE.Mesh && !o.userData.contorno) o.castShadow = true; });
const mezJugador = new THREE.AnimationMixer(jugador.raiz);
const accion = (n: string) => mezJugador.clipAction(jugador.animaciones.find((a) => a.clip.name === n)!.clip);
const reposo = accion('Reposo'), correr = accion('Correr');
reposo.play();
let actual = reposo;

const pos = new THREE.Vector3(0, 0, 0);
let yaw = Math.PI, pitch = 0.32, distancia = 10;

// Encuadres fijos para capturas: dónde poner al jugador y hacia dónde mirar.
const vista = params.get('vista') ?? 'jugador';
const lugar = (tipo: string, nombre?: string) => mundo.lugares.find((l) => l.tipo === tipo && (!nombre || l.nombre === nombre))!;
if (vista === 'acido') {
  const l = lugar('lago', 'Mar de HELIOS');
  const ang = Math.atan2(-l.x, -l.z);
  pos.set(l.x + Math.sin(ang) * (l.r + 6), 0, l.z + Math.cos(ang) * (l.r + 6));
  yaw = Math.atan2(l.x - pos.x, l.z - pos.z) + Math.PI;
  pitch = 0.22;
} else if (vista === 'vadeo') {
  // Dentro del Mar de HELIOS, vadeando hacia la orilla.
  const l = lugar('lago', 'Mar de HELIOS');
  const ang = Math.atan2(-l.x, -l.z);
  pos.set(l.x + Math.sin(ang) * (l.r * 0.45), 0, l.z + Math.cos(ang) * (l.r * 0.45));
  yaw = ang + Math.PI * 0.75;
  pitch = 0.3;
} else if (vista === 'montana') {
  const l = lugar('montaña', 'Sierra de Escarcha');
  pos.set(l.x + 34, 0, l.z + 30);
  yaw = Math.atan2(l.x - pos.x, l.z - pos.z) + Math.PI;
  pitch = 0.18;
} else if (vista === 'refugio') {
  // Detrás de la gente del refugio, mirando a la vigía.
  const vigia = colocado.find((c) => c.id === 'npc-vigia')!;
  const ang = Math.atan2(vigia.x - refugio.x, vigia.z - refugio.z);
  pos.set(vigia.x + Math.sin(ang) * 3.2, 0, vigia.z + Math.cos(ang) * 3.2);
  yaw = ang + 0.5;
  pitch = 0.2;
  distancia = 8;
} else if (vista === 'ruinas') {
  const l = lugar('barrio', 'Puerto viejo');
  pos.set(l.x - 6, 0, l.z + 16);
  yaw = Math.atan2(l.x - pos.x, l.z - pos.z) + Math.PI;
  pitch = 0.25;
} else if (vista === 'salida') {
  // Como empieza la partida en el juego: en el centro, mirando al norte (al cohete).
  yaw = 0;
} else if (vista === 'nave') {
  // Al pie de la rampa, con la nave en 3/4.
  pos.set(mundo.nave.x + 7, 0, mundo.nave.z + 3.5);
  yaw = Math.atan2(mundo.nave.x - 1.5 - pos.x, mundo.nave.z - pos.z) + Math.PI;
  pitch = 0.2;
  distancia = 13;
}
const fuera = mundo.resolve(pos.x, pos.z, 0.6, { x: 0, z: 0 });
pos.set(fuera.x, 0, fuera.z);

// ----------------------------------------------------------- interfaz

const conHud = params.get('hud') !== '0';
const lugaresMapa: NonNullable<MinimapState['lugares']> = [
  ...mundo.lugares.map((l) => ({ tipo: l.tipo, x: l.x, z: l.z, r: l.r })),
  ...colocado.map((c) => ({ tipo: c.tipo, x: c.x, z: c.z, hecho: c.id === 'altar-cosecha' })),
];
const reliquia = colocado.find((c) => c.id === 'caja-reliquia');
const jefes = [
  { minuto: 3, nombre: 'Cosecha', vencido: true },
  { minuto: 5, nombre: 'Heraldo' },
  { minuto: 9, nombre: 'Ojo de HELIOS' },
];
// En qué zona está el jugador: el lugar con nombre más cercano que lo cubra.
function zonaDe(x: number, z: number) {
  const enAcido = mundo.acidoEn(x, z) > 0;
  let mejor = '', dmin = Infinity;
  for (const l of mundo.lugares) {
    if (enAcido && l.tipo !== 'lago') continue;
    const d = Math.hypot(x - l.x, z - l.z) / (l.r * 1.4);
    if (d < 1 && d < dmin) { dmin = d; mejor = l.tipo === 'lago' && !enAcido ? `Orilla del ${l.nombre}` : l.nombre; }
  }
  if (mejor) return mejor;
  if (Math.hypot(x - mundo.nave.x, z - mundo.nave.z) < 10) return 'Nave de ARES-IX';
  return Math.hypot(x, z) > mundo.arena ? 'Tierras altas' : 'Llanura de Meta';
}
if (conHud) {
  showHud();
  setMision('Grieta en el Velo', 'Sol Vega');
  if (vista === 'vadeo') decir('ada', 'ADA', '¡Sal de ahí! El traje aguanta poco en el ácido.', 600);
  else if (vista === 'acido') decir('ada', 'ADA', 'Eso es ácido de HELIOS. Te come el traje en segundos: rodéalo por la orilla.', 600);
  else if (vista === 'refugio') decir('npc', `${NPCS[1].nombre} · ${NPCS[1].rol}`, NPCS[1].lineas.saludo[0], 600);
  else if (vista === 'montana') decir('operador', 'Sol Vega', 'Desde la sierra se ve todo el sector. Sube si te persiguen, pero no te quedes arriba.', 600);
  else decir('helios', 'HELIOS', 'Operador no reconocido. Devuelva el módulo 7. El velo protege a Meta.', 600);
}
const pies = new THREE.Vector3();
const carta = conHud || vista === 'carta' ? mundo.carta() : undefined;
// ?vista=carta: la carta del minimapa entera, encima de todo.
if (vista === 'carta' && carta) {
  carta.imagen.style.cssText = 'position:fixed;inset:0;margin:auto;height:96vh;z-index:9;image-rendering:auto';
  document.body.appendChild(carta.imagen);
}

// ----------------------------------------------------------- controles

const teclas = new Set<string>();
addEventListener('keydown', (e) => teclas.add(e.code));
addEventListener('keyup', (e) => teclas.delete(e.code));
let arrastre: { x: number; y: number } | null = null;
lienzo.addEventListener('pointerdown', (e) => { arrastre = { x: e.clientX, y: e.clientY }; });
addEventListener('pointerup', () => { arrastre = null; });
addEventListener('pointermove', (e) => {
  if (!arrastre) return;
  yaw -= (e.clientX - arrastre.x) * 0.006;
  pitch = Math.max(0.05, Math.min(1.2, pitch + (e.clientY - arrastre.y) * 0.004));
  arrastre = { x: e.clientX, y: e.clientY };
});
lienzo.addEventListener('wheel', (e) => { distancia = Math.max(4, Math.min(40, distancia * (1 + Math.sign(e.deltaY) * 0.1))); });

function ajustar() {
  renderer.setSize(innerWidth, innerHeight, false);
  camara.aspect = innerWidth / innerHeight;
  camara.updateProjectionMatrix();
}
addEventListener('resize', ajustar);
ajustar();

// -------------------------------------------------------------- bucle

const reloj = new THREE.Clock();
let fotogramas = 0;
const tmp = { x: 0, z: 0 };
function paso() {
  const dt = Math.min(reloj.getDelta(), 1 / 20);
  // Movimiento relativo a la cámara.
  const adelante = (teclas.has('KeyW') || teclas.has('ArrowUp') ? 1 : 0) - (teclas.has('KeyS') || teclas.has('ArrowDown') ? 1 : 0);
  const lado = (teclas.has('KeyD') || teclas.has('ArrowRight') ? 1 : 0) - (teclas.has('KeyA') || teclas.has('ArrowLeft') ? 1 : 0);
  const anda = adelante !== 0 || lado !== 0;
  if (anda) {
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
    const rx = -fz, rz = fx;
    let vx = fx * adelante - rx * lado, vz = fz * adelante - rz * lado;
    const l = Math.hypot(vx, vz);
    vx = (vx / l) * 6 * dt; vz = (vz / l) * 6 * dt;
    mundo.resolve(pos.x + vx, pos.z + vz, 0.6, tmp);
    pos.x = tmp.x; pos.z = tmp.z;
    jugador.raiz.rotation.y = Math.atan2(vx, vz);
  }
  const quiere = anda ? correr : reposo;
  if (quiere !== actual) { quiere.reset().play(); actual.crossFadeTo(quiere, 0.15, false); actual = quiere; }
  pos.y = mundo.heightAt(pos.x, pos.z);
  jugador.raiz.position.copy(pos);
  mezJugador.update(dt);
  for (const m of mezcladores) m.update(dt);
  mundo.update(dt);
  mundo.follow(pos);

  if (vista === 'aerea') {
    camara.position.set(0, 230, 210);
    camara.lookAt(0, 0, -10);
  } else {
    const objetivo = pos.clone().add(new THREE.Vector3(0, 2.2, 0));
    camara.position.set(
      objetivo.x + Math.sin(yaw) * Math.cos(pitch) * distancia,
      objetivo.y + Math.sin(pitch) * distancia,
      objetivo.z + Math.cos(yaw) * Math.cos(pitch) * distancia,
    );
    camara.position.y = Math.max(camara.position.y, mundo.heightAt(camara.position.x, camara.position.z) + 0.8);
    camara.lookAt(objetivo);
  }
  renderer.render(escena, camara);
  if (conHud) pintarHud(dt);
  if (++fotogramas === 20) {
    document.title = 'listo';
    if (params.has('mejoras')) mostrarMejoras(8, MUESTRA, () => undefined);
  }
  requestAnimationFrame(paso);
}

// Estado de prueba: a los 3:34, con el primer jefe vencido.
let tiempo = 214;
function pintarHud(dt: number) {
  tiempo += dt;
  pies.copy(pos).project(camara);
  // ¿Hay alguien con quien hablar?
  let cerca: (typeof NPCS)[number] | null = null;
  for (const c of colocado) {
    if (c.tipo !== 'npc' || Math.hypot(c.x - pos.x, c.z - pos.z) > 6) continue;
    cerca = NPCS.find((n) => n.id === c.id) ?? null;
  }
  updateHud({
    time: tiempo, hp: 72, maxHp: 100, level: 7, xp: 34, xpNext: 60, kills: 286, scrap: 143,
    weapons: [['cortador', 3], ['pulso', 2], ['dron', 1]],
    signal: vista === 'jugador' ? 1 : 0,
    anchor: { x: (pies.x + 1) / 2 * innerWidth, y: (1 - pies.y) / 2 * innerHeight },
    locked: true, duracion: 600, reliquias: 2,
    exposicion: 0.42 + Math.sin(tiempo * 0.3) * 0.05,
    acido: mundo.acidoEn(pos.x, pos.z),
    jefes,
    interaccion: cerca ? { tecla: 'V', texto: `Mantén V para hablar con ${cerca.nombre}` } : null,
    zona: zonaDe(pos.x, pos.z),
  });
  drawMinimap({
    px: pos.x, pz: pos.z, yaw, enemies: enemigos,
    relics: reliquia ? [{ x: reliquia.x + 3, z: reliquia.z }] : [],
    pad: { x: mundo.padPosition.x, z: mundo.padPosition.z },
    nave: mundo.nave,
    lugares: lugaresMapa,
    carta,
    marca: vista === 'refugio' ? { x: mundo.padPosition.x * 0.6, z: mundo.padPosition.z * 0.6 } : null,
    alcance: 60,
  });
}
requestAnimationFrame(paso);
