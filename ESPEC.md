# Especificación de los personajes

Lo que el juego necesita saber de cada modelo nuevo para conectarlo: tamaño,
nodos, clips y, en los jefes, los tiempos de cada ataque para sincronizar el
daño. Los datos de tamaño, triángulos y grupos están medidos sobre los modelos
(no a ojo).

Convenciones:

- Metros, origen en el suelo, mirando a +z (su izquierda es +x).
- Clips a 30 fps: **fotograma = segundo × 30**. «Bucle» se reproduce con
  `LoopRepeat`; «una vez», con `LoopOnce` y `clampWhenFinished`.
- El primer clip de cada modelo es su reposo (el que pone el visor).
- **Grupos** = llamadas de dibujo de la horda en `Tropa`: un grupo por cada par
  (nodo, material) y otro por el contorno de cada nodo. Como referencia, el
  Recolector tiene 36 y la Baliza 25.
- Las piezas «escondidas» (avisos, chispas, carga…) están a escala 0,001 en
  reposo y solo las enseña el clip que las usa.

## Horda: cómo conectarlos

Entradas propuestas para `MODELADOS` en `enemies.ts` (los nombres de clip son
exactos):

```ts
segador:   { crear: crearSegador,   mover: 'Avanzar', cerca: 'Embestir', distCerca: 4.5, golpe: 'Golpe recibido', muerte: 'Derrota', escala: 1.1,  altura: 0 },
saltador:  { crear: crearSaltador,  mover: 'Acechar', cerca: 'Saltar',   distCerca: 6,   golpe: 'Golpe recibido', muerte: 'Derrota', escala: 1.15, altura: 0 },
avispa:    { crear: crearAvispa,    mover: 'Volar',   cerca: 'Picar',    distCerca: 12,  golpe: 'Golpe recibido', muerte: 'Derrota', escala: 1,    altura: 0 },
caparazon: { crear: crearCaparazon, mover: 'Caminar', cerca: 'Embestir', distCerca: 3,   golpe: 'Golpe recibido', muerte: 'Derrota', escala: 1,    altura: 0 },
sembrador: { crear: crearSembrador, mover: 'Caminar', cerca: 'Disparar', distCerca: 20,  golpe: 'Golpe recibido', muerte: 'Derrota', escala: 1,    altura: 0 },
```

Tres cosas que no hace el render actual de modelados y que estos necesitan:

1. **Clips en fase con el juego.** `Acechar`/`Saltar` (2 s), `Volar`/`Picar`
   (3 s) y `Disparar` (4 s) duran lo mismo que el ciclo de `enemies-nuevos.ts`
   y empiezan donde empieza su fase. `renderModelados` ya los pone en fase sin
   tocar nada: el tiempo de `cerca` es `(time + seed) % duración` y el de
   `mover`, `time + seed`, que es exactamente la `fase(time, seed, periodo)`
   del movimiento. Por eso, en el Saltador y la Avispa, `mover` y `cerca` son el
   mismo ciclo (cambian la intención, no el ritmo) y se puede pasar de uno a
   otro en cualquier fotograma sin salto.
2. **La altura del salto y del picado la pone el juego** (`liftDe`), no el
   clip: así un golpe recibido en el aire no los baja al suelo de golpe. En
   `renderModelados`:
   ```ts
   const lift = esNuevo(type) ? liftDe(type, i, this, this.time) : 0;
   // El Saltador se agacha él solo (su clip encoge las patas): solo la parte positiva.
   const extra = type === 'saltador' ? Math.max(0, lift) : lift;
   this.pos.set(x, this.world.heightAt(x, z) + modelado.altura + extra, z);
   ```
3. **Caparazón:** la concha se abre en su `Derrota` y asoman las cúpulas de
   los tres Recolectores entre 0,35 y 0,55 s. Si las crías (`criasAlMorir`)
   aparecen a los **0,6 s** de morir, en lugar de en el mismo fotograma, se ven
   salir del huevo.

La Avispa lleva su altura de vuelo dentro del modelo (cuerpo a 3,4 m, como
`def.height`), así que `altura: 0`; si se cambia su `escala`, la altura también
se escala: `altura = 3.4 × (1 − escala)` la deja en 3,4 m.

## Horda: fichas

### Segador (`segador.ts`)

Cosechadora con faros de pupila roja, boca de dientes, rodillo de cuchillas
púrpura que brillan, ruedas con tapacubos púrpura, cristales y depósito.

- **Tamaño:** 2,3 m hasta el escape (3,0 con el humo), 2,3 de ancho, 2,8 de
  largo. Radio de juego 1,3 → `escala: 1.1`.
