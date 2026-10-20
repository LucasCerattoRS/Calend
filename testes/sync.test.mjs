import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bases = ['/run/media', '/media'];

test('sincronizar a partir do próprio destino preserva código e dados', {
  skip: process.platform !== 'linux' || !bases.some((base) => fs.existsSync(base)),
}, (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'calend-sync-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const destino = path.join(dir, 'disco-sintetico', 'Calendario');
  const codigo = path.join(destino, 'codigo');
  fs.mkdirSync(codigo, { recursive: true });
  const itens = ['gerar.mjs', 'template.html', 'README.md', 'dados.exemplo.json', 'sync-pendrive.sh', '.gitignore'];
  for (const item of itens) fs.copyFileSync(path.join(RAIZ, item), path.join(codigo, item));
  const entrada = path.join(destino, 'dados.json');
  const dados = '{"eventos":[]}';
  fs.writeFileSync(entrada, dados);

  // As duas bases passam a resolver exclusivamente para a pasta temporária.
  const usuario = `../..${dir}`;
  for (const base of bases) {
    if (fs.existsSync(base)) assert.equal(fs.realpathSync(`${base}/${usuario}`), fs.realpathSync(dir));
  }
  const r = spawnSync('bash', [path.join(codigo, 'sync-pendrive.sh')], {
    encoding: 'utf8', env: { ...process.env, USER: usuario },
  });
  for (const item of itens) {
    assert.ok(fs.existsSync(path.join(codigo, item)), `${item} foi apagado`);
    assert.equal(fs.readFileSync(path.join(codigo, item), 'utf8'), fs.readFileSync(path.join(RAIZ, item), 'utf8'));
  }
  assert.equal(fs.readFileSync(entrada, 'utf8'), dados);
  assert.equal(r.status, 0, r.stderr);
});

test('sincronização inicial sem dados.json termina com sucesso', {
  skip: process.platform !== 'linux' || !bases.some((base) => fs.existsSync(base)),
}, (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'calend-sync-vazio-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const destino = path.join(dir, 'disco-sintetico', 'Calendario');
  fs.mkdirSync(destino, { recursive: true });
  const usuario = `../..${dir}`;
  for (const base of bases) {
    if (fs.existsSync(base)) assert.equal(fs.realpathSync(`${base}/${usuario}`), fs.realpathSync(dir));
  }
  const r = spawnSync('bash', [path.join(RAIZ, 'sync-pendrive.sh')], {
    encoding: 'utf8', env: { ...process.env, USER: usuario },
  });
  assert.ok(fs.existsSync(path.join(destino, 'codigo', 'gerar.mjs')));
  assert.ok(!fs.existsSync(path.join(destino, 'dados.json')));
  assert.equal(r.status, 0, r.stderr);
});
