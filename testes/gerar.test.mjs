// Teste do gerar.mjs com o test runner nativo do Node (sem dependência):
//   node --test testes/gerar.test.mjs
// Só usa dados inventados, gravados numa pasta temporária.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const GERAR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'gerar.mjs');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'calend-'));
const dadosDaPagina = (html) => vm.runInNewContext(`(${html.match(/\/\*DADOS\*\/[\s\S]*?\/\*FIM\*\//)[0]})`);

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

test('chave __proto__ do JSON não introduz eventos herdados na página', () => {
  const dados = JSON.parse('{"__proto__":{"eventos":[{"nome":"Fantasma","inicio":"2000-01-01"}]}}');
  const r = gerar(dados);
  assert.equal(r.status, 0, r.stderr);
  const html = fs.readFileSync(path.join(TMP, 'saida.html'), 'utf8');
  const script = html.match(/<script>([\s\S]*)<\/script>/)[1];
  const els = {};
  const ctx = {
    document: {
      getElementById: (id) => els[id] ??= { querySelectorAll: () => [] },
      querySelectorAll: () => [],
    },
    setInterval: () => 0,
    requestAnimationFrame: () => 0,
    location: { reload() {} },
  };
  vm.runInNewContext(script, ctx);
  assert.match(els.contadores.innerHTML, /Nenhum evento registrado/);
  assert.doesNotMatch(els.historico.innerHTML, /Fantasma/);
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
    assert.equal(dadosDaPagina(html).medicamentos[0].periodos[0].dose, '', 'dose deveria ser gravada como texto vazio');
  }
});

// `eventos`, `medicamentos` ou `periodos` que não são lista derrubavam o gerar.mjs com stack
// trace (TypeError: forEach is not a function). Agora: mensagem dizendo onde, nada gerado.
// Ausente ou null continua valendo como lista vazia.
test('eventos/medicamentos/periodos que não são lista são recusados com mensagem clara', () => {
  const casos = [];
  for (const ruim of [{}, 'texto', 3, true]) {
    casos.push([{ eventos: ruim }, /"eventos": precisa ser uma lista/]);
    casos.push([{ medicamentos: ruim }, /"medicamentos": precisa ser uma lista/]);
    casos.push([{ medicamentos: [{ nome: 'M', periodos: ruim }] }, /medicamentos\[0\]\.periodos \("M"\): precisa ser uma lista/]);
  }
  for (const [dados, esperado] of casos) {
    const r = gerar(dados);
    assert.equal(r.status, 1, JSON.stringify(dados));
    assert.match(r.stderr, esperado);
    assert.match(r.stderr, /Nada foi gerado/);
    assert.doesNotMatch(r.stderr, /TypeError|\n\s+at /, 'não deveria vazar stack trace');
    assert.ok(!r.gerou);
  }
  for (const dados of [{}, { eventos: null, medicamentos: null }, { medicamentos: [{ nome: 'M', periodos: null }] }, { medicamentos: [{ nome: 'M' }] }]) {
    const r = gerar(dados);
    assert.equal(r.status, 0, `${JSON.stringify(dados)}\n${r.stderr}`);
    assert.ok(r.gerou);
  }
});

test('pendências fora do formato são recusadas antes de gerar uma página quebrada', () => {
  for (const confirmar of ['conferir item', {}, 1, true, [{ toString: null }]]) {
    const r = gerar({ confirmar });
    assert.equal(r.status, 1, JSON.stringify(confirmar));
    assert.match(r.stderr, /confirmar/);
    assert.doesNotMatch(r.stderr, /TypeError|\n\s+at /);
    assert.ok(!r.gerou);
  }
  for (const confirmar of [undefined, null, [], ['Conferir item'], [2]]) {
    assert.equal(gerar({ confirmar }).status, 0);
  }
});

const VALIDO = { eventos: [{ nome: 'E', inicio: '2000-01-01' }] };
const sobras = (dir) => fs.readdirSync(dir).filter((n) => n.endsWith('.tmp'));

test('falha em todos os destinos retorna erro sem anunciar página disponível', () => {
  const dir = fs.mkdtempSync(path.join(TMP, 'sem-saida-'));
  const entrada = path.join(dir, 'dados.json');
  const saida = path.join(dir, 'ocupado');
  fs.writeFileSync(entrada, JSON.stringify(VALIDO));
  fs.mkdirSync(saida);
  const r = spawnSync(process.execPath, [GERAR, entrada, saida], { encoding: 'utf8' });
  assert.equal(r.status, 1, r.stderr);
  assert.match(r.stderr, /não deu pra escrever/);
  assert.doesNotMatch(r.stdout, /gerado:|Abra com 2 cliques/);
  assert.ok(fs.statSync(saida).isDirectory());
  assert.deepEqual(sobras(dir), []);
});

test('saída igual à entrada preserva o JSON e retorna erro', () => {
  const dir = fs.mkdtempSync(path.join(TMP, 'entrada-saida-'));
  const entrada = path.join(dir, 'dados.json');
  const original = JSON.stringify(VALIDO);
  fs.writeFileSync(entrada, original);
  const r = spawnSync(process.execPath, [GERAR, entrada, path.join(dir, '.', 'dados.json')], { encoding: 'utf8' });
  assert.equal(fs.readFileSync(entrada, 'utf8'), original, 'a entrada não pode virar HTML');
  assert.equal(r.status, 1, r.stderr);
  assert.match(r.stderr, /entrada|dados\.json/);
  assert.deepEqual(sobras(dir), []);
});