- **Presupuesto:** 6.298 triángulos a detalle 0,45; 24 grupos.
- **Nodos:** `cuerpo` (chasis, cabina, boca, depósito; balanceo y vuelco),
  `faros` (pupilas: se encienden, guiñan y se apagan), `rodillo` (gira en x),
  `ruedas_d` / `ruedas_t` (ejes, giran en x), `humo` (sube y crece).

| Clip | Campo | Duración | Fotogramas | Tipo | Qué hace |
|---|---|---|---|---|---|
| Reposo | visor | 2,00 s | 60 | bucle | Al ralentí: vibra, el rodillo gira despacio, echa humo y mira con los faros. |
| Avanzar | `mover` | 1,20 s | 36 | bucle | Traquetea: ruedas y rodillo girando, sacudidas y humo. |
| Embestir | `cerca` | 1,40 s | 42 | bucle | Recula con el morro arriba (0–0,6 s), faros encendidos, y embiste (0,6–0,8 s); vuelve a su sitio para la siguiente. |
| Golpe recibido | `golpe` | 0,40 s | 12 | una vez | Se sacude, se aplasta sobre las ruedas y guiña los faros. |
| Derrota | `muerte` | 1,40 s | 42 | una vez | Tiembla echando humo, los faros se apagan y vuelca de lado. |

### Saltador (`saltador.ts`)

Saltamontes de chatarra: muelle por abdomen, patas traseras enormes con
rodillas púrpura que brillan, cabeza en cuña con ojos rasgados y pinzas.

- **Tamaño:** 1,0 m de alto, 0,84 de ancho, 1,6 de largo. Radio de juego 0,5
  → `escala: 1.15`.
- **Presupuesto:** 4.330 triángulos; 33 grupos.
- **Nodos:** `cuerpo` (aplastar y estirar desde el suelo), `cadera` (sube y
  baja), `torso` (cabeceo), `muelle` (se encoge y se estira), `cabeza`,
  `ojos` / `pupilas` (se encienden al agacharse), `pinzas` (se abren escalando
  en x), `muslo_i/d` + `tibia_i/d` (patas traseras, resueltas con cinemática
  inversa para que los pies no resbalen), `pata_i/d` (delanteras).

| Clip | Campo | Duración | Fotogramas | Tipo | Qué hace |
|---|---|---|---|---|---|
| Reposo | visor | 1,60 s | 48 | bucle | Agazapado: respira con el muelle, mira, muerde el aire y parpadea. |
| Acechar | `mover` | 2,00 s | 60 | bucle | El ciclo del juego. Ver la tabla de abajo. |
| Saltar | `cerca` | 2,00 s | 60 | bucle | El mismo ciclo con intención: ojos encendidos y pinzas abiertas al agacharse, muerde al caer. |
| Golpe recibido | `golpe` | 0,30 s | 9 | una vez | Se aplasta, cabeza atrás, ojos cerrados, pinzas abiertas. |
| Derrota | `muerte` | 1,00 s | 30 | una vez | Se le sueltan los muelles: el abdomen sale disparado, las patas saltan y cae de bruces. |

Ciclo de `Acechar` y `Saltar` (igual que `moverSaltador`):

| Tramo | Segundos | Fotogramas | Qué se ve |
|---|---|---|---|
| Aterrizaje | 0–0,22 | 0–7 | Aplastado del golpe contra el suelo y rebote. |
| Acecho | 0,22–1,15 | 7–35 | Agazapado, pasitos con las patas delanteras, cabeza que barre. |
| Telegrafía | 1,15–1,50 | 35–45 | Se encoge temblando, el muelle se comprime, ojos y pupilas se encienden (más en `Saltar`), las pinzas se abren. |
| Salto | 1,50–2,00 | 45–60 | Se estira, patas atrás, pinzas abiertas en lo alto (1,75 s) y muerde al caer (1,93 s). |

### Avispa (`avispa.ts`)

Dron insecto: abdomen con rayas púrpura que brillan, aguijón largo, ojos
enormes con párpados en V; el rotor derecho está roto y remendado con cinta.

- **Tamaño:** cuerpo a 3,4 m del suelo; 1,4 m de la cabeza a la punta del
  aguijón y 1,4 de rotor a rotor. Radio de juego 0,4 → `escala: 1`.
- **Presupuesto:** 3.866 triángulos; 22 grupos.
- **Nodos:** `cuerpo` (vuelo torcido, picado), `cabeza`, `pupilas` (se
  encienden al picar), `abdomen` (recoge el aguijón hacia delante),
  `rotor_i` (bueno) y `rotor_d` (roto, gira a trompicones y se suelta al morir).

