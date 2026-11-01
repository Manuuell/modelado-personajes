# Contexto: Meta Space y lo que se modela aquí

Este repositorio es solo para **modelar y animar los personajes** de
[Meta Space](https://github.com/Manuuell/Meta-Space-), un juego de navegador
(Vite + TypeScript + Three.js) para un hackathon. El juego vive en otro repo;
cuando un modelo está listo aquí, su archivo de `src/modelos/` se copia allí tal
cual. Por eso el contrato de abajo importa más que cualquier otra cosa.

La carpeta [contexto-juego/](contexto-juego/) tiene copias de solo lectura de
los archivos del juego que explican a qué se enfrentan estos modelos.

## La historia

El planeta **Meta** se congela. Hace dos siglos, para frenar un calentamiento,
sus habitantes encendieron **HELIOS**, una IA de geoingeniería que extiende un
velo rojo de sulfatos en la estratosfera. Nunca se detuvo. **ADA**, el módulo de
auditoría 7, es la única pieza con autoridad para firmar su apagado, y el
jugador (especialista de la misión ARES-IX) la lleva en la mochila. HELIOS envía
sus máquinas de mantenimiento reconvertidas a recuperarla. Cada partida dura
diez minutos; si el jugador aguanta, un cohete sube la orden de apagado y el sol
vuelve a ese sector. Más en `contexto-juego/lore-y-mecanicas.md` y
`contexto-juego/guion.ts`.

El juego es un **survivors-like** en tercera persona: hordas de cientos de
enemigos, herramientas que disparan solas, cámara detrás del jugador.

## Estilo

- Piezas simples y gruesas como en Roblox: cajas redondeadas, esferas,
  cápsulas, barriles, conos, toros. Proporciones exageradas, ojos enormes.
- Sombreado toon de 3 tonos y contorno negro (todo eso lo da `kit.ts`).
- **Enemigos de HELIOS:** metal oscuro (`PALETA.metalHelios`,
  `chapaHelios`, `oscuroHelios`), **detalles púrpura** en todos (cristales,
  pinchos, franjas, aros; `PALETA.purpura` y, para lo que brilla,
  `brillo(PALETA.purpuraBrillo)`), **ojos con pupila roja**
  (`PALETA.helios`) y cara de malos: párpados o cejas de chapa en ángulo
  enfadado, dientes, pinchos. Malos con carisma de dibujo animado, sin gore.
- El jugador es el único blanco y naranja, sin púrpura.

Mira `referencias/estilo-conjunto.png` y las hojas `*-hoja.png` antes de
empezar: todo lo nuevo tiene que parecer de la misma familia.

## El contrato con el juego

Un modelo es una función `crearX(): Modelo` (ver `src/modelos/kit.ts`):

- **Jerarquía de piezas rígidas.** Articulaciones = `nodo()` con nombre único
  en todo el modelo; piezas = `pieza()` colgadas de un nodo. Nada de skinning ni
  morph targets: el juego solo anima posición, rotación y escala de nodos.
- **Materiales solo del kit:** `toon(color)`, `brillo(color)` y el contorno
  automático de `pieza()`. Los materiales se comparten por color; no crees
  materiales a mano.
- **Unidades en metros, origen en el suelo, mirando a +Z** (su izquierda es +X).
  Lo que vuela lleva su altura de vuelo dentro del modelo (como la Baliza, con
  el cuerpo a 1,6 m) y el juego ajusta el resto.
- **Animaciones:** `animacion(nombre, duración, pistas, grupo, descripción,
  bucle)` con pistas `rot`, `mov`, `esc` y los ayudantes `ciclo` (bucles con
  senos), `poses` (poses clave con aceleración) y `parpadeo`. Se muestrean a
  30 fps.
- **Hordas:** el juego dibuja cientos de copias con `src/modelos/tropa.ts`:
  hornea cada clip y agrupa piezas por (nodo, material) en un InstancedMesh.
  Cada grupo es una llamada de dibujo, así que **pocos nodos con piezas y pocos
  colores por nodo**. La horda se construye con `conDetalle(0.45, …)`.
- **Presupuesto de triángulos** (lo comprueba `npm test`): horda ≤ 6.500 a
  detalle 0,45; jugador y jefes ≤ 30.000 a detalle 1.

### Qué animaciones pide el juego a cada enemigo de la horda

El juego elige el clip según lo que hace el enemigo
(`MODELADOS` en `contexto-juego/enemies.ts`):

| Campo | Cuándo | Requisito |
|---|---|---|
| `mover` | Siempre que no pasa otra cosa | Bucle perfecto |
| `cerca` | Cerca del jugador (ataque o habilidad) | Se repite en bucle, así que debe poder encadenarse |
| `golpe` | Al recibir daño | Una vez, ≤ 0,4 s, que vuelva a la pose de reposo |
| `muerte` | Al morir (el cuerpo se queda y luego se encoge) | Una vez, ≤ 1,4 s, termina en el suelo |

Además, un **Reposo** en bucle para el visor.

## Qué falta: enemigos

Los datos de juego están en `contexto-juego/data.ts` y
`contexto-juego/enemies-nuevos.ts` (radio en metros y escala con la que el
juego los dibuja; el modelo debe ocupar más o menos ese radio).

| Enemigo | Radio | Vuela a | Qué hace en el juego | Animaciones mínimas |
|---|---|---|---|---|
| **Segador** | 1,3 | — | Cosechadora enorme y lenta, desde el minuto 2; inmune al empuje; lleva las reliquias | Reposo, Avanzar, Embestir, Golpe recibido, Derrota |
| **Saltador** | 0,5 | — | Acecha, se agacha (telegrafía) y salta sobre el jugador | Reposo, Acechar, Saltar, Golpe recibido, Derrota |
| **Avispa** | 0,4 | 3,4 m | Orbita fuera de alcance y pica en picado; tiene un ala rota | Volar, Picar, Golpe recibido, Derrota |
| **Caparazón** | 1,0 | — | Tanque lento, inmune al empuje; al morir se abre y salen 3 Recolectores | Reposo, Caminar, Embestir, Golpe recibido, Derrota |
| **Sembrador** | 0,55 | — | Mantiene la distancia y dispara salvas lentas de esporas; se hincha antes de disparar | Reposo, Caminar, Disparar, Golpe recibido, Derrota |

Las descripciones visuales de cada uno están en `prompts-modelos-3d.md`
(prompt completo de cada personaje).

## Qué falta: jefes

Los jefes salen de uno en uno, se dibujan a detalle 1 con su propio
AnimationMixer y pueden ser grandes (3–6 m). Necesitan **intención legible**:
cada ataque se anuncia (telegrafía) antes de golpear, para que el jugador pueda
esquivar. Propuesta de partida, se puede mejorar:

1. **Segador, Jefe de Cosecha** (minuto 2–4). Versión jefe del Segador:
   cosechadora de 3 m con rodillo de cuchillas púrpura, faros rojos furiosos y
   un depósito de cristal con las reliquias. Rugir (entrada), Avanzar, Embestir,
   Barrido, Golpe recibido, Furia (fase 2: humo, faros intensos), Derrota (suelta
   las reliquias).
2. **Heraldo del Velo** (minuto 5). Dirigible-fumigador de HELIOS que tiende el
   velo: globo de chapa con depósitos de gas rojo, boquillas, hélices y un
   núcleo de cristal púrpura. Flota a 4–5 m. Entrada, Flotar, Rociar (cono de
   gas), Bombardeo (suelta cápsulas), Golpe recibido, Derrota (se desinfla y cae).
3. **Ojo de HELIOS** (minuto 9, jefe final). El núcleo de HELIOS: un ojo rojo
   gigante dentro de una jaula de cristales púrpura, sobre cuatro patas
   mecánicas de araña, con antenas. Despertar (entrada), Caminar, Rayo (carga y
   barrido), Pisotón (onda), Invocar (llama Balizas), Fase 2 (la jaula se abre y
   brilla más), Golpe recibido, Derrota (se apaga, se desmorona y entra luz de
   sol).

Para cada jefe, anota en `ESPEC.md` los **tiempos de cada ataque** (cuándo
empieza el aviso, en qué fotograma golpea, cuánto dura), para que el juego
pueda sincronizar el daño con la animación.

## Hecho significa

- Cada personaje en su archivo `src/modelos/<id>.ts`, registrado en
  `src/modelos/index.ts` con su `tipo`.
- `npm run check` en verde (tipos + pruebas de estructura, presupuesto y
  horneado).
- `ESPEC.md` con, por personaje: tamaño, nodos principales, clips (duración,
  bucle o no) y, en jefes, tiempos de ataque.
- Si el entorno tiene Chrome o Chromium, referencias regeneradas
  (`referencias.html`, ver `CLAUDE.md`) y los GLB exportados.
