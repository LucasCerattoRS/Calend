import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bases = ['/run/media', '/media'];

function pendrive(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'calend-sync-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const destino = path.join(dir, 'disco-sintetico', 'Calendario');
  fs.mkdirSync(destino, { recursive: true });
  const executar = () => spawnSync('bash', [path.join(RAIZ, 'sync-pendrive.sh')], {
    encoding: 'utf8', env: { ...process.env, USER: `../..${dir}` },
  });
  return { dir, destino, executar };
}

const soLinux = { skip: process.platform !== 'linux' || !bases.some((base) => fs.existsSync(base)) };

test('atualizar o código preserva arquivos extras e dados guardados em codigo/', soLinux, (t) => {
  const { destino, executar } = pendrive(t);
  const codigo = path.join(destino, 'codigo');
  fs.mkdirSync(path.join(codigo, 'anotacoes'), { recursive: true });
  fs.writeFileSync(path.join(codigo, 'gerar.mjs'), 'CÓDIGO ANTIGO');
  const extras = ['dados.json', 'anotacoes/lembrete.txt'];
  for (const item of extras) fs.writeFileSync(path.join(codigo, item), 'PRESERVAR');
  const r = executar();
  assert.equal(r.status, 0, r.stderr);
  for (const item of extras) assert.equal(fs.readFileSync(path.join(codigo, item), 'utf8'), 'PRESERVAR');
  assert.equal(fs.readFileSync(path.join(codigo, 'gerar.mjs'), 'utf8'), fs.readFileSync(path.join(RAIZ, 'gerar.mjs'), 'utf8'));
});

test('codigo/ como link para outra pasta é recusado sem alterar o alvo', soLinux, (t) => {
  const { dir, destino, executar } = pendrive(t);
  const alvo = path.join(dir, 'outra-pasta');
  fs.mkdirSync(alvo);
  fs.writeFileSync(path.join(alvo, 'gerar.mjs'), 'PRESERVAR');
  fs.symlinkSync(alvo, path.join(destino, 'codigo'));
  const r = executar();
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /codigo.*link/i);
  assert.equal(fs.readFileSync(path.join(alvo, 'gerar.mjs'), 'utf8'), 'PRESERVAR');
  assert.ok(fs.lstatSync(path.join(destino, 'codigo')).isSymbolicLink());
});

test('arquivos de código ligados ao dado são substituídos sem sobrescrever o dado', soLinux, (t) => {
  const { destino, executar } = pendrive(t);
  const codigo = path.join(destino, 'codigo');
  fs.mkdirSync(codigo);
  const entrada = path.join(destino, 'dados.json');
  fs.writeFileSync(entrada, '{"eventos":[]}');
  fs.symlinkSync(entrada, path.join(codigo, 'template.html'));
  fs.linkSync(entrada, path.join(codigo, 'gerar.mjs'));
  const r = executar();
  assert.equal(r.status, 0, r.stderr);
  assert.equal(fs.readFileSync(entrada, 'utf8'), '{"eventos":[]}');
  assert.ok(!fs.lstatSync(path.join(codigo, 'template.html')).isSymbolicLink());
  assert.equal(fs.readFileSync(path.join(codigo, 'gerar.mjs'), 'utf8'), fs.readFileSync(path.join(RAIZ, 'gerar.mjs'), 'utf8'));
});

test('diretório no lugar de arquivo de código causa erro sem copiar para dentro dele', soLinux, (t) => {
  const { destino, executar } = pendrive(t);
  const ocupado = path.join(destino, 'codigo', 'gerar.mjs');
  fs.mkdirSync(ocupado, { recursive: true });
  fs.writeFileSync(path.join(ocupado, 'lembrete.txt'), 'PRESERVAR');
  const r = executar();
  assert.notEqual(r.status, 0);
  assert.deepEqual(fs.readdirSync(ocupado), ['lembrete.txt']);
  assert.equal(fs.readFileSync(path.join(ocupado, 'lembrete.txt'), 'utf8'), 'PRESERVAR');
});

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