| Clip | Campo | Duración | Fotogramas | Tipo | Qué hace |
|---|---|---|---|---|---|
| Volar | `mover` / visor | 3,00 s | 90 | bucle | El ciclo del juego: vuela torcida orbitando y baja el morro en el picado. |
| Picar | `cerca` | 3,00 s | 90 | bucle | El mismo ciclo con intención: se echa atrás temblando, recoge el aguijón y clava. |
| Golpe recibido | `golpe` | 0,30 s | 9 | una vez | Tumbo hacia el lado roto; las pupilas se achican. |
| Derrota | `muerte` | 1,30 s | 39 | una vez | El rotor roto sale volando; cae en espiral hasta el suelo. |

Ciclo de `Volar` y `Picar` (igual que `moverAvispa`):

| Tramo | Segundos | Fotogramas | Qué se ve |
|---|---|---|---|
| Salida del picado | 0–0,6 | 0–18 | Levanta el morro; el abdomen se recoloca. |
| Órbita | 0,6–1,7 | 18–51 | Vuelo torcido hacia el lado roto, bamboleo del rotor malo. |
| Telegrafía | 1,7–2,2 | 51–66 | Se echa atrás y arriba temblando, ojos encendidos, aguijón recogido hacia delante (en `Picar`, mucho más). |
| Picado | 2,2–3,0 | 66–90 | Morro abajo y aguijón por delante; clava en 2,55 s (fotograma 77). |

### Caparazón (`caparazon.ts`)

Escarabajo tanque: concha de dos mitades con grietas púrpura que brillan y
cristales en el lomo; por la raja asoma el núcleo. Cabeza cabezota con un ojo,
visera en V, cuernos y dientes; seis patas cortas.

- **Tamaño:** 1,6 m de alto, 2,05 de ancho, 2,5 de largo. Radio de juego 1,0
  → `escala: 1`.
- **Presupuesto:** 5.262 triángulos; 31 grupos.
- **Nodos:** `cuerpo`, `nucleo` (late; se apaga al morir), `concha_i` /
  `concha_d` (giran sobre su borde de abajo: se abren como un huevo),
  `cabeza`, `ojo_c` / `pupila_c`, `patas_a` / `patas_b` (los dos trípodes),
  `carga` (las cúpulas de los tres Recolectores, escondidas), `chispas`.

| Clip | Campo | Duración | Fotogramas | Tipo | Qué hace |
|---|---|---|---|---|---|
| Reposo | visor | 2,00 s | 60 | bucle | Respira levantando la concha, el núcleo late y mira a los lados. |
| Caminar | `mover` | 1,20 s | 36 | bucle | Paso pesado en trípode; la concha se balancea. |
| Embestir | `cerca` | 1,20 s | 36 | bucle | Se echa atrás con la cabeza alta (0–0,38 s), baja los cuernos y embiste (0,38–0,5 s), vuelve a su sitio. |
| Golpe recibido | `golpe` | 0,40 s | 12 | una vez | Se aplasta, mete la cabeza y saltan chispas púrpura. |
| Derrota | `muerte` | 1,30 s | 39 | una vez | Tiembla, la concha se parte y cae a los lados; asoman los tres Recolectores (0,35–0,55 s). |

### Sembrador (`sembrador.ts`)

Planta mecánica: tres raíces con garras púrpura, bulbo púrpura enjaulado con
esporas que brillan, tubos con burbujas, flor de pétalos de chapa y púrpura con
un ojo, cejas en V y corona de dientes.

- **Tamaño:** 2,0 m de alto, 1,14 de ancho, 1,0 de largo. Radio de juego 0,55
  → `escala: 1`.
- **Presupuesto:** 5.102 triángulos; 32 grupos.
- **Nodos:** `pata_a/b/c` (raíces), `tallo`, `bulbo` (late y se hincha),
  `polvo` (el estallido al morir), `cuello`, `burbujas` (suben en bucle),
  `cabeza`, `ojo_c` / `pupila_c`, `petalos` (abiertos o en capullo según la
  escala), `espora` (la que escupe).

| Clip | Campo | Duración | Fotogramas | Tipo | Qué hace |
|---|---|---|---|---|---|
| Reposo | visor | 1,60 s | 48 | bucle | Se mece, el bulbo late y suben las burbujas. |
| Caminar | `mover` | 1,00 s | 30 | bucle | Pasitos con las tres raíces por turnos. |
| Disparar | `cerca` | 4,00 s | 120 | bucle | El ciclo de `quiereDisparar`. Ver la tabla de abajo. |
| Golpe recibido | `golpe` | 0,30 s | 9 | una vez | Se encoge y cierra la flor de golpe. |
| Derrota | `muerte` | 1,20 s | 36 | una vez | Se marchita: el bulbo revienta en polvo púrpura (0,42 s) y la flor cae. |

Ciclo de `Disparar` (el juego dispara cuando `fase(time, seed, 4) < dt`, es
decir, en el fotograma 0):

