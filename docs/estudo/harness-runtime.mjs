// ============================================================================
// [ESTUDO] harness-runtime.mjs — executa o <script> REAL do template.html em
// Node, com um "DOM de mentira", pra observar o que cada seção renderiza sem
// abrir o navegador. É a ferramenta usada pra verificar o CASOS-LIMITE.md.
//
//   node docs/estudo/harness-runtime.mjs [dados.json] [--html]
//
// Sem argumento, usa o dados.exemplo.json. Com --html, imprime o HTML cru de
// cada gancho (útil pra ver classes, styles e ícones) em vez do texto.
// NUNCA aponte para o dados.json real — use o exemplo ou variantes dele.
// Não altera nenhum arquivo: só lê, roda e imprime.
// ============================================================================
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const PROJETO = path.resolve(AQUI, '..', '..');

const args = process.argv.slice(2).filter((a) => a !== '--html');
const cru = process.argv.includes('--html');
const entrada = args[0] || path.join(PROJETO, 'dados.exemplo.json');
const dados = JSON.parse(fs.readFileSync(entrada, 'utf8'));

// Mesmo transporte do gerar.mjs: injeta o JSON no marcador (escapando </).
const template = fs.readFileSync(path.join(PROJETO, 'template.html'), 'utf8');
const json = JSON.stringify(dados).replace(/<\//g, '<\\/');
const script = template.match(/<script>([\s\S]*)<\/script>/)[1]
  .replace(/\/\*DADOS\*\/[\s\S]*?\/\*FIM\*\//, () => `/*DADOS*/${json}/*FIM*/`);

// DOM de mentira: só o que o script usa. Cada getElementById devolve um objeto
// que "aceita" innerHTML/textContent — e a gente lê depois o que ficou lá.
const els = {};
const el = (id) => (els[id] ??= { innerHTML: '', textContent: '', querySelectorAll: () => [] });
const contexto = {
  document: { getElementById: el, querySelectorAll: () => [] },
  location: { reload() {} },
  setInterval: () => 0,           // sem laço: uma passada só
  requestAnimationFrame: () => 0, // sem paint: animação não interessa aqui
};
vm.createContext(contexto);
vm.runInContext(script, contexto);

// Imprime cada gancho: HTML cru (--html) ou como texto puro (tags viram espaço).
const texto = (h) => h.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ').trim();
console.log(`(dado: ${entrada})`);
for (const id of ['hoje', 'pendencias', 'contadores', 'hojeMed', 'proximas', 'historico']) {
  const e = els[id] || { innerHTML: '', textContent: '' };
  const saida = cru ? (e.innerHTML || e.textContent).replace(/\s+/g, ' ').trim()
    : (texto(e.innerHTML) || e.textContent);
  console.log(`#${id}: ${saida || '(vazio)'}`);
}
