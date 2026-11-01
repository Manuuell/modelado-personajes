# Especificación de los modelos

Medidas en metros, origen en el suelo, mirando a +Z. Clips muestreados a 30 fps.

## Nave de ARES-IX (`nave`, escena)

Lanzadera de la cinemática de entrada (`src/intro.ts`). Blanco y naranja como
el especialista; el visor del morro con dos ojos cyan le da cara.

- **Tamaño:** 3,3 m de morro a cola, 3,4 m de envergadura. El casco va a 1,5 m
  del suelo (vuela). Unos 22.600 triángulos a detalle 1 (se dibuja una sola vez).
- **Nodos:** `casco` (todo cuelga de él), `ojo_i`/`ojo_d`, `antena`,
  `ala_i`/`ala_d`, `motor_i`/`motor_d`/`motor_c`, `llama_i`/`llama_d`/`llama_c`
  (la escala z es el largo de la llama), `cola`, `retro_i`/`retro_d` (escala
  casi cero salvo al frenar).

| Clip | Duración | Bucle | Qué hace |
|---|---|---|---|
| Flotar | 2,4 s | sí | Se mece en el sitio, llamas bajas, parpadea |
| Volar | 1,2 s | sí | Crucero: llamas largas, antena peinada hacia atrás |
| Turbo | 0,8 s | sí | Llamas enormes, alas plegadas, ojos entornados |
| Frenar | 1,0 s | no | Encabrita el morro, retros encendidos de 0,08 a 0,6 s |

### Tiempos de la cinemática

La intro mueve el pivote de la nave por una ruta fija y mezcla los clips por
peso; todo sale del tiempo `t`, así que cualquier segundo se puede congelar
(`intro.html?t=…`).

| Segundo | Qué pasa |
|---|---|
| 0 – 0,9 | Fundido desde negro |
| 0,35 | La nave entra en plano por detrás de la cámara (Turbo) |
| 1,05 – 1,95 | Tonel mientras se aleja hacia el planeta |
| 2,2 – 4,6 | Cruza el cielo (Volar); cada letra sale de la nave al pasar sobre su hueco, salta con muelle y luego flota en ola |
| 4,7 | Frenar: retros y morro arriba |
| 5,15 | «SECTOR DELTA» se enciende letra a letra |
| 5,45 | Llega a su sitio y queda flotando (Flotar) |
| 5,75 | Lema |
| 6,4 | Título completo: el primer clic salta aquí |
| 6,5 | Pista «clic o Intro para despegar» («toca…» en táctil) |
| clic | Despegue (Turbo, 0,95 s) arrastrando las letras; luego `onDone()` y la capa se funde en 0,5 s sobre el menú |

Escape la cierra en el acto. Sin WebGL, llama a `onDone()` y no muestra nada.