| Tramo | Segundos | Fotogramas | Qué se ve |
|---|---|---|---|
| Escupe | 0–0,24 | 0–7 | La flor se abre de golpe, la cabeza retrocede, el bulbo se vacía y la espora sale disparada. |
| Recupera | 0,24–0,6 | 7–18 | Vuelve a su postura. |
| Pasea | 0,6–3,2 | 18–96 | Pasitos laterales (el juego lo mueve en su banda de 12–15 m). |
| Telegrafía | 3,4–4,0 | 102–120 | Se planta, el bulbo se hincha un 34 %, la flor se cierra en capullo, la pupila crece y tiembla. |

## Jefes: cómo conectarlos

- Se dibujan como mallas normales con su propio `AnimationMixer`, a detalle 1.
- **Entrada:** un clip de una vez al aparecer (`Rugir`, `Entrada`,
  `Despertar`). El del Ojo empieza encogido y con el ojo cerrado.
- **Fase 2:** al cruzar el umbral de vida, el clip de transición de una vez
  (`Furia` o `Fase 2`) y después, **a la vez que cualquier otro clip**, la
  capa `Enfurecido` en bucle con peso 1. `Enfurecido` solo anima nodos que
  ningún clip normal toca (llamas, halos, desgarro, jaula abierta…), así que no
  se pelea con los demás. Al morir, parar `Enfurecido` y reproducir `Derrota`.
- **Avisos:** cada ataque enseña una marca roja en el suelo (nodos `aviso_*`)
  antes de golpear. Cuelgan de la raíz, a 3 cm del suelo y sin sombra: la raíz
  del jefe debe ir a la altura del terreno, como los enemigos.
- **Tiempos:** cada archivo exporta sus tiempos (`TIEMPOS_JEFE_COSECHA`,
  `TIEMPOS_HERALDO`, `TIEMPOS_OJO`) en segundos, con la forma
  `{ aviso, golpe, finGolpe, duracion }`, para que el juego programe el daño
  sin copiar números a mano. La ventana de daño es de `golpe` a `finGolpe`.

### Segador, Jefe de Cosecha (`segador-jefe.ts`, minuto 2–4)

La cosechadora madre: orugas con ruedas de tapacubos púrpura, cabezal con
rodillo de cuchillas, cabina con faros furiosos y visera en V, cristales en el
lomo, dos chimeneas y una jaula con las cuatro reliquias (panel solar, cápsula
RTG, antena y el dibujo) flotando alrededor de un núcleo de cristal.

- **Tamaño:** 3,3 m hasta las chimeneas (4,3 con el humo), 3,3 de ancho, 4,5
  de largo.
- **Presupuesto:** 28.084 triángulos; 150 mallas.
- **Nodos:** `cuerpo`, `faros`, `visera`, `halos` (fase 2), `cabezal` (gira
  para el barrido) con `rodillo` y `chispas`, `oruga_i/d` con `rueda_*` y
  `banda_*` (tacos que corren), `jaula` con `nucleo`, `reliquia_*` y `tapa`,
  `humo_i/d`, `llamas` y `furia` (fase 2), `aviso_carga`, `aviso_barrido`.

| Clip | Duración | Fotogramas | Tipo | Qué hace |
|---|---|---|---|---|
| Reposo | 2,00 s | 60 | bucle | Al ralentí; las reliquias flotan en la jaula. |
| Rugir | 2,80 s | 84 | una vez | Entrada: faros apagados, tose, se encienden (0,66 s), se encabrita rugiendo y cae de golpe en 2,4 s (fotograma 72: buen momento para temblar la cámara). |
| Avanzar | 1,20 s | 36 | bucle | Traqueteo sobre las orugas. |
| Embestir | 2,40 s | 72 | una vez | Ver tiempos. |
| Barrido | 2,00 s | 60 | una vez | Ver tiempos. |
| Golpe recibido | 0,45 s | 14 | una vez | Se sacude y guiña los faros. |
| Furia | 2,40 s | 72 | una vez | Fase 2: llamas en las chimeneas (1,15 s), halos rojos (1,1 s) y cristales encendidos (0,9 s). |
| Enfurecido | 1,00 s | 30 | bucle | Capa de fase 2: llamas, halos y cristales. |
| Derrota | 3,60 s | 108 | una vez | Chispas, faros que mueren (1,0 s), la tapa salta y las reliquias salen despedidas (1,15 s) y caen al suelo (2,0 s); vuelca de lado (1,4–2,3 s). |

| Ataque | Aviso | Golpe | Fin del golpe | Duración | Zona |
|---|---|---|---|---|---|
| Embestir | 0 s (f. 0): recula encabritado; flechas en el suelo de 0,15 a 1,2 s | 1,1 s (f. 33) | 1,5 s (f. 45) | 2,4 s (72) | Carril del ancho del jefe (3,3 m) hasta unos 8 m por delante. El clip adelanta el cuerpo 1,4 m; el resto de la carga la pone el juego. |
| Barrido | 0 s (f. 0): gira el cabezal a su derecha; arco rojo de 0,15 a 0,86 s | 0,85 s (f. 26) | 1,2 s (f. 36) | 2,0 s (60) | Arco de 2,2 a 4,6 m delante, ±65°; barre de su derecha a su izquierda. |

