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

function gerar(dados, prefixo = '') {
  const entrada = path.join(TMP, 'dados.json');
  const saida = path.join(TMP, 'saida.html');
  fs.rmSync(saida, { force: true });
  fs.writeFileSync(entrada, prefixo + JSON.stringify(dados));
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

// Hora/minuto/segundo fora da faixa: "2026-03-01T99:99" passava no formato, o contador
// normalizava para 05/03 04:39 e a linha do tempo mostrava 01/03.
test('hora fora de 00–23 e minuto/segundo fora de 00–59 são recusados, com e sem hora', () => {
  const ev = (inicio) => gerar({ eventos: [{ nome: 'E', inicio }] });
  const med = (de) => gerar({ medicamentos: [{ nome: 'M', periodos: [{ de, dose: '1' }] }] });
  for (const t of ['2026-03-01T99:99', '2026-03-01T24:00', '2026-03-01T23:60', '2026-03-01T10:00:60', '2026-03-01T10:00:99']) {
    for (const r of [ev(t), med(t)]) {
      assert.equal(r.status, 1, t);
      assert.ok(!r.gerou, t);
    }
    assert.match(ev(t).stderr, /eventos\[0\].*inicio/);
  }
  const ate = gerar({ medicamentos: [{ nome: 'M', periodos: [{ de: '2026-03-01', ate: '2026-03-02T25:00', dose: '1' }] }] });
  assert.equal(ate.status, 1);
  assert.match(ate.stderr, /"ate" inválido/);
  for (const t of ['2026-03-01', '2026-03-01T00:00', '2026-03-01T23:59', '2026-03-01T23:59:59', '2026-03-01T00:00:00']) {
    assert.equal(ev(t).status, 0, t);
    assert.equal(med(t).status, 0, t);
  }
});

// Bloco de Notas do Windows grava UTF-8 com BOM; JSON.parse recusava o arquivo
// inteiro como "JSON inválido", embora o conteúdo estivesse correto.
test('dados.json com BOM UTF-8 é aceito', () => {
  const r = gerar({ eventos: [{ nome: 'E', inicio: '2000-01-01' }] }, '\uFEFF');
  assert.equal(r.status, 0, r.stderr);
  assert.ok(r.gerou);
});

// Sem `nome` (evento ou remédio) a página imprimia a palavra "undefined" no lugar do dado.
// Melhor recusar no build, dizendo onde. Dose de tipo errado (true) também é recusada.
test('evento/remédio sem nome e dose de tipo errado são recusados', () => {
  const casos = [
    [{ eventos: [{ inicio: '2026-03-01' }] }, /eventos\[0\].*"nome"/],
    [{ medicamentos: [{ periodos: [{ de: '2026-03-01', dose: '1' }] }] }, /medicamentos\[0\].*"nome"/],
    [{ eventos: [{ nome: '  ', inicio: '2026-03-01' }] }, /eventos\[0\].*"nome"/],
    [{ medicamentos: [{ nome: 'M', periodos: [{ de: '2026-03-01', dose: true }] }] }, /"dose"/],
  ];
  for (const [dados, esperado] of casos) {
    const r = gerar(dados);
    assert.equal(r.status, 1, JSON.stringify(dados));
    assert.match(r.stderr, esperado);
    assert.ok(!r.gerou);
  }
});

// `"dose": 2` (número, sem aspas) sempre funcionou: a página mostra "2". Um dados.json
// que já gerava a página não pode passar a ser recusado por isso.
test('dose e nome numéricos continuam aceitos', () => {
  for (const dados of [
    { medicamentos: [{ nome: 'M', periodos: [{ de: '2026-03-01', dose: 2 }] }] },
    { medicamentos: [{ nome: 'M', periodos: [{ de: '2026-03-01', dose: 0.5 }] }] },
    { medicamentos: [{ nome: 'M', periodos: [{ de: '2026-03-01', dose: 0 }] }] },
    { eventos: [{ nome: 2026, inicio: '2026-03-01' }] },
  ]) {
    const r = gerar(dados);
    assert.equal(r.status, 0, `${JSON.stringify(dados)}\n${r.stderr}`);
    assert.ok(r.gerou);
  }
});

// Dose ainda não dita (README: `confirmar`) é legítima. Período sem `dose`, com null ou ""
// continua gerando a página (como no main), agora sem a palavra "undefined".
test('período sem dose (ou vazia) continua aceito e não escreve "undefined"', () => {
  for (const periodo of [{ de: '2026-03-01' }, { de: '2026-03-01', dose: null }, { de: '2026-03-01', dose: '' }]) {
    const dados = { medicamentos: [{ nome: 'M', periodos: [periodo] }] };
    const r = gerar(dados);
    assert.equal(r.status, 0, `${JSON.stringify(dados)}\n${r.stderr}`);
    assert.ok(r.gerou);
    const html = fs.readFileSync(path.join(TMP, 'saida.html'), 'utf8');
    assert.match(html, /"dose": ""/, 'dose deveria ser gravada como texto vazio');
  }
});
