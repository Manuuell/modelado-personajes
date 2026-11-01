# Meta Space · Modelado de personajes

Personajes 3D y sus animaciones para [Meta Space](https://github.com/Manuuell/Meta-Space-),
hechos con piezas en código (Three.js): estilo toon con contorno, como en
Roblox. Cada modelo se exporta a GLB y se copia al juego tal cual.

![Personajes](referencias/estilo-conjunto.png)

![Jefes](referencias/jefes-conjunto.png)

![Mapa](referencias/mapa-conjunto.png)

![Mundo](referencias/mundo/hud-acido.jpg)

```bash
npm install
npm run dev     # taller: cada personaje con sus animaciones, en http://127.0.0.1:5174
                # y el mapa con la interfaz, en http://127.0.0.1:5174/mapa.html
npm run check   # tipos y pruebas de los modelos
```

- [CONTEXTO.md](CONTEXTO.md): la historia, el estilo, el contrato con el juego y lo que falta.
- [ESPEC.md](ESPEC.md): tamaño, nodos y clips de cada personaje, y los tiempos de ataque de los jefes.
- [MAPA.md](MAPA.md): altares de jefe y de desafío, cajas de premio, estructuras y la gente de Meta con la que se habla por voz.
- [MUNDO.md](MUNDO.md): el sector nuevo (montañas, mares de ácido de HELIOS, ruinas) y la interfaz del jugador.
- [prompts-modelos-3d.md](prompts-modelos-3d.md): prompts para generar los personajes con otras IA.
- [referencias/](referencias/): hojas de giro, vistas sueltas, tiras de ataques y GLB de los modelos.
