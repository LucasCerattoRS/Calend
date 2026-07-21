# 🧠 Conceitos — do zero, com exemplos

Reúne os fundamentos que aparecem no Calendário, explicados sem pressupor conhecimento
prévio. Cada verbete: o que é · um exemplo mínimo · onde aparece no projeto.

---

## 1. Arquitetura e filosofia

**Separação código × dado.** Manter o **programa** (versionado, público) longe da
**informação** (privada). Reduz risco: um bug ou backup de um não arrasta o outro.
→ No projeto: `template.html`/`gerar.mjs` no git; `dados.json` só no pendrive.

**Fonte única da verdade (_single source of truth_).** Um lugar só é o "oficial"; o resto
são cópias derivadas e descartáveis. → O `dados.json` é a verdade; o `Calendario.html` é
derivado (pode ser apagado e regerado).

**Artefato derivado / build.** Um arquivo **gerado** a partir de fontes, não editado à
mão. → O `Calendario.html` é o artefato; `gerar.mjs` é o build que o produz.

**Templating por injeção.** Um molde com um "buraco" marcado, preenchido na geração.
Exemplo: `"Olá, {{nome}}"` → troca `{{nome}}`. → O marcador `/*DADOS*/…/*FIM*/` no
`template.html`.

**Estado derivado (do tempo).** Em vez de guardar "dias desde X", guarda-se **X** e
calcula-se "hoje − X" na hora. O valor nunca desatualiza. → Toda a página se recalcula a
partir de `new Date()` ao abrir.

**Idempotência.** Rodar de novo dá o mesmo resultado, sem duplicar. Exemplo: `mkdir -p`
não reclama se a pasta existe. → Regerar sobrescreve; o `sync` faz "recomeço limpo".

**Programação defensiva / _fail-soft_.** Prever a falha e degradar suavemente, em vez de
quebrar. Exemplo: `(x || []).length`. → `try/catch` por saída no `gerar.mjs`; `|| []` em
todo lugar.

**Offline-first / zero dependência.** Funcionar sem internet e sem instalar nada. Custo:
mais código manual; ganho: longevidade. → Sem `node_modules`, fontes do sistema, ícones e
favicon embutidos.

---

## 2. JavaScript — a linguagem

**Módulos ESM vs CommonJS.** Dois sistemas de importação. ESM: `import x from '…'`;
CommonJS: `const x = require('…')`. `.mjs` força ESM. → Imports do `gerar.mjs`.

**_Arrow function_.** Função curta: `const f = (x) => x + 1`. Sem `{}`, o valor é
retornado sozinho. → Quase todos os helpers.

**_Destructuring_ (desestruturação).** Extrair partes de array/objeto em variáveis:
`const [a, b] = [1, 2]`; `const { nome } = obj`. Com padrão: `const [h = ''] = arr`.
→ `diaDe`, `instante`, `pintarHoje` (`{ m, p }`).

**_Template literal_.** String com crases que interpola: `` `Oi ${nome}` ``, e pode ter
várias linhas. → Toda a montagem de HTML no JS.

**_Spread_ `...`.** "Espalha" itens: `[...a, ...b]` junta arrays; `{ ...base, x: 1 }` copia
chaves. → `mudancas()` (`...base`), `[...map.keys()]`.

**_Shorthand_ de objeto.** `{ m, p }` é atalho de `{ m: m, p: p }`. → `pintarHoje`.

**_Short-circuit_ `||` e `??`.** `a || b` devolve o 1º "verdadeiro"; `a ?? b` só cai pra
`b` se `a` for `null`/`undefined`. → `argv[2] || acharNoPendrive() || …`.

**_Truthy_/_falsy_ e `typeof null`.** Valores "falsos": `false, 0, '', null, undefined,
NaN`. Pegadinha: `typeof null === 'object'` e `typeof [] === 'object'`. → Validação do
`dados` no `gerar.mjs`.

**Métodos de array.** `map` (transforma cada item), `filter` (seleciona), `find` (1º que
casa), `sort` (ordena), `join` (cola em string). Exemplo: `[1,2,3].map(n => n*2)` →
`[2,4,6]`. → Onipresentes no render e em `marcoDe`.

**`Map`.** Dicionário chave→valor que **mantém a ordem** de inserção e aceita qualquer
chave. `m.set(k,v)`, `m.get(k)`, `m.has(k)`. → Agrupar por momento/data.

**Exceções (`try/catch`).** Operações que **lançam** erro em vez de retornar. `try { … }
catch (e) { … }` captura. → `JSON.parse` no `gerar.mjs`.

**Funções puras.** Mesma entrada → mesma saída, sem efeito colateral. Fáceis de testar.
→ `isoDe`, `diaDe`, `marcoDe`, `esc`.

**Efeito colateral.** Quando a função **muda o mundo** (escreve arquivo, mexe no DOM).
→ `writeFileSync`; `alvo.innerHTML = …`.

---

## 3. JavaScript — datas

**`Date` e mês base-0.** `new Date(ano, mês, dia)` com mês **0–11**. `new Date(2026, 6,
20)` = 20/jul. → `diaDe` faz `m - 1`.

**Local vs UTC.** `new Date("2026-07-20")` (só data) é lido como **UTC**; com hora
(`"…T00:00"`) ou por componentes, é **local**. → Por isso `diaDe`/`instante` montam por
componentes.

**Aritmética de tempo.** Subtrair `Date` dá **milissegundos**. `dias = (b - a) /
86400000`. → `diasEntre`, contadores.

**`Intl` / `toLocaleDateString`.** Formatação localizada nativa: `data.toLocaleDateString
('pt-BR', { month: 'long' })` → "julho". → `fmtData`, `fmtLongo`, `mesCurto`.

