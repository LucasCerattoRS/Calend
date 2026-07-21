# 📖 Glossário

Termos técnicos do projeto, em uma linha cada. Definições mais longas, com exemplo, no
[`CONCEITOS.md`](CONCEITOS.md).

| Termo | Significado curto |
|---|---|
| **allowlist** | lista do que **é permitido** (o `sync` copia só estes arquivos) |
| **arrow function** | função curta em JS: `(x) => …` |
| **artefato** | arquivo **gerado** por um build (o `Calendario.html`) |
| **ARIA / `role`** | atributos que dão significado a leitores de tela (`role="alert"`) |
| **Bash** | linguagem de script do terminal Linux/macOS |
| **breakpoint** | largura em que o layout muda (`@media (min-width: 780px)`) |
| **box model** | como largura/altura, padding e borda compõem o tamanho de um elemento |
| **build** | passo que **gera** um artefato a partir das fontes (`gerar.mjs`) |
| **combinador (CSS)** | relação entre seletores: `+` (irmão), `>` (filho) |
| **CommonJS** | sistema de módulos antigo do Node (`require`) |
| **command substitution** | `$( … )` no Bash: captura a saída de um comando |
| **custom property** | variável de CSS: `--x: …` / `var(--x)` |
| **CVD / daltonismo** | deficiência de visão de cores; a paleta foi validada pra ela |
| **data URI** | recurso embutido na URL (`data:image/svg+xml,…`), sem arquivo externo |
| **`data-*`** | atributo HTML pra guardar dado que o JS lê (`el.dataset.x`) |
| **derivar / derivado** | calcular a partir de outra coisa (dias a partir de "hoje") |
| **destructuring** | extrair partes: `const [a,b] = arr` |
| **DOM** | árvore de objetos da página que o JS manipula |
| **efeito colateral** | quando a função muda o mundo (escreve arquivo, mexe no DOM) |
| **ESM** | ES Modules — sistema moderno de import/export; `.mjs` o ativa |
| **fail-soft** | falhar suavemente sem quebrar tudo |
| **fallback** | valor/plano reserva quando o principal não serve |
| **falsy / truthy** | valores tratados como falso/verdadeiro em condição |
| **flexbox** | layout 1D (linha ou coluna) |
| **glob / globbing** | expansão de nomes com `*` no shell |
| **Grid** | layout 2D do CSS (linhas e colunas) |
| **heredoc** | bloco de texto literal no Bash (`<<'EOF' … EOF`) |
| **idempotência** | rodar de novo dá o mesmo resultado, sem duplicar |
| **`innerHTML`** | conteúdo HTML de um elemento (interpreta tags) |
| **`Intl`** | API de formatação localizada (datas, números) |
| **ISO 8601** | formato de data `AAAA-MM-DD[Thh:mm]` |
| **`Map`** | dicionário chave→valor ordenado |
| **marcador / sentinela** | trecho fixo que marca "aqui vai algo" (`/*DADOS*/…/*FIM*/`) |
| **media query** | regra CSS condicional (tema, largura, impressão, movimento) |
| **mobile-first** | estilizar primeiro o celular; a media query adiciona o desktop |
| **modo estrito (Bash)** | `set -euo pipefail` |
| **`null`** | "nada" **de propósito** (período em aberto: `ate: null`) |
| **offline-first** | funciona sem internet, sem instalar nada |
| **paleta / token** | conjunto de cores/estilos nomeados por papel |
| **pseudo-elemento** | elemento gerado por CSS (`::before`) |
| **regex** | expressão regular; padrão pra casar texto |
| **rem** | unidade relativa à fonte-raiz (acessível) |
| **render** | transformar dado em HTML na tela |
| **requestAnimationFrame** | roda código antes do próximo desenho (pra animar) |
| **reset (CSS)** | zerar padrões inconsistentes (`box-sizing: border-box`) |
| **schema** | o **formato/contrato** do dado |
| **`Set`** | coleção de valores únicos |
| **shebang** | `#!/usr/bin/env bash` — com que programa rodar o script |
| **short-circuit** | `a || b`, `a ?? b`: para no 1º que resolve |
| **single source of truth** | a cópia oficial única do dado (`dados.json`) |
| **spread** | `...` espalha itens de array/objeto |
| **stdout / stderr** | canais de saída: resultado / erro |
| **template literal** | string com crases e `${…}` |
| **textContent** | texto puro de um elemento (não interpreta HTML) |
| **token de design** | variável nomeada por papel (`--superficie`) |
| **view = f(estado)** | a tela é função do dado |
| **XSS** | injeção de HTML/script malicioso; evitada escapando o texto |