### Heraldo del Velo (`heraldo.ts`, minuto 5)

Dirigible fumigador: globo de chapa con cara en el morro (ojos, cejas en V,
sonrisa de dientes), tres boquillas, depósitos de gas rojo con mirilla,
aletas púrpura, dos hélices, góndola con bodega de cápsulas y núcleo de cristal
púrpura colgando.

- **Tamaño:** el centro del globo vuela a 4,5 m (lleva la altura dentro, la
  raíz va en el suelo); 4,9 m de largo y 3,8 de ancho; ocupa de 1,95 a 6,3 m de
  altura.
- **Presupuesto:** 27.162 triángulos; 115 mallas.
- **Nodos:** `cuerpo`, `globo` (se hincha, se abolla, se desinfla) con `cara`,
  `pupilas`, `cejas`, `desgarro` y `fuga` (fase 2), `boquillas`, `tanques`,
  `gondola` con `compuerta_i/d`, `bomba_1..3`, `nucleo` y `aura` (fase 2),
  `helice_i/d`, `nube` (el gas rociado), `aviso_rocio`, `aviso_bombas`,
  `estallidos`.

| Clip | Duración | Fotogramas | Tipo | Qué hace |
|---|---|---|---|---|
| Flotar | 2,40 s | 72 | bucle | Reposo y movimiento: cabecea, hélices, núcleo que late. |
| Entrada | 3,00 s | 90 | una vez | Baja del cielo medio desinflado (7 m más arriba), se hincha (2,0 s), abre los ojos (2,05 s) y da un bocinazo de gas (2,3–2,8 s). |
| Rociar | 3,00 s | 90 | una vez | Ver tiempos. |
| Bombardeo | 2,60 s | 78 | una vez | Ver tiempos. |
| Golpe recibido | 0,45 s | 14 | una vez | El globo se abolla y rebota. |
| Furia | 2,60 s | 78 | una vez | Fase 2: el globo se raja (0,6 s), escapa gas rojo, se revuelve y el núcleo se rodea de un aura (1,5 s). |
| Enfurecido | 1,20 s | 36 | bucle | Capa de fase 2: gas a borbotones por el desgarro y aura que late. |
| Derrota | 4,00 s | 120 | una vez | Se desinfla girando y cae arrugado al suelo (3,2 s). |

| Ataque | Aviso | Golpe | Fin del golpe | Duración | Zona |
|---|---|---|---|---|---|
| Rociar | 0 s (f. 0): baja el morro, hincha los depósitos, gotea; diana roja de 0,15 a 1,15 s | 1,1 s (f. 33) | 2,2 s (f. 66) | 3,0 s (90) | Círculo de 2,6 m de radio centrado 4,8 m por delante (barre ±10° a los lados). |
| Bombardeo | 0 s (f. 0): abre la bodega (0,4 s), las cápsulas parpadean; tres anillos rojos de 0,15 a 1,36 s; suelta en 0,9 s | 1,35 s (f. 41): impacto | 1,7 s (f. 51) | 2,6 s (78) | Tres círculos de 1,35 m de radio en (x, z) = (−1,8; −0,5), (0; −0,5) y (1,8; −0,5). |

### Ojo de HELIOS (`ojo-helios.ts`, minuto 9, jefe final)

El núcleo de HELIOS: un ojo gigante de iris rojo y pupila rasgada, párpados
blindados con cejas en V, una jaula de cristales púrpura que lo agarra como
garras, tres antenas de luz roja y cuatro patas de araña con rodillas que
brillan. Las patas se resuelven con los pies clavados en el suelo en todos los
clips.

- **Tamaño:** 6 m con las antenas; el ojo a 3,3 m; 6,4 m de ancho de pata a
  pata y 3,9 de fondo.
- **Presupuesto:** 24.076 triángulos; 90 mallas.
- **Nodos:** `cuerpo`, `ojo` (gira para mirar) con `iris`, `apagado`, `carga`,
  `mira` y `rayo`, `parpado_sup` / `parpado_inf`, `jaula` y `fulgor` (fase 2),
  `antenas` con `luces` y `ondas`, `pata_*` + `muslo_*` + `tibia_*`
  (`del_i`, `del_d`, `tra_i`, `tra_d`), `aviso_rayo`, `aviso_pisoton`, `onda`,
  `aviso_invocar`, `sol` y `luz_suelo`.

