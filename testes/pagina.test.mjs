// Testa o <script> real da página com relógio fixo, em America/Sao_Paulo.
//   node --test testes/pagina.test.mjs
// Só dados inventados. O relógio (3º argumento do runner) é um instante absoluto;
// o TZ do processo filho decide o "horário local" que a página enxerga.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RUNNER = path.join(AQUI, 'pagina-runner.mjs');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'calend-pg-'));

function pagina(dados, agora, tz = 'America/Sao_Paulo', depois) {
  const f = path.join(TMP, 'd.json');
  fs.writeFileSync(f, JSON.stringify(dados));
  const r = spawnSync(process.execPath, [RUNNER, f, agora, ...(depois ? [depois] : [])], { encoding: 'utf8', env: { ...process.env, TZ: tz } });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout);
}
const med = (periodo) => ({ medicamentos: [{ nome: 'Rem', periodos: [{ dose: '1 cp', momento: 'manhã', ...periodo }] }] });

// Antes: "2026-03-01T08:00" <= "2026-03-01" é falso em texto -> o remédio sumia no dia em que começa.
test('período com hora em "de" já vale no dia do início', () => {
  const p = pagina(med({ de: '2026-03-01T08:00', ate: null }), '2026-03-01T09:00:00-03:00');
  assert.match(p.hojeMed, /Rem/);
  assert.match(p.hojeMed, /começa hoje/);
});

test('último dia (ate) ainda vale; no dia seguinte, não', () => {
  const dados = med({ de: '2026-02-20', ate: '2026-02-28' });
  assert.match(pagina(dados, '2026-02-28T23:50:00-03:00').hojeMed, /Rem.*último dia/);
  assert.match(pagina(dados, '2026-03-01T00:10:00-03:00').hojeMed, /Nenhum medicamento ativo/);
});

test('virada de ano: 31/12 23:59 ainda é 31/12; 00:01 já é 01/01', () => {
  const dados = med({ de: '2026-01-01', ate: null });
  assert.match(pagina(dados, '2025-12-31T23:59:00-03:00').hojeMed, /Nenhum/);
  assert.match(pagina(dados, '2026-01-01T00:01:00-03:00').hojeMed, /Rem/);
});

test('fevereiro bissexto: 29/02/2028 existe e 01/03 vem depois', () => {
  const dados = med({ de: '2028-02-29', ate: '2028-02-29' });
  assert.match(pagina(dados, '2028-02-29T12:00:00-03:00').hojeMed, /Rem/);
  assert.match(pagina(dados, '2028-03-01T12:00:00-03:00').hojeMed, /Nenhum/);
});

test('contador: 7 dias só no instante exato do início (hora de parede)', () => {
  const ev = { eventos: [{ nome: 'E', inicio: '2026-03-01T08:00' }] };
  assert.match(pagina(ev, '2026-03-08T07:59:00-03:00').contadores, /E 6 dias/);
  assert.match(pagina(ev, '2026-03-08T08:00:00-03:00').contadores, /E 7 dias/);
});

test('página aberta atualiza dias e marcos ao cruzar a hora de início', () => {
  const dados = { eventos: [
    { nome: 'E', inicio: '2026-03-01T08:00' },
    { nome: 'F', inicio: '2026-03-01T13:00' },
  ] };
  const p = pagina(dados, '2026-03-08T07:59:00-03:00', 'America/Sao_Paulo', '2026-03-08T08:00:00-03:00');
  assert.match(p.contadores, /E 7 dias.*rumo a 14 dias/);
  assert.match(p.contadores, /F 6 dias.*rumo a 7 dias/);
});

test('contador se recupera após suspensão e ajuste do relógio no mesmo dia', () => {
  const dados = { eventos: [{ nome: 'E', inicio: '2026-03-01T08:00' }] };
  assert.match(pagina(dados, '2026-03-08T07:00:00-03:00', 'America/Sao_Paulo', '2026-03-08T20:00:00-03:00').contadores, /E 7 dias/);
  assert.match(pagina(dados, '2026-03-08T08:00:00-03:00', 'America/Sao_Paulo', '2026-03-08T07:59:00-03:00').contadores, /E 6 dias/);
});

// Antes: o contador usava milissegundos; com o início num período de horário de
// verão (Brasil, até 2019) o dia virava 1 h fora do lugar.
test('contador não escorrega 1 h por causa de horário de verão antigo', () => {
  const ev = { eventos: [{ nome: 'E', inicio: '2018-12-01T12:00' }] };
  // 2026-10-16 11:30 (ainda não completou o dia 2876) vs 12:00 (completou).
  const a = pagina(ev, '2026-10-16T11:30:00-03:00').contadores;
  const b = pagina(ev, '2026-10-16T12:00:00-03:00').contadores;
  const n = Number(b.match(/E (\d+) dias/)[1]);
  assert.equal(n, 2876);
  assert.match(a, new RegExp(`E ${n - 1} dias`));
});