**Comparação de datas como texto.** Strings `AAAA-MM-DD` ordenam alfabeticamente = por
data (com zero à esquerda). `"2026-07-09" < "2026-07-10"`. → `ativoEm`, filtros de
`pintarProximas`/`Historico`.

---

## 4. Navegador, DOM e render

**DOM.** A árvore de objetos que representa a página; o JS a manipula.
`document.getElementById('x')` acha um nó. → Os seis ganchos.

**`innerHTML` vs `textContent`.** `innerHTML` **interpreta** HTML (poderoso, mas exige
escapar dado); `textContent` insere **texto puro** (seguro). → Render usa `innerHTML`; o
cabeçalho usa `textContent`.

**Escapar / XSS.** Transformar `< > & "` em entidades pra não quebrar (ou injetar) HTML.
`esc('a<b')` → `'a&lt;b'`. → `esc` em todo texto do usuário.

**Atributos `data-*`.** Guardar dado no HTML pra o JS ler depois:
`<i data-w="60%">` → `el.dataset.w`. → `data-vivo`, `data-w`.

**`requestAnimationFrame`.** Agenda código pra **antes do próximo desenho** — usado pra
disparar animações após o paint inicial. → Encher o medidor.

**`setInterval`.** Repete uma função a cada N ms. `setInterval(f, 1000)`. → O relógio
`tique`.

**View = f(estado).** A tela é **função** do dado: recalcule o dado, redesenhe. Aqui, sem
framework: `dado.map(x => \`html\`).join('')` → `innerHTML`. → As seis pinturas.

---

## 5. CSS e design system

**_Custom properties_ / tokens.** Variáveis: `--cor: red; color: var(--cor)`. Nomeadas por
**papel** (`--ink`, `--superficie`). → Bloco `:root`.

**Theming por `prefers-color-scheme`.** Uma _media query_ que detecta tema do SO; redefine
os tokens. → Bloco do modo escuro.

**Modelo de caixa e `box-sizing`.** `border-box` faz padding/borda **não** aumentarem o
tamanho. → `* { box-sizing: border-box }`.

**CSS Grid.** Layout 2D. `repeat(auto-fit, minmax(232px, 1fr))` = colunas fluidas sem
_breakpoint_; `grid-template-areas` = layout "desenhado". → `.tiles`, `.duplo`.

**Flexbox.** Layout 1D (linha/coluna). Pegadinha: `min-width: 0` deixa o item encolher.
→ `.linha`, `.prox`, `.prox-corpo`.

**Combinadores.** `A + B` (irmão adjacente), `A > B` (filho direto). Espaço **entre**, não
em volta. → `.momento + .momento`, `li + li`.

**Pseudo-elemento `::before`.** Um "elemento fantasma" via CSS (`content: ""`). → As
bolinhas da linha do tempo do histórico.

**_Media queries_ de contexto.** `print` (folha de impressão), `prefers-reduced-motion`
(menos animação). → Fim do `<style>`.

**Unidades relativas (`rem`).** Relativa à fonte-raiz; escala com a preferência do
usuário. → Tipografia.

---

## 6. Node.js (o build)

**`import.meta.url` + `fileURLToPath`.** Como o ESM descobre "onde este arquivo está" (não
há `__dirname`). → `RAIZ`.

**`fs` síncrono.** `readFileSync`/`writeFileSync`/`existsSync`/`mkdirSync` — lêem/escrevem
**esperando** terminar. → Todo o `gerar.mjs`.

**`path`.** Junta/normaliza caminhos multiplataforma: `path.join`, `path.dirname`,
`path.resolve` (canônico, pra comparar). → Saídas do `gerar.mjs`.

**`process`.** `argv` (argumentos), `exit(código)` (0=ok, ≠0=erro), `platform`. → Entrada e
erros.

**`Set`.** Coleção de valores **únicos**. `[...new Set(arr)]` remove duplicados. → Evitar
escrever a mesma saída duas vezes.

**stdout vs stderr.** Dois canais de saída: resultado (`console.log`) e erro
(`console.error`). → Mensagens do `gerar.mjs`.

---

## 7. Bash (a distribuição)

**_Shebang_.** `#!/usr/bin/env bash` — com que interpretador rodar. → Linha 1.

**Modo estrito.** `set -euo pipefail` — aborta em erro, var indefinida, falha em pipe.

**_Command substitution_.** `$( … )` captura a saída de um comando numa variável.
→ `RAIZ`.

**Testes `[[ … ]]`.** `-d` (diretório), `-e` (existe), `-z` (string vazia). → Busca do
pendrive.

**_Globbing_.** `*` expande nomes de arquivo; `"$base"/*/` = subpastas. → Loop do pendrive.

**Heredoc.** `cat > f <<'EOF' … EOF` escreve um bloco literal. → `COMO-USAR.txt`.

---

## 8. Regex (expressões regulares)

**O que é.** Um padrão pra casar texto. → O marcador no `gerar.mjs`.

**Guloso vs preguiçoso.** `*` pega o **máximo**; `*?` o **mínimo**. → `[\s\S]*?` para no
1º `/*FIM*/`.

**`[\s\S]` = "tudo".** O `.` não casa quebra de linha; `[\s\S]` (espaço **ou** não-espaço)
casa. → Marcador multilinha.

**`$` no `replace`.** Como string de troca, `$&`, `` $` ``, `$'`, `$$` são **especiais**.
Usar uma **função** evita isso. → `gerar.mjs` injeta via função.

**Flag `g`.** Global — troca **todas** as ocorrências. → Escape de `</`.
