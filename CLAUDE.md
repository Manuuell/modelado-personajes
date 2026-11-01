# Guía para trabajar en este repo

Lee primero [CONTEXTO.md](CONTEXTO.md): el contrato con el juego y la lista de
personajes que faltan.

## Reglas

- Trabaja solo en este repositorio. `contexto-juego/` es una copia de solo
  lectura del juego: no la edites.
- Un personaje por archivo en `src/modelos/`, construido con los ayudantes de
  `kit.ts` (mira `recolector.ts` y `baliza.ts` como ejemplo). Regístralo en
  `src/modelos/index.ts` con su `tipo` (`horda` o `jefe`).
- Nombres, comentarios y textos en español, con el mismo tono y densidad de
  comentarios que los modelos existentes. Importaciones con extensión `.ts`
  (los tests cargan los módulos directamente en Node).
- Si cambias `kit.ts` o `tropa.ts`, que siga funcionando todo lo anterior: el
  juego usa los mismos archivos.
- Los NPC se montan sobre `gente.ts` (un archivo por NPC). Lo que hace cada
  cosa en la partida va en `src/contenido/mapa.ts`: solo datos y funciones
  puras, sin importar nada (lo carga también el servidor de voz).
- **Commits y PR sin líneas `Co-Authored-By`, sin "Generated with" ni ninguna
  marca de IA.** Mensajes normales, en inglés o en español, describiendo el
  cambio.

## Comprobar

```bash
npm install
npm run check      # tipos + pruebas de estructura, presupuesto y horneado
npm run dev        # taller en http://127.0.0.1:5174 (si hay navegador)
```

## Referencias e imágenes (si hay Chrome o Chromium)

Con `npm run dev` en marcha, `referencias.html` dibuja vistas limpias:

```bash
CH=chromium   # o la ruta de Chrome
$CH --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --hide-scrollbars \
  --window-size=2080,760 --virtual-time-budget=8000 \
  --screenshot=referencias/<id>-hoja.png "http://127.0.0.1:5174/referencias.html?modelo=<id>&vista=hoja"
```

- `vista=frente|tres-cuartos|lado|espalda` con `--window-size=1024,1024`.
- `vista=grupo` (`--window-size` = 520 × número de modelos, 760): todos juntos;
  `&modelos=a,b,c&celda=440` elige cuáles y el ancho de cada uno.
- `vista=tira&clip=<clip>&n=6` (o `&tiempos=0,0.5,1.2`) con `--window-size` =
  360 × fotogramas, 520: los fotogramas de un clip en fila, para revisar una
  animación. `&clip=<clip>&t=0.9` posa cualquier otra vista en ese instante.
- `?glb=<id>` con `--dump-dom` deja el GLB en base64 dentro de `<pre id="glb">`.

Si el entorno no tiene navegador, basta con `npm run check`.