test('independe do fuso do computador: parede local, não UTC', () => {
  // 23:30 em São Paulo = 02:30 UTC do dia seguinte; a página no fuso de SP ainda está no dia 28.
  const dados = med({ de: '2026-02-28', ate: '2026-02-28' });
  assert.match(pagina(dados, '2026-02-28T23:30:00-03:00').hojeMed, /Rem/);
});

test('início na meia-noite suprimida pelo horário de verão preserva a hora de parede', () => {
  const ev = { eventos: [{ nome: 'E', inicio: '2018-11-04T00:00' }] };
  assert.match(pagina(ev, '2018-11-05T00:00:00-02:00').contadores, /E 1 dia/);
  assert.match(pagina(ev, '2018-11-05T00:30:00-02:00').contadores, /E 1 dia/);
});

// ---- calendário mensal, feriados e .ics ----
const SEM = { eventos: [], medicamentos: [] };

test('calendário marca feriados móveis a partir da Páscoa (2026: Páscoa 05/04)', () => {
  const abr = pagina(SEM, '2026-04-10T12:00:00-03:00').calendario;
  assert.match(abr, /03\/04 Sexta-feira Santa/);
  assert.match(abr, /05\/04 Páscoa/);
  assert.match(abr, /21\/04 Tiradentes/);
  const fev = pagina(SEM, '2026-02-10T12:00:00-03:00').calendario;
  assert.match(fev, /16\/02 Carnaval/);
  assert.match(fev, /17\/02 Carnaval/);
  assert.match(pagina(SEM, '2026-06-10T12:00:00-03:00').calendario, /04\/06 Corpus Christi/);
});

test('calendário mostra evento, aniversário do evento, marco em dias e data pessoal anual', () => {
  const dados = {
    eventos: [{ nome: 'Trabalho na Msul Móveis', inicio: '2023-03-01', cor: 'verde' }],
    datas: [{ nome: 'Vence o domínio', data: '2020-10-06', repete: 'anual' }, { nome: 'Prova única', data: '2026-03-10' }],
  };
  const mar = pagina(dados, '2026-03-15T12:00:00-03:00').calendario;
  assert.match(mar, /01\/03 Trabalho na Msul Móveis: 3 anos/);
  assert.match(mar, /10\/03 Prova única/);
  assert.match(pagina(dados, '2023-03-15T12:00:00-03:00').calendario, /01\/03 Trabalho na Msul Móveis/);
  assert.match(pagina(dados, '2027-10-15T12:00:00-03:00').calendario, /06\/10 Vence o domínio/);
  assert.doesNotMatch(pagina(dados, '2027-03-15T12:00:00-03:00').calendario, /Prova única/);
});

test('data anual de 29/02 cai em 28/02 nos anos sem dia 29', () => {
  const dados = { datas: [{ nome: 'Bissexta', data: '2024-02-29', repete: 'anual' }] };
  assert.match(pagina(dados, '2027-02-10T12:00:00-03:00').calendario, /28\/02 Bissexta/);
  assert.match(pagina(dados, '2028-02-10T12:00:00-03:00').calendario, /29\/02 Bissexta/);
});

test('.ics tem feriados, eventos e datas, e NÃO tem remédio (dado de saúde)', () => {
  const dados = {
    eventos: [{ nome: 'Msul', inicio: '2023-03-01' }],
    medicamentos: [{ nome: 'RemSecreto', periodos: [{ de: '2026-01-01', ate: null, dose: '1' }] }],
  };
  const f = path.join(TMP, 'ics.json');
  fs.writeFileSync(f, JSON.stringify(dados));
  const r = spawnSync(process.execPath, [RUNNER, f, '2026-03-15T12:00:00-03:00'], { encoding: 'utf8', env: { ...process.env, TZ: 'America/Sao_Paulo', ICS: '1' } });
  assert.equal(r.status, 0, r.stderr);
  const ics = JSON.parse(r.stdout).ics.replace(/\r\n /g, '');
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.match(ics, /SUMMARY:Natal/);
  assert.match(ics, /SUMMARY:Msul/);
  assert.match(ics, /DTSTART;VALUE=DATE:20230301/);
  assert.doesNotMatch(ics, /RemSecreto/);
});
