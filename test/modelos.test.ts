import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { CATALOGO } from '../src/modelos/index.ts';
import { conDetalle, medir } from '../src/modelos/kit.ts';
import { Tropa } from '../src/modelos/tropa.ts';

// Lo que el juego necesita de cada modelo, comprobado sin navegador ni GPU.

/** Triángulos máximos en el juego (horda a detalle 0,45; el resto a detalle 1). */
const PRESUPUESTO = { horda: 6500, jefe: 30000, jugador: 30000, escena: 30000 };

for (const entrada of CATALOGO) {
  test(`${entrada.id}: nodos con nombre único y animaciones que apuntan a ellos`, () => {
    const m = entrada.crear();
    const nombres = new Map<string, number>();
    m.raiz.traverse((o) => { if (o.name) nombres.set(o.name, (nombres.get(o.name) ?? 0) + 1); });
    for (const [nombre, veces] of nombres) assert.equal(veces, 1, `el nodo «${nombre}» está repetido`);

    assert.ok(m.animaciones.length > 0, 'sin animaciones');
    const clips = new Set<string>();
    for (const a of m.animaciones) {
      assert.ok(!clips.has(a.clip.name), `clip repetido: ${a.clip.name}`);
      clips.add(a.clip.name);
      assert.ok(a.clip.duration > 0 && a.clip.duration <= 4, `${a.clip.name}: duración ${a.clip.duration}`);
      for (const pista of a.clip.tracks) {
        const nodo = pista.name.split('.')[0];
        assert.ok(nombres.has(nodo), `${a.clip.name}: la pista ${pista.name} apunta a un nodo que no existe`);
        assert.ok([...pista.values].every(Number.isFinite), `${a.clip.name}: ${pista.name} tiene valores no numéricos`);
      }
    }
  });

  test(`${entrada.id}: cabe en el presupuesto de triángulos`, () => {
    const tipo = entrada.tipo ?? 'horda';
    const m = tipo === 'horda' ? conDetalle(0.45, entrada.crear) : entrada.crear();
    const { triangulos } = medir(m.raiz);
    assert.ok(triangulos <= PRESUPUESTO[tipo], `${triangulos} triángulos (máximo ${PRESUPUESTO[tipo]} para ${tipo})`);
  });

  test(`${entrada.id}: se hornea para la horda sin valores raros`, () => {
    const m = entrada.crear();
    const escena = new THREE.Scene();
    const tropa = new Tropa(escena, entrada.crear, 4, m.animaciones.map((a) => a.clip.name));
    const mundo = new THREE.Matrix4();
    tropa.empezar();
    for (const a of m.animaciones) tropa.poner(mundo, a.clip.name, a.clip.duration / 2);
    tropa.terminar();
    escena.traverse((o) => {
      if (o instanceof THREE.InstancedMesh) {
        assert.ok([...o.instanceMatrix.array].every(Number.isFinite), 'matriz horneada con NaN');
      }
    });
  });
}
