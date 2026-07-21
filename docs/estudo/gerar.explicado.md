# `gerar.mjs` — explicado (detalhado)

Espelho de estudo do **build** do projeto. Material de leitura; não altera nada.
Versão enxuta: [`gerar.resumo.md`](gerar.resumo.md).

Lembre do [mapa](00-ARQUITETURA.md): há **dois tempos**. Este arquivo é o **Tempo A
(build)** — roda no Node, uma vez, de cima a baixo, produz o `Calendario.html` e
termina. Ele não desenha nada; só **transporta** o dado pra dentro da página.

> Como ler cada bloco: 📌 O quê · ⚙️ Como · 🎯 Porquê · 🔤 Sintaxe · 🧠 Conceito ·
> 🔀 Alternativas · ⚠️ Armadilhas

---

## Bloco 0 — O cabeçalho e o "contrato" (linhas 1–9)

```js
// gerar.mjs — junta o template com o dados.json e escreve um Calendario.html
// autocontido (um arquivo só, sem internet, sem instalar nada: abre com 2 cliques
// no Linux e no Windows). ...
//
//   node gerar.mjs [dados.json] [saida.html]
// ...
```

📌 **O quê.** Um comentário-cabeçalho que resume o propósito e mostra o **contrato de
linha de comando** (_CLI_): dois argumentos, ambos opcionais (os `[colchetes]` indicam
"opcional", convenção universal em documentação de comando).

🧠 **Conceito — a interface de um script.** Todo programa de terminal tem uma
"assinatura": o que recebe (argumentos, entrada) e o que produz (arquivos, saída,
código de saída). Documentar isso no topo é o mínimo pra outra pessoa (ou você no
futuro) usar sem ler o corpo.

---

## Bloco 1 — Imports (linhas 10–13)

```js
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
```

📌 **O quê.** Traz quatro módulos **nativos** do Node: sistema de arquivos (`fs`),
sistema operacional (`os`), manipulação de caminhos (`path`) e utilidades de URL
(`url`, do qual pegamos só `fileURLToPath`).

🔤 **Sintaxe — dois estilos de import.**
- `import fs from 'node:fs'` → _default import_: pega a exportação padrão do módulo e dá
  o nome `fs`.
- `import { fileURLToPath } from 'node:url'` → _named import_: pega **uma exportação
  específica** pelo nome (é uma espécie de _destructuring_ de módulo).

🧠 **Conceito — ES Modules (ESM) vs CommonJS.** JavaScript no Node tem dois sistemas de
módulo. O antigo, CommonJS, usa `require()` e `module.exports`. O moderno, ESM, usa
`import`/`export`. A **extensão `.mjs`** força o modo ESM (a alternativa seria
`"type": "module"` num `package.json`, que aqui nem existe).

🎯 **Porquê o prefixo `node:`.** `'node:fs'` deixa explícito que é um **módulo embutido**
do Node, não um pacote npm chamado "fs". Além de mais claro, evita um ataque teórico em
que alguém publica um pacote com o nome de um módulo interno.

🔀 **Alternativas.** Em CommonJS seria `const fs = require('fs')`. O resultado é
parecido; a diferença é sintática e de época.

---

## Bloco 2 — Onde este script mora (linha 15)

```js
const RAIZ = path.dirname(fileURLToPath(import.meta.url));
```

📌 **O quê.** Calcula a **pasta onde o `gerar.mjs` está** e guarda em `RAIZ`. Depois o
script lê o `template.html` a partir daí.

⚙️ **Como (de dentro pra fora).**
1. `import.meta.url` → a URL do módulo atual, algo como
   `file:///C:/Users/voce/Calendario/gerar.mjs`.
2. `fileURLToPath(...)` → converte essa **URL** num **caminho de arquivo** do sistema
   (`C:\Users\voce\Calendario\gerar.mjs`), cuidando de detalhes chatos: o esquema
   `file://`, códigos de escape (`%20` etc.) e a letra de unidade no Windows.
3. `path.dirname(...)` → remove o nome do arquivo e devolve só a **pasta**.

🎯 **Porquê não usar só `'template.html'`.** Um caminho relativo se resolve contra o
**diretório atual** (_current working directory_, CWD) — de onde você chamou o comando —,
que pode ser qualquer lugar. Ancorar em `RAIZ` faz o script achar seus próprios arquivos
**não importa de onde foi chamado** (ex.: `node /pendrive/.../codigo/gerar.mjs` rodando
da sua home).

🧠 **Conceito — "relativo ao script" vs "relativo ao CWD".** Recursos que **pertencem
ao programa** (como o template) devem ser localizados a partir do próprio programa. Só o
dado do usuário é que pode vir do CWD/argumento.

