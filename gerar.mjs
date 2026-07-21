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
  dados = JSON.parse(fs.readFileSync(entrada, 'utf8'));
} catch (e) {
  console.error(`O ${entrada} não é um JSON válido: ${e.message}`);
  console.error('Confira vírgula sobrando, aspas e chaves — o dado não foi tocado.');
  process.exit(1);
}
if (!dados || typeof dados !== 'object' || Array.isArray(dados)) {
  console.error(`O ${entrada} precisa ser um objeto { … } com eventos/medicamentos.`);
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

// `</script>` dentro do JSON encerraria o bloco cedo demais e quebraria a página.
const json = JSON.stringify(dados, null, 2).replace(/<\//g, '<\\/');
// Função (não string) no replace: senão o `$&`, `` $` ``, `$'`, `$$` que por acaso
// existissem no JSON virariam referências e corromperiam a página em silêncio.
const html = template.replace(marcador, () => `/*DADOS*/${json}/*FIM*/`);
for (const saida of saidas) {
  try {
    fs.mkdirSync(path.dirname(saida), { recursive: true });
    fs.writeFileSync(saida, html, 'utf8');
    console.log(`Calendario.html gerado: ${saida}`);
  } catch (e) {
    // Pendrive desplugado não pode impedir a cópia da pasta pessoal (e vice-versa).
    console.warn(`  (não deu pra escrever em ${saida}: ${e.message})`);
  }
}

const nMed = (dados.medicamentos || []).length;
const nEv = (dados.eventos || []).length;
const nConf = (dados.confirmar || []).length;
console.log(`  ${nEv} evento(s), ${nMed} medicamento(s), ${nConf} pendência(s) a confirmar.`);
console.log('  Abra com 2 cliques. A página se atualiza sozinha a cada dia que passa.');