| Clip | Duración | Fotogramas | Tipo | Qué hace |
|---|---|---|---|---|
| Reposo | 2,40 s | 72 | bucle | Respira; el ojo vigila y parpadea. |
| Despertar | 3,60 s | 108 | una vez | Entrada: encogido con el ojo cerrado, abre una rendija (0,95 s), se levanta temblando (1,2–2,3 s) y abre el ojo de golpe (2,45 s). |
| Caminar | 1,60 s | 48 | bucle | Paso de araña en diagonal. |
| Rayo | 3,80 s | 114 | una vez | Ver tiempos. |
| Pisotón | 2,40 s | 72 | una vez | Ver tiempos. |
| Invocar | 2,80 s | 84 | una vez | Ver tiempos. |
| Golpe recibido | 0,45 s | 14 | una vez | Retrocede y entorna el ojo. |
| Fase 2 | 3,00 s | 90 | una vez | Se estremece, recoge los párpados, la jaula se abre (1,2–1,7 s) y se enciende una corona roja (1,5–1,75 s). |
| Enfurecido | 3,60 s | 108 | bucle | Capa de fase 2: jaula abierta, corona que gira y late, ojo hinchado. |
| Derrota | 4,00 s | 120 | una vez | El ojo parpadea y se apaga (1,1 s), las patas ceden (1,0–2,3 s), la jaula se desmorona y baja la luz del sol (2,6–3,5 s). |

| Ataque | Aviso | Golpe | Fin del golpe | Duración | Zona |
|---|---|---|---|---|---|
| Rayo | 0 s (f. 0): se agacha y gira a su derecha; carga en la pupila de 0,2 a 1,3 s, mira láser de 0,3 a 1,3 s, arco rojo de 0,2 a 1,32 s | 1,3 s (f. 39) | 2,7 s (f. 81) | 3,8 s (114) | Rayo de 10 m que barre de −50° a +50° (de su derecha a su izquierda) en esos 1,4 s; el arco marca de 2,6 a 10 m. |
| Pisotón | 0 s (f. 0): se encabrita con las patas delanteras en alto; anillo rojo de 0,15 a 0,96 s | 0,95 s (f. 29): pisa | 1,35 s (f. 41) | 2,4 s (72) | Onda en el suelo que crece de 1,5 a 6 m de radio entre 0,95 y 1,35 s. |
| Invocar | 0 s (f. 0): mira al cielo, las antenas emiten anillos; círculos de 0,5 a 2,0 s | 1,8 s (f. 54): destellan, salen las Balizas | — | 2,8 s (84) | Tres Balizas a 6 m: (x, z) = (−5,2; 3), (0; 6) y (5,2; 3). |

## Mapa: fichas

Modelos para poblar el mapa. El diseño (qué hace cada uno en la partida, las
recompensas y la conversación por voz) está en [MAPA.md](MAPA.md); los datos,
en `src/contenido/mapa.ts`. Tipos nuevos en el catálogo, con su presupuesto a
detalle 1: `npc` y `mapa` (≤ 20.000 triángulos, salen pocos) y `objeto`
(≤ 6.000, las cajas pueden ser docenas).

### NPC: Iris, Tali, Lis y Bruno (`npc-*.ts` sobre `gente.ts`)

Cuerpo chibi común (`gente.ts`): cabeza grande con ojos de pupila oscura,
cejas y una boca que se abre al hablar bajo una sonrisa en arco; brazos con
codo y mano; ropa de abrigo de colores cálidos. Se construyen a detalle 0,75.
Cada uno añade su herramienta (en `mano_d`), su puesto de trabajo (en
`puesto`, colgado de la raíz) y su clip `Trabajar`.

| NPC | Alto | Triángulos | Herramienta y puesto | `Trabajar` |
|---|---|---|---|---|
| `npc-mecanica` (Iris) | 2,5 m | 16.392 | llave inglesa; generador, bombilla y chispas | 1,60 s: golpea el generador dos veces (chispas en 0,47 y 1,07 s) |
| `npc-vigia` (Tali) | 2,6 m | 14.232 | prismáticos; catalejo en trípode y banderín del sol | 3,20 s: barre el horizonte, baja los prismáticos y señala (1,9–2,6 s) |
| `npc-botanica` (Lis) | 2,5 m | 18.486 | vial; planta bajo campana con lámpara y maletín | 3,00 s: se arrodilla, toma una muestra y la mira a contraluz |
| `npc-chatarrero` (Bruno) | 2,65 m | 19.138 | engranaje y mochila de chatarra; carro y balanza | 2,40 s: saca una pieza, la pesa y la echa al montón |