⚠️ **Armadilha — ESM não tem `__dirname`.** No CommonJS existiam as variáveis mágicas
`__dirname` e `__filename`. No ESM **não existem** — daí a receita
`path.dirname(fileURLToPath(import.meta.url))`, que é o equivalente idiomático.

---

## Bloco 3 — Procurar o pendrive (linhas 17–36)

```js
function acharNoPendrive() {
  const bases = process.platform === 'win32'
    ? 'DEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((l) => `${l}:\\`)
    : [`/run/media/${os.userInfo().username}`, `/media/${os.userInfo().username}`];
```

📌 **O quê.** Monta a **lista de lugares onde um pendrive pode estar montado**, que é
diferente em cada sistema.

⚙️ **Como.**
- **Windows:** as unidades aparecem como letras (`D:\`, `E:\`…). O código pega as letras
  de `D` a `Z` (pula `A`/`B`, historicamente disquetes, e `C`, o disco do sistema),
  transformando cada uma em `"D:\\"`, `"E:\\"`, …
- **Linux:** pendrives montam automaticamente em `/run/media/<usuário>/<rótulo>` ou
  `/media/<usuário>/<rótulo>`. `os.userInfo().username` pega o nome do usuário atual.

🔤 **Sintaxe.**
- `process.platform` → string do sistema: `'win32'`, `'linux'`, `'darwin'` (macOS)…
- `cond ? A : B` → **operador ternário**: se `cond` for verdadeiro, vale `A`; senão `B`.
- `'DEF...Z'.split('')` → quebra a string em **array de caracteres**.
- `.map((l) => `${l}:\\`)` → transforma cada letra `l` em `"l:\"`. No _template literal_,
  `\\` representa **uma** contrabarra (a primeira escapa a segunda).

🧠 **Conceito — programação multiplataforma.** O mesmo objetivo ("achar o pendrive")
tem mecânica diferente por SO. O código isola essa diferença num ponto só (a variável
`bases`) e trata o resto igual.

```js
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
```

⚙️ **Como.** Para cada `base`, monta a lista de `filhos` (candidatos a conter a pasta
`Calendario`):
- No **Windows**, a própria unidade é o candidato: se `D:\` existe, `filhos = ['D:\\']`.
- No **Linux**, os candidatos são as pastas **dentro** do diretório de mídia
  (`readdirSync` lista o conteúdo), cada uma um pendrive montado.

Depois, para cada candidato, monta `alvo = <dir>/Calendario/dados.json` e, se o arquivo
existe, **retorna** esse caminho na hora. Se nada for achado, `return null`.

🔤 **Sintaxe — `try { … } catch { continue; }`.** Se `readdirSync` falhar (ex.: a pasta
`/run/media/você` nem existe porque nunca houve mídia), a exceção é **engolida** e o
laço pula (`continue`) pra próxima base, sem quebrar o programa. (Note o `catch` **sem
parâmetro** — sintaxe moderna pra "não me interessa o erro".)

🧠 **Conceito — sondagem tolerante do sistema de arquivos.** Em vez de perguntar "essa
pasta existe?" e depois listar (duas operações que podem "descasar"), o código **tenta
listar e trata a falha**. É o estilo _"peça perdão, não permissão"_ (EAFP).

⚠️ **Armadilhas.**
- Varrer `D:` até `Z:` pode **tocar unidades de rede ou drives vazios** e ficar lento.
- **macOS cai no ramo "Linux"** (`process.platform === 'darwin'` não é `win32`), mas o
  macOS monta volumes em **`/Volumes`**, que não está nas `bases` — num Mac a busca
  falharia e restaria o fallback do `dados.json` local.
- Assume que a pasta se chama **exatamente** `Calendario`. No Linux (sensível a
  maiúsculas), `calendario` não seria achado.
- Retorna o **primeiro** que encontrar — com dois pendrives, a escolha é a ordem das
  letras/listagem.

---

## Bloco 4 — Escolher a entrada (linha 38)

```js
const entrada = process.argv[2] || acharNoPendrive() || path.join(RAIZ, 'dados.json');
```

📌 **O quê.** Decide **de onde ler o dado**, numa ordem de preferência: argumento na
linha de comando → senão o pendrive → senão um `dados.json` ao lado do script.

🔤 **Sintaxe — `process.argv`.** É o array de argumentos: `argv[0]` é o executável do
node, `argv[1]` é o caminho do script, e `argv[2]` em diante são os argumentos que
**você** digitou. Então `argv[2]` = o primeiro argumento do usuário (o caminho do dado,
se passado).

🧠 **Conceito — _short-circuit_ como escada de fallback.** O operador `||` devolve o
**primeiro valor "verdadeiro"** e nem avalia o resto. Como `undefined` (argumento
ausente) e `null` (pendrive não achado) são "falsos", a expressão desce a escada até
achar algo utilizável. É um idioma clássico de "valor padrão em cascata".

⚠️ **Armadilha.** `||` também trata `""`, `0` e `false` como "falsos". Aqui não dá
problema (um caminho nunca é string vazia), mas em outros contextos o operador `??`
(_nullish coalescing_, que só cai pra frente em `null`/`undefined`) seria mais seguro.

---

## Bloco 5 — Existe mesmo? (linhas 39–43)

```js
if (!fs.existsSync(entrada)) {
  console.error(`Não achei o dados.json em: ${entrada}`);
  console.error('Plugue o pendrive, ou passe o caminho: node gerar.mjs /caminho/dados.json');
  process.exit(1);
}
```

📌 **O quê.** Se o caminho escolhido não existe, explica o que fazer e **encerra com
falha**.

🔤 **Sintaxe / 🧠 Conceito.**
- `console.error` escreve no **stderr** (o canal de erros), separado do `stdout` (o
  canal de resultado). Isso permite, por exemplo, redirecionar só os erros.
- `process.exit(1)` termina o processo com **código de saída 1**. Por convenção, `0` =
  sucesso e **qualquer coisa ≠ 0 = falha** — é assim que outro script sabe que deu
  errado.

---

## Bloco 6 — Ler e validar o JSON (linhas 45–56)

```js
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
```

📌 **O quê.** Lê o arquivo como texto, transforma em objeto (`JSON.parse`) e garante que
o resultado é um **objeto** de verdade. Falhou? Mensagem clara e sai.

🔤 **Sintaxe.**
- `fs.readFileSync(entrada, 'utf8')` → lê o arquivo **de forma síncrona** (o programa
  espera terminar) e, com `'utf8'`, devolve **string** (sem isso, viria um `Buffer` de
  bytes).
- `try { … } catch (e) { … }` → captura exceções. `JSON.parse` **lança** um `SyntaxError`
  se o texto não for JSON válido; o `catch` transforma esse "crash" numa mensagem
  amigável. `e.message` é a explicação técnica do erro.

🎯 **Porquê o `try/catch`.** O `dados.json` é editado **à mão**. Uma vírgula a mais é
fácil de deixar. Sem o `try/catch`, o Node cuspiria uma pilha de erro assustadora; com
ele, você lê "não é um JSON válido: …" e sabe onde olhar.

🧠 **Conceito — exceções (throw/catch).** Algumas operações sinalizam falha
**lançando** um erro em vez de retornar um valor. Quem chama decide **capturar** e
tratar. É o modelo do JS pra erros "excepcionais".

⚠️ **Armadilha clássica de JS — `typeof null === 'object'`.** A validação parece
redundante, mas cada pedaço tem razão de ser:
- `!dados` barra `null` (porque, por um bug histórico da linguagem, `typeof null` é
  `'object'` — então checar só o `typeof` deixaria `null` passar).
- `typeof dados !== 'object'` barra número, string, booleano.
- `Array.isArray(dados)` barra **arrays** (porque `typeof [] === 'object'` também!).

Só sobra o que queremos: um objeto `{ … }`. Três checagens pra fechar três buracos.

---

## Bloco 7 — Para onde escrever a página (linhas 58–70)

```js
const raizEhCodigoDoPendrive =
  path.resolve(RAIZ) === path.resolve(path.dirname(entrada), 'codigo');
const saidas = process.argv[3]
  ? [process.argv[3]]
  : [...new Set([
    path.join(path.dirname(entrada), 'Calendario.html'),
    ...(raizEhCodigoDoPendrive ? [] : [path.join(RAIZ, 'Calendario.html')]),
  ])];
```

📌 **O quê.** Decide **quantas cópias** da página gerar e **onde**. Regra normal: duas —
uma junto do dado (no pendrive) e uma na pasta local. Se você passou um segundo
argumento, respeita esse caminho único.

⚙️ **Como.**
- `raizEhCodigoDoPendrive` detecta o caso especial de o script estar rodando **de dentro
  do pendrive** (`<pendrive>/Calendario/codigo`). Nesse caso, "pasta local" e "pasta do
  dado" são o mesmo pendrive, e não faz sentido duplicar — então a lista da pasta local
  fica vazia.
- Se veio `argv[3]` → `saidas = [esse caminho]`.
- Senão → um `Set` com o `Calendario.html` do pendrive **e** (a menos do caso especial)
  o `Calendario.html` local.

🔤 **Sintaxe.**
- `path.resolve(a, b)` → junta e **normaliza** para um caminho absoluto canônico (resolve
  `..`, barras, etc.). Comparar caminhos **assim**, e não como texto cru, evita que
  `./x` e `x` pareçam diferentes.
- `new Set([...])` → coleção de valores **únicos**; jogar dois caminhos iguais nela deixa
  um só. `[...new Set(...)]` volta pra array (o _spread_ `...` "espalha" os itens).
- `...(cond ? [] : [item])` → **spread condicional**: injeta zero ou um item numa lista
  literal. Truque limpo pra "inclua isto só se…".

🧠 **Conceito — idempotência e fonte única.** Gerar de novo **sobrescreve** as cópias
(nunca duplica), e as cópias são **derivadas** — descartáveis. O dado de verdade
continua sendo um só (`dados.json`). O `Set` é o detalhe que garante "não escreva o
mesmo arquivo duas vezes".

⚠️ **Armadilha.** Nunca compare caminhos como strings simples (`RAIZ === outro`):
diferenças bobas (barra final, `./`, maiúsculas no Windows) enganariam. `path.resolve`
existe justamente pra isso.

---

## Bloco 8 — Ler o template e conferir o marcador (linhas 72–77)

```js
const template = fs.readFileSync(path.join(RAIZ, 'template.html'), 'utf8');
const marcador = /\/\*DADOS\*\/[\s\S]*?\/\*FIM\*\//;
if (!marcador.test(template)) {
  console.error('O template.html perdeu o marcador /*DADOS*/.../*FIM*/ — não dá pra injetar.');
  process.exit(1);
}
```

📌 **O quê.** Carrega o `template.html` e confirma que ele contém o **marcador** onde o
dado será injetado. Sem marcador, aborta.

🔤 **Sintaxe — a expressão regular (regex).** `marcador` casa o texto
`/*DADOS*/……/*FIM*/`. Destrinchando:
- `\/` → uma barra literal (a barra sozinha delimita a regex, então precisa escapar).
- `\*` → um asterisco literal (o `*` "solto" é quantificador, então escapa-se).
- `[\s\S]*?` → **qualquer caractere, inclusive quebras de linha**, repetido, de forma
  **não-gulosa**. `\s` é espaço/quebra, `\S` é o resto; juntos, "tudo".
- `.test(template)` → devolve `true`/`false` se casa em algum lugar.

🧠 **Conceito — `[\s\S]` e guloso vs preguiçoso.**
- O `.` da regex **não** casa quebra de linha por padrão; `[\s\S]` é o idioma pra "casa
  mesmo através de linhas" (equivalente ao modo _dotall_).
- `*` é **guloso** (pega o máximo possível); `*?` é **preguiçoso** (pega o mínimo). Aqui o
  preguiçoso garante parar no **primeiro** `/*FIM*/`, não no último — importante se
  houvesse mais de um.

🧠 **Conceito — _sentinela_/marcador.** Um trecho combinado (`/*DADOS*/…/*FIM*/`) marca
"aqui vai o conteúdo gerado". Como está escrito em forma de **comentário JS**, o
template continua sendo um `.html` válido e abre mesmo "vazio". É _templating_ minimalista.

---

## Bloco 9 — Serializar, escapar e injetar (linhas 79–83)

```js
// `</script>` dentro do JSON encerraria o bloco cedo demais e quebraria a página.
const json = JSON.stringify(dados, null, 2).replace(/<\//g, '<\\/');
// Função (não string) no replace: senão o `$&`, `` $` ``, `$'`, `$$` que por acaso
// existissem no JSON virariam referências e corromperiam a página em silêncio.
const html = template.replace(marcador, () => `/*DADOS*/${json}/*FIM*/`);
```

📌 **O quê.** Transforma o objeto de volta em **texto JSON bonito**, o torna **seguro**
pra viver dentro de um `<script>`, e o coloca no lugar do marcador.

🔤 **Sintaxe — `JSON.stringify(dados, null, 2)`.** O 2º argumento é um _replacer_ (aqui
`null` = "não filtre nada"); o 3º é a **indentação** (2 espaços) — é o que deixa o JSON
"pretty", legível se você abrir o HTML gerado.

🧠 **Conceito 1 — escapar `</` (a fronteira HTML × JS).** O navegador, ao ler
`<script> … </script>`, procura a sequência literal `</script>` pra fechar o bloco —
**mesmo que ela esteja no meio de uma string JS**. Se um dado contivesse `"</script>"`,
a página quebraria ali. A troca `.replace(/<\//g, '<\\/')` transforma todo `</` em `<\/`;
o navegador não vê mais um fechamento, e em JS `"<\/"` é idêntico a `"</"` (a contrabarra
some), então o dado lido de volta é o mesmo. O `g` no fim da regex = **global** (troca
todas as ocorrências).

🧠 **Conceito 2 — a função no `replace` (o `$` traiçoeiro).** Quando o 2º argumento de
`String.replace` é uma **string**, alguns `$` têm significado especial: `$$`→`$`,
`$&`→o trecho casado, `` $` ``→o que vem antes, `$'`→o que vem depois, `$1`→grupo de
captura. Se o **JSON** (dado) contivesse, por azar, `"$&"` ou `"$'"`, uma substituição
por string os **expandiria**, corrompendo a página **sem erro nenhum**. Passando uma
**função** cujo retorno é usado **literalmente**, o `$` deixa de ter poderes. É blindagem
contra uma classe inteira de bug.

🔀 **Alternativas.** Dava pra escapar os `$` manualmente antes (`json.replace(/\$/g,
'$$$$')`), mas é mais frágil e obscuro. A função é a forma limpa e à prova de esquecimento.

⚠️ **Armadilha.** Trocar a função de volta por uma string "porque é mais curto"
reintroduz o bug — e ele só aparece com um dado específico, meses depois. É o tipo de
regressão que passa despercebida.

---

## Bloco 10 — Escrever as cópias, tolerando falha (linhas 84–93)

```js
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
```

📌 **O quê.** Grava o HTML em **cada** destino. Se um falhar, **avisa e continua** pro
próximo — não desiste da tarefa inteira.

🔤 **Sintaxe.**
- `fs.mkdirSync(dir, { recursive: true })` → cria a pasta de destino, inclusive pastas
  intermediárias; com `recursive`, **não dá erro** se já existir.
- `fs.writeFileSync(saida, html, 'utf8')` → grava o texto no arquivo (sobrescrevendo).

🧠 **Conceito — _fail-soft_ / sucesso parcial.** O `try/catch` está **dentro** do laço,
por iteração. Logo, escrever no pendrive falhar (desplugado) **não impede** a cópia
local, e vice-versa. Compare com um `try` em volta do laço todo, que abortaria na
primeira falha. A escolha reflete o requisito real: "uma cópia a menos é melhor que
nenhuma".

🧠 **Conceito — efeito colateral.** Até aqui o script só calculava; **agora** ele mexe no
mundo (cria pastas, escreve arquivos). Concentrar os efeitos no fim, depois de tudo
validado, é um bom hábito.

---

## Bloco 11 — O resumo final (linhas 95–99)

```js
const nMed = (dados.medicamentos || []).length;
const nEv = (dados.eventos || []).length;
const nConf = (dados.confirmar || []).length;
console.log(`  ${nEv} evento(s), ${nMed} medicamento(s), ${nConf} pendência(s) a confirmar.`);
console.log('  Abra com 2 cliques. A página se atualiza sozinha a cada dia que passa.');
```

📌 **O quê.** Conta e imprime quantos eventos, medicamentos e pendências foram
injetados — um retorno rápido de que "deu certo e com quanta coisa".

🔤 **Sintaxe / 🧠 Conceito — o `|| []` defensivo.** Se `dados.medicamentos` não existir
(chave ausente), `dados.medicamentos.length` **quebraria** (não dá pra ler `.length` de
`undefined`). O `(dados.medicamentos || [])` garante que, na pior hipótese, contamos o
tamanho de uma **lista vazia** (`0`). É o mesmo espírito defensivo do resto do arquivo:
nunca confiar cegamente que a chave veio.

---

## Recapitulando o `gerar.mjs`

1. **Descobre** o dado (argumento → pendrive → local).
2. **Valida** existência e sintaxe do JSON, com mensagens humanas.
3. **Planeja** as saídas (pendrive + local; `Set` pra não duplicar).
4. **Lê** o template e confere o **marcador**.
5. **Serializa + protege** o dado (escapa `</`, injeta via **função**).
6. **Escreve** cada cópia com _fail-soft_.
7. **Relata** as contagens.

Idiomas que valem levar pra vida: `path.dirname(fileURLToPath(import.meta.url))` (pasta
do script no ESM), `a || b || c` (fallback em cascata), `[\s\S]*?` (regex "tudo, não
guloso"), `.replace(re, () => txt)` (injetar sem interpretar `$`), e o `try/catch` por
item para _fail-soft_.

➡️ Próximo no roteiro: **`template.html`** — dividido em `template-html.explicado.md`,
`template-css.explicado.md` e `template-js.explicado.md`.