test('temporário preexistente não é seguido, sobrescrito nem removido', { skip: process.platform === 'win32' }, () => {
  const dir = fs.mkdtempSync(path.join(TMP, 'temporario-ocupado-'));
  const entrada = path.join(dir, 'dados.json');
  const saida = path.join(dir, 'saida.html');
  const alvo = path.join(dir, 'outro.txt');
  fs.writeFileSync(entrada, JSON.stringify(VALIDO));
  fs.writeFileSync(saida, 'PÁGINA ANTERIOR');
  fs.writeFileSync(alvo, 'CONTEÚDO PRESERVADO');
  const script = `
    const fs = require('node:fs');
    const path = require('node:path');
    const [gerar, entrada, saida, alvo] = process.argv.slice(1);
    fs.symlinkSync(alvo, path.join(path.dirname(saida), '.saida.html.' + process.pid + '.tmp'));
    process.argv = [process.execPath, gerar, entrada, saida];
    import(require('node:url').pathToFileURL(gerar).href);
  `;
  const r = spawnSync(process.execPath, ['-e', script, GERAR, entrada, saida, alvo], { encoding: 'utf8' });
  assert.ok(fs.readFileSync(alvo, 'utf8') === 'CONTEÚDO PRESERVADO', 'o link não pode causar escrita em outro arquivo');
  assert.equal(r.status, 1, r.stderr);
  assert.equal(fs.readFileSync(saida, 'utf8'), 'PÁGINA ANTERIOR');
  assert.equal(sobras(dir).length, 1, 'o temporário de terceiros não deve ser removido');
  assert.ok(fs.lstatSync(path.join(dir, sobras(dir)[0])).isSymbolicLink());
});

// Escrita não atômica: o writeFileSync trunca o arquivo antes de gravar, então uma falha no
// meio (disco cheio, pendrive arrancado) deixava a página pela metade. Simulado com limite de
// tamanho de arquivo (ulimit -f): no código antigo o Calendario.html ficava com 2048 bytes.
test('falha no meio da escrita mantém a página anterior íntegra e não deixa .tmp', { skip: process.platform === 'win32' }, () => {
  const dir = fs.mkdtempSync(path.join(TMP, 'atomico-'));
  const entrada = path.join(dir, 'dados.json');
  const saida = path.join(dir, 'Calendario.html');
  const anterior = 'PAGINA ANTERIOR ÍNTEGRA\n';
  fs.writeFileSync(entrada, JSON.stringify(VALIDO));
  fs.writeFileSync(saida, anterior);
  const r = spawnSync('sh', ['-c', 'ulimit -f 4; exec "$0" "$@"', process.execPath, GERAR, entrada, saida], { encoding: 'utf8' });
  assert.match(r.stderr, /não deu pra escrever/, r.stderr);
  assert.equal(fs.readFileSync(saida, 'utf8'), anterior);
  assert.deepEqual(sobras(dir), []);
});

// Modo normal grava em DOIS destinos (pasta do dados.json e pasta do código). Se o segundo
// falhar (aqui: no lugar do Calendario.html há uma pasta), o primeiro sai completo, o segundo
// fica como estava e não sobra temporário em nenhum dos dois.
test('dois destinos: falha no segundo não estraga o primeiro nem deixa .tmp', () => {
  const base = fs.mkdtempSync(path.join(TMP, 'dois-'));
  const app = path.join(base, 'app');
  const pen = path.join(base, 'pen');
  fs.mkdirSync(app);
  fs.mkdirSync(pen);
  const raiz = path.dirname(GERAR);
  fs.copyFileSync(GERAR, path.join(app, 'gerar.mjs'));
  fs.copyFileSync(path.join(raiz, 'template.html'), path.join(app, 'template.html'));
  fs.mkdirSync(path.join(app, 'Calendario.html', 'ocupado'), { recursive: true });
  const entrada = path.join(pen, 'dados.json');
  fs.writeFileSync(entrada, JSON.stringify(VALIDO));
  fs.writeFileSync(path.join(pen, 'Calendario.html'), 'ANTIGA');
  const r = spawnSync(process.execPath, [path.join(app, 'gerar.mjs'), entrada], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const html = fs.readFileSync(path.join(pen, 'Calendario.html'), 'utf8');
  assert.equal(dadosDaPagina(html).eventos[0].nome, 'E');
  assert.match(html, /<\/html>\s*$/);
  assert.match(r.stderr, /não deu pra escrever em .*app/);
  assert.ok(fs.statSync(path.join(app, 'Calendario.html')).isDirectory());
  assert.deepEqual(sobras(app), []);
  assert.deepEqual(sobras(pen), []);
});

test('período que não é objeto (true) vira erro de validação, não TypeError', () => {
  const r = gerar({ medicamentos: [{ nome: 'M', periodos: [true] }] });
  assert.equal(r.status, 1);
  assert.ok(!r.gerou);
  assert.match(r.stderr, /periodos\[0\].*objeto/);
  assert.doesNotMatch(r.stderr, /TypeError/);
});

test('regerar por cima de um HTML 0600 mantém a permissão restrita', { skip: process.platform === 'win32' }, () => {
  const dados = { eventos: [{ nome: 'E', inicio: '2000-01-01T00:00' }] };
  const saida = path.join(TMP, 'saida.html');
  const umaskAntes = process.umask(0o022); // o filho herda: com 022 o temporário nasceria 0644 sem a correção
  try {
    gerar(dados);
    fs.chmodSync(saida, 0o600);
    const entrada = path.join(TMP, 'dados.json');
    const r = spawnSync(process.execPath, [GERAR, entrada, saida], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    assert.equal(fs.statSync(saida).mode & 0o777, 0o600);
  } finally { process.umask(umaskAntes); }
});