- **Nodos:** raíz → `giro` → `cuerpo` → `cadera` → `pecho` → `cabeza` (con
  `ojo_i/d`, `pupila_i/d`, `ceja_i/d`, `boca`) y `hombro_i/d` → `codo_i/d` →
  `mano_i/d`; `pierna_i/d`; `puesto` (en la raíz). **Ningún clip toca
  `giro`**: el juego lo gira en y para que el NPC mire al jugador sin mover su
  puesto (lo comprueba la prueba).

| Clip | Duración | Fotogramas | Tipo | Qué hace |
|---|---|---|---|---|
| Reposo | 2,40 s | 72 | bucle | Respira, mira a los lados y parpadea. |
| Trabajar | según el NPC | — | bucle | Su oficio (tabla de arriba). |
| Saludar | 1,40 s | 42 | una vez | Saluda con la mano y sonríe: cuando el jugador llega a 6 m. |
| Escuchar | 1,60 s | 48 | bucle | Mano a la barbilla, cabeza ladeada, asiente: mientras el jugador habla. |
| Hablar | 1,20 s | 36 | bucle | Gesticula y mueve la boca a ritmo de sílabas: mientras suena su respuesta. |
| Dar | 1,40 s | 42 | una vez | Tiende las manos: el objeto se ve de 0,35 a 0,95 s. |
| Celebrar | 1,00 s | 30 | bucle | Salta con los brazos arriba: vuelve el sol o le ayudas. |
| Asustarse | 0,80 s | 24 | bucle | Agachado, tapándose la cabeza: enemigos a menos de 10 m. |

### Altares de jefe (`altar-jefe.ts`: `altar-cosecha`, `altar-heraldo`, `altar-ojo`)

Monolito de HELIOS: plataforma de dos escalones con aro púrpura, cuatro
pilares con cristales y luces rojas, pedestal con ojo rojo bajo visera en V y
el emblema del jefe flotando (rueda de cuchillas, dirigible u ojo).

- **Tamaño:** 4,4 m de ancho, 3 m hasta el emblema. **10.136–10.580
  triángulos.**
- **Nodos:** `altar`, `emblema`, `cristales` (púrpura), `cristales_sol`
  (escondidos), `luces`, `haz` (22 m al cielo, escondido), `anillos`,
  `recompensa` (sol dorado, escondido).

| Clip | Duración | Fotogramas | Tipo | Qué hace |
|---|---|---|---|---|
| Reposo | 3,00 s | 90 | bucle | Dormido: el emblema gira despacio. |
| Invocar | 3,00 s | 90 | una vez | Anillos, **haz al cielo en 1,2 s (f. 36)**, **el jefe aparece en 2,6 s (f. 78)**. |
| Combate | 2,00 s | 60 | bucle | Mientras el jefe vive. |
| Recompensa | 3,00 s | 90 | una vez | Se purifica; **la recompensa se puede recoger en 2,4 s (f. 72)**. |
| Purificado | 2,40 s | 72 | bucle | Con la recompensa flotando. |
| Agotado | 2,40 s | 72 | bucle | Ya recogida. |

### Ara del Sol (`altar-desafio.ts`)

Monumento de piedra cálida con un obelisco, un sol de cobre y ocho lámparas
(`lampara_0`…`lampara_7`). **3,9 m de alto, 4,8 de ancho; 12.496
triángulos.** El anillo de la zona (`zona`) mide 8 m de radio
(`RADIO_DESAFIO`).

| Clip | Duración | Fotogramas | Tipo | Qué hace |
|---|---|---|---|---|
| Reposo | 3,00 s | 90 | bucle | El sol gira despacio. |
| Activar | 1,60 s | 48 | una vez | Se enciende y se abre la zona. |
| Desafío | 2,00 s | 60 | bucle | Mientras dura; a la vez que `Progreso`. |
| Progreso | 1,00 s | 30 | una vez | **En pausa con `time = progreso`**: la lámpara k se enciende en (k + 1) / 8. |
| Superado | 2,40 s | 72 | una vez | Destellos y rayos; **premio en 0,8 s (f. 24)**. |
| Fallado | 1,40 s | 42 | una vez | Las lámparas se apagan una a una. |

### Cajas de premio (`caja-premio.ts`: `caja-suministros`, `caja-helios`, `caja-reliquia`)

Tapa con bisagra detrás (nodo `tapa`), luz de aviso (`baliza`) y destello
(`destello`). **1 m de ancho; 2.966–3.624 triángulos** (detalle 0,55). La de
suministros lleva `paracaidas`; la de HELIOS, `cerradura` (ojo rojo) y
`hackeo` (ojo cian de ADA).

| Clip | Duración | Fotogramas | Tipo | Qué hace |
|---|---|---|---|---|
| Reposo | 2,00 s | 60 | bucle | La luz parpadea y la tapa «respira». |
| Aparecer | 2,00 s | 60 | una vez | Suministros: cae en paracaídas desde 10 m y aterriza en 1,5 s. HELIOS: sale del suelo. Reliquia: se materializa. |
| Abrir | 1,20 s | 36 | una vez | Tiembla y salta la tapa (0,45 s); **botín en 0,5 s (f. 15)**. |
| Abierta | 2,00 s | 60 | bucle | Vacía. |

