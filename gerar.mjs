// gerar.mjs — junta o template com o dados.json e escreve um Calendario.html
// autocontido (um arquivo só, sem internet, sem instalar nada: abre com 2 cliques
// no Linux e no Windows). A página recalcula tudo a partir da data do dia, então
// só é preciso rodar isto de novo quando MUDAR remédio, dose ou evento.
//
//   node gerar.mjs [dados.json] [saida.html]
//
// Sem argumentos, procura o pendrive. O dados.json tem informação de saúde:
// vive no pendrive e nunca entra no git (ver .gitignore).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.dirname(fileURLToPath(import.meta.url));

// Procura a pasta Calendario em qualquer pendrive montado (a letra/rótulo muda).
function acharNoPendrive() {
  const bases = process.platform === 'win32'
    ? 'DEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((l) => `${l}:\\`)
    : [`/run/media/${os.userInfo().username}`, `/media/${os.userInfo().username}`];

  for (const base of bases) {
    let filhos = [];
    if (process.platform === 'win32') {
      filhos = fs.existsSync(base) ? [base] : [];
    } else {
      try { filhos = fs.readdirSync(base).map((n) => path.join(base, n)); } catch { continue; }
    }
    for (const dir of filhos) {
      const alvo = path.join(dir, 'Calendario', 'dados.json');
      if (fs.existsSync(alvo)) return alvo;
    }
  }
  return null;
}

const entrada = process.argv[2] || acharNoPendrive() || path.join(RAIZ, 'dados.json');
if (!fs.existsSync(entrada)) {
  console.error(`Não achei o dados.json em: ${entrada}`);
  console.error('Plugue o pendrive, ou passe o caminho: node gerar.mjs /caminho/dados.json');
  process.exit(1);
}

let dados;
try {
  // Bloco de Notas do Windows salva com BOM (U+FEFF), que o JSON.parse não aceita.
  dados = JSON.parse(fs.readFileSync(entrada, 'utf8').replace(/^\uFEFF/, ''));
} catch (e) {
  console.error(`O ${entrada} não é um JSON válido: ${e.message}`);
  console.error('Confira vírgula sobrando, aspas e chaves — o dado não foi tocado.');
  process.exit(1);
}
if (!dados || typeof dados !== 'object' || Array.isArray(dados)) {
  console.error(`O ${entrada} precisa ser um objeto { … } com eventos/medicamentos.`);
  process.exit(1);
}

