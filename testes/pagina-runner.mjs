// Roda o <script> real do template.html com relógio fixo e imprime as seções em JSON.
//   TZ=America/Sao_Paulo node testes/pagina-runner.mjs <dados.json> <instante-local ISO>
// Só dados inventados. Usado por pagina.test.mjs (que define o TZ do processo filho).
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dados = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
let agora = new Date(process.argv[3]).getTime();

const template = fs.readFileSync(path.join(RAIZ, 'template.html'), 'utf8');
const json = JSON.stringify(JSON.stringify(dados)).replace(/</g, '\\u003c');
const script = template.match(/<script>([\s\S]*)<\/script>/)[1]
  .replace(/\/\*DADOS\*\/[\s\S]*?\/\*FIM\*\//, () => `/*DADOS*/JSON.parse(${json})/*FIM*/`);

class DataFixa extends Date {
  constructor(...a) { a.length ? super(...a) : super(agora); }
  static now() { return agora; }
}
const els = {};
const el = (id) => (els[id] ??= { innerHTML: '', textContent: '', querySelectorAll: () => [] });
const intervalos = [];
const ctx = {
  Date: DataFixa,
  document: { getElementById: el, createElement: () => ({}), querySelectorAll: () => [] },
  location: { reload() {} },
  setInterval: (fn) => intervalos.push(fn),
  requestAnimationFrame: () => 0,
};
vm.createContext(ctx);
vm.runInContext(script, ctx);
if (process.argv[4]) {
  agora = new Date(process.argv[4]).getTime();
  intervalos.forEach((fn) => fn());
}
const texto = (h) => h.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const saida = {};
for (const id of ['hoje', 'contadores', 'hojeMed', 'proximas', 'historico', 'calendario']) {
  saida[id] = texto((els[id]?.innerHTML) || els[id]?.textContent || '');
}
if (process.env.ICS) saida.ics = ctx.gerarICS();
console.log(JSON.stringify(saida));
