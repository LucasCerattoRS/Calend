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

// Data que não existe: "2026-02-30" virava 2 de março e "2026-13-01" virava "Invalid Date".
test('data inexistente no calendário é recusada', () => {
  for (const de of ['2026-02-30', '2026-13-01', '2027-02-29']) {
    const r = gerar({ medicamentos: [{ nome: 'M', periodos: [{ de, dose: '1' }] }] });
    assert.equal(r.status, 1, de);
    assert.match(r.stderr, /"de" ausente ou inválido/);
  }
  assert.equal(gerar({ medicamentos: [{ nome: 'M', periodos: [{ de: '2028-02-29', dose: '1' }] }] }).status, 0);
});

// Antes `ate` não era validado: "10/03/2026" fica > "2026-…" em texto e o remédio
// sumia de "hoje" (ou, em outros formatos, nunca encerrava).
test('"ate" fora do formato ou antes do "de" é recusado; null fica em aberto', () => {
  const com = (ate) => gerar({ medicamentos: [{ nome: 'M', periodos: [{ de: '2026-03-01', ate, dose: '1' }] }] });
  assert.equal(com('10/03/2026').status, 1);
  assert.match(com('10/03/2026').stderr, /"ate" inválido/);
  assert.equal(com('2026-02-28').status, 1);
  assert.match(com('2026-02-28').stderr, /anterior a "de"/);
  assert.equal(com(null).status, 0);
  assert.equal(com('2026-03-01').status, 0);
});