// As datas são a única coisa que a página não sabe contornar: evento sem `inicio`
// derruba o script inteiro (todas as seções em branco) e período sem `de` some em
// silêncio. Melhor recusar aqui, dizendo onde está, do que gerar uma página muda.
// Também confere que a data EXISTE no calendário: "2026-02-30" viraria 2 de março na
// página e "2026-13-01" viraria "Invalid Date". E o `ate`, quando preenchido, tem o
// mesmo formato (um "31/10/2026" ali mantinha o remédio fora de "hoje" para sempre).
// Hora 00–23, minuto e segundo 00–59: "T99:99" passava e o contador normalizava para
// outro dia (05/03 04:39) enquanto a linha do tempo mostrava 01/03.
const DATA = /^\d{4}-\d{2}-\d{2}(T([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?)?$/;
const dataReal = (t) => {
  if (typeof t !== 'string' || !DATA.test(t)) return false;
  const [a, m, d] = t.slice(0, 10).split('-').map(Number);
  const x = new Date(Date.UTC(a, m - 1, d));
  return x.getUTCFullYear() === a && x.getUTCMonth() === m - 1 && x.getUTCDate() === d;
};
const faltas = [];
// Sem `nome` a página escreveria a palavra "undefined" no lugar do dado.
// Número (`"dose": 2`) é aceito: a página sempre o mostrou certo.
const texto = (v) => (typeof v === 'string' && v.trim() !== '') || (typeof v === 'number' && Number.isFinite(v));
const textoOpcional = (v, onde) => {
  if (v != null && typeof v !== 'string' && !(typeof v === 'number' && Number.isFinite(v))) {
    faltas.push(`${onde}: precisa ser texto, número ou null`);
  }
};
// `eventos`, `medicamentos` e `periodos` têm de ser lista. Ausente ou null continua
// valendo como lista vazia; `{}`, texto ou número derrubavam o script com stack trace.
const tipo = (v) => (typeof v === 'string' ? 'texto' : typeof v === 'number' ? 'número'
  : typeof v === 'boolean' ? 'verdadeiro/falso' : 'objeto { … }');
const lista = (v, onde) => {
  if (v === undefined || v === null) return [];
  if (Array.isArray(v)) return v;
  faltas.push(`${onde}: precisa ser uma lista [ … ] (veio ${tipo(v)}) — use [] se não houver nenhum`);
  return [];
};
lista(dados.confirmar, '"confirmar"').forEach((item, i) => {
  if (!texto(item)) faltas.push(`confirmar[${i}]: precisa ser texto (ou número) não vazio`);
});
lista(dados.eventos, '"eventos"').forEach((ev, i) => {
  const nome = texto(ev?.nome) ? ev.nome : '?';
  if (!texto(ev?.nome)) faltas.push(`eventos[${i}]: "nome" ausente ou vazio — texto (ou número) obrigatório`);
  for (const campo of ['obs', 'cor']) textoOpcional(ev?.[campo], `eventos[${i}].${campo}`);
  if (!dataReal(ev?.inicio)) faltas.push(`eventos[${i}] ("${nome}"): "inicio" ausente ou inválido — use AAAA-MM-DD ou AAAA-MM-DDThh:mm (data que exista)`);
});
// `datas`: marcos pessoais no calendário (aniversário, vencimento…). `repete: "anual"`
// faz a data valer todo ano; sem ele vale só naquele dia.
lista(dados.datas, '"datas"').forEach((d, i) => {
  const nome = texto(d?.nome) ? d.nome : '?';
  if (!texto(d?.nome)) faltas.push(`datas[${i}]: "nome" ausente ou vazio — texto (ou número) obrigatório`);
  for (const campo of ['obs', 'cor']) textoOpcional(d?.[campo], `datas[${i}].${campo}`);
  if (!dataReal(d?.data)) faltas.push(`datas[${i}] ("${nome}"): "data" ausente ou inválida — use AAAA-MM-DD (data que exista)`);
  if (d?.repete != null && d.repete !== 'anual') faltas.push(`datas[${i}] ("${nome}"): "repete" só aceita "anual" (ou omita)`);
});
lista(dados.medicamentos, '"medicamentos"').forEach((m, i) => {
  const nome = texto(m?.nome) ? m.nome : '?';
  if (!texto(m?.nome)) faltas.push(`medicamentos[${i}]: "nome" ausente ou vazio — texto (ou número) obrigatório`);
  textoOpcional(m?.apresentacao, `medicamentos[${i}].apresentacao`);
  lista(m?.periodos, `medicamentos[${i}].periodos ("${nome}")`).forEach((p, j) => {
    const onde = `medicamentos[${i}].periodos[${j}] ("${nome}")`;
    // Dose ainda não dita (ver `confirmar` no README) é legítima: período sem `dose`, com
    // null ou "" vira texto vazio — a página mostra vazio em vez de "undefined" e o build
    // continua aceitando o dados.json que já funcionava. Só tipo errado (true, {}, []) é recusado.
    // Período que nem é objeto (true, 3, "x") não aceita `p.dose = ''` (TypeError): recusa antes.
    if (p === null || typeof p !== 'object' || Array.isArray(p)) { faltas.push(`${onde}: precisa ser um objeto { de, ate, dose } (veio ${Array.isArray(p) ? 'lista' : p === null ? 'nulo' : tipo(p)})`); return; }
    for (const campo of ['nota', 'momento']) textoOpcional(p[campo], `${onde}.${campo}`);
    if (p && (p.dose === undefined || p.dose === null || p.dose === '')) p.dose = '';
    else if (!texto(p?.dose)) faltas.push(`${onde}: "dose" inválida — use texto, número ou deixe vazia ("")`);
    if (!dataReal(p?.de)) faltas.push(`${onde}: "de" ausente ou inválido — use AAAA-MM-DD (data que exista)`);
    if (p.ate != null && p.ate !== '' && !dataReal(p.ate)) faltas.push(`${onde}: "ate" inválido — use AAAA-MM-DD ou null (em aberto)`);
    else if (p?.ate && dataReal(p?.de) && p.ate.slice(0, 10) < p.de.slice(0, 10)) faltas.push(`${onde}: "ate" (${p.ate}) é anterior a "de" (${p.de})`);
  });
});
if (faltas.length) {
  console.error(`O ${entrada} tem campo obrigatório faltando ou fora do formato:`);
  faltas.forEach((f) => console.error(`  - ${f}`));
  console.error('Nada foi gerado — corrija o dados.json e rode de novo.');
  process.exit(1);
}

// Escreve nos DOIS lugares: no pendrive (junto do dado, pra abrir em qualquer
// máquina) e aqui na pasta pessoal (pra abrir sem precisar do pendrive plugado).
// São só cópias de leitura — o dado de verdade continua sendo um só, o dados.json.
// Exceção: rodando de <pendrive>/Calendario/codigo, a "pasta pessoal" seria o
// próprio codigo/ — aí uma cópia só, pra não duplicar a página dentro do pendrive.
const raizEhCodigoDoPendrive =
  path.resolve(RAIZ) === path.resolve(path.dirname(entrada), 'codigo');
const saidas = process.argv[3]
  ? [process.argv[3]]
  : [...new Set([
    path.join(path.dirname(entrada), 'Calendario.html'),
    ...(raizEhCodigoDoPendrive ? [] : [path.join(RAIZ, 'Calendario.html')]),
  ])];

const template = fs.readFileSync(path.join(RAIZ, 'template.html'), 'utf8');
const marcador = /\/\*DADOS\*\/[\s\S]*?\/\*FIM\*\//;
if (!marcador.test(template)) {
  console.error('O template.html perdeu o marcador /*DADOS*/.../*FIM*/ — não dá pra injetar.');
  process.exit(1);
}

// JSON.parse mantém __proto__ como dado; escapar < impede que texto vire marcação HTML.
const json = JSON.stringify(JSON.stringify(dados)).replace(/</g, '\\u003c');
// Função (não string) no replace: senão o `$&`, `` $` ``, `$'`, `$$` que por acaso
// existissem no JSON virariam referências e corromperiam a página em silêncio.
const html = template.replace(marcador, () => `/*DADOS*/JSON.parse(${json})/*FIM*/`);
let geradas = 0;
for (const saida of saidas) {
  let tmp = null;
  try {
    if (fs.existsSync(saida) && fs.realpathSync(saida) === fs.realpathSync(entrada)) {
      throw new Error('a saída não pode sobrescrever o arquivo de entrada');
    }
    fs.mkdirSync(path.dirname(saida), { recursive: true });
    // Escrita atômica: grava num temporário NA MESMA PASTA e só então renomeia por cima.
    // Se faltar espaço ou o pendrive sair no meio, a página anterior continua inteira —
    // nunca fica um Calendario.html pela metade.
    tmp = path.join(path.dirname(saida), `.${path.basename(saida)}.${process.pid}.tmp`);
    // Página com dado de saúde: se o destino já existe com permissão restrita (0600), o temporário já NASCE com ela
    // (sem janela 0644 legível por outros) e a troca não acontece se não der pra aplicá-la. Destino novo: permissão padrão.
    let modo;
    try { modo = fs.statSync(saida).mode & 0o777; } catch (e) { if (e.code !== 'ENOENT') throw e; }
    try {
      fs.writeFileSync(tmp, html, { encoding: 'utf8', flush: true, mode: modo, flag: 'wx' });
    } catch (e) {
      if (e.code === 'EEXIST') tmp = null; // pertence a outro processo; não remover
      throw e;
    }
    if (modo !== undefined) fs.chmodSync(tmp, modo); // a umask pode ter tirado bits de `mode`
    fs.renameSync(tmp, saida);
    tmp = null;
    geradas++;
    console.log(`Calendario.html gerado: ${saida}`);
  } catch (e) {
    if (tmp) try { fs.rmSync(tmp, { force: true }); } catch { /* sem o que fazer */ }
    // Pendrive desplugado não pode impedir a cópia da pasta pessoal (e vice-versa).
    console.warn(`  (não deu pra escrever em ${saida}: ${e.message} — a versão anterior, se havia, ficou intacta)`);
  }
}

if (!geradas) process.exit(1);

const nMed = (dados.medicamentos || []).length;
const nEv = (dados.eventos || []).length;
const nConf = (dados.confirmar || []).length;
console.log(`  ${nEv} evento(s), ${nMed} medicamento(s), ${nConf} pendência(s) a confirmar.`);
console.log('  Abra com 2 cliques. A página se atualiza sozinha a cada dia que passa.');