### Torre del Velo (`torre-velo.ts`) y Refugio (`refugio.ts`)

- **Torre del Velo:** 6,3 m hasta la boca (10 con el humo); 8.870
  triángulos. Nodos `columna` (lo que cae), `ojo`, `aros`, `humo`,
  `chispas`, `sol`. Clips: `Emitir` (3 s, bucle), `Golpe recibido` (0,45 s),
  `Colapso` (3 s: cae de 0,8 a 1,6 s, **sol en 2,2 s**), `Apagada` (2 s,
  bucle).
- **Refugio:** 5 m de ancho y 5 m hasta la antena; 9.582 triángulos. Nodos
  `puerta`, `luz`, `alarma` / `faro`, `fuego`, `bandera`. Clips: `Reposo`
  (3 s, bucle), `Abrir` (1,4 s), `Alarma` (1 s, bucle: cierra la escotilla y
  gira la luz roja).


## Nave de ARES-IX (`nave`, escena)

Lanzadera de la cinemática de entrada (`src/intro.ts`). Blanco y naranja como
el especialista; el visor del morro con dos ojos cyan le da cara.

- **Tamaño:** 3,3 m de morro a cola, 3,4 m de envergadura. El casco va a 1,5 m
  del suelo (vuela). Unos 28.600 triángulos a detalle 1 (se dibuja una sola vez).
- **Posada en el mapa** (`nave-posada`, tipo mapa): la misma con
  `crearNavePosada()`, a ×3,5 con `agrandar` (11,6 m de largo, 6,5 de alto),
  detalle 0,7 y `Posada` como primer clip. Unos 17.100 triángulos.
- **Nodos:** `casco` (todo cuelga de él), `ojo_i`/`ojo_d`, `antena`,
  `ala_i`/`ala_d` con `luz_i`/`luz_d` en la punta, `motor_i`/`motor_d`/`motor_c`,
  `llama_i`/`llama_d`/`llama_c` (la escala z es el largo de la llama), `cola`,
  `retro_i`/`retro_d` (escala casi cero salvo al frenar), `escotilla` (gira
  sobre su borde de abajo: −127,5° en z la deja de rampa) con
  `escotilla_punta` (sale 0,5 m por la rampa) y `pata_i`/`pata_d`/`pata_n`
  (escala casi cero en vuelo).

| Clip | Duración | Bucle | Qué hace |
|---|---|---|---|
| Flotar | 2,4 s | sí | Se mece en el sitio, llamas bajas, parpadea |
| Volar | 1,2 s | sí | Crucero: llamas largas, antena peinada hacia atrás |
| Turbo | 0,8 s | sí | Llamas enormes, alas plegadas, ojos entornados |
| Frenar | 1,0 s | no | Encabrita el morro, retros encendidos de 0,08 a 0,6 s |
| Aterrizar | 2,6 s | no | Baja 0,51 m, saca las patas (0,25–0,9 s), toca suelo a 1,45 s con rebote, apaga motores y abre la rampa (1,9–2,6 s) |
| Posada | 3,0 s | sí | En el suelo: patas fuera, motores apagados, rampa abierta, luces a destiempo, ojos que miran alrededor |

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

## Cambios en el kit, el taller y las pruebas

- `kit.ts` (solo añade, no cambia nada de lo que ya había):
  - `punta(radio, alto, lados)`: pinchos, cristales, dientes y cuchillas con
    pocos lados. Cuesta 30 triángulos a detalle 0,45 (un `cono` cuesta 234).
  - `barra(padre, desde, hasta, radio, material)`: cápsula entre dos puntos.
  - `curva(t, claves)`: un valor por poses clave, con la misma aceleración que
    `poses`.
  - `porFotograma(raíz, duración, fn)`: muestrea una pose entera escrita en
    función del tiempo; lo usan las patas con cinemática inversa y los ciclos
    en fase con el juego.
- `referencias.ts`: `vista=tira&clip=…&n=…` (fotogramas de un clip en fila),
  `clip=…&t=…` (cualquier vista posada en un instante),
  `vista=grupo&modelos=a,b,c&celda=…`, y el encuadre ignora las piezas
  escondidas a escala casi 0.
- `test/modelos.test.ts`: comprueba también que los bucles cierran sin salto y
  que en la horda el golpe dura ≤ 0,4 s y la derrota ≤ 1,4 s y acaba en el
  suelo. La Baliza ya publicada acaba su derrota con la antena parabólica
  0,44 m bajo el suelo: queda anotada como excepción conocida.
