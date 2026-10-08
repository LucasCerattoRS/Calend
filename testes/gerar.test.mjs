// Teste do gerar.mjs com o test runner nativo do Node (sem dependência):
//   node --test testes/gerar.test.mjs
// Só usa dados inventados, gravados numa pasta temporária.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const GERAR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'gerar.mjs');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'calend-'));

function gerar(dados) {
  const entrada = path.join(TMP, 'dados.json');
  const saida = path.join(TMP, 'saida.html');
  fs.rmSync(saida, { force: true });
  fs.writeFileSync(entrada, JSON.stringify(dados));
  const r = spawnSync(process.execPath, [GERAR, entrada, saida], { encoding: 'utf8' });
  return { ...r, gerou: fs.existsSync(saida) };
}

test('dado válido gera a página', () => {
  const r = gerar({ eventos: [{ nome: 'E', inicio: '2000-01-01T00:00' }],
    medicamentos: [{ nome: 'M', periodos: [{ de: '2000-01-01', ate: null, dose: '1' }] }] });
  assert.equal(r.status, 0, r.stderr);
  assert.ok(r.gerou);
});

// Sem o `inicio`, o script da página lança TypeError no 1º evento e TODAS as
// seções ficam em branco (remédios inclusive). Tem que barrar no build.
test('evento sem inicio é recusado no build', () => {
  const r = gerar({ eventos: [{ nome: 'E' }] });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /eventos\[0\].*inicio/);
  assert.ok(!r.gerou);
});

// Sem o `de`, o período some em silêncio (e com dois deles a ordenação quebra).
test('período sem "de" é recusado no build', () => {
  const r = gerar({ medicamentos: [{ nome: 'M', periodos: [{ dose: '1' }, { dose: '2' }] }] });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /medicamentos\[0\]\.periodos\[0\].*de/);
  assert.ok(!r.gerou);
});
