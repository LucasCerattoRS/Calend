# 🗺️ Arquitetura do Calendário

> Material de estudo — documento de leitura. Não altera nada do projeto.
> Comece pelo [ROTEIRO.md](ROTEIRO.md) se quiser a ordem de leitura.

## 1. Que tipo de projeto é este

Uma **aplicação web estática de arquivo único, _offline-first_**. Sem servidor, sem
framework, sem `node_modules`, sem internet. A página final é um `.html`
autocontido que abre com 2 cliques e **se recalcula a partir da data de hoje** toda
vez que abre — por isso "não envelhece".

Uma decisão de design atravessa tudo: **separar CÓDIGO de DADO**. O código é
versionado (git); o dado é de saúde e vive só no pendrive. Guarde isso — explica
quase todas as escolhas.

## 2. Os arquivos e seus papéis

| Arquivo | Linhas | Papel | Código-fonte? |
|---|---|---|---|
| `template.html` | 433 | **A página**: HTML + CSS + JS inline. Tem o marcador `/*DADOS*/{}/*FIM*/` onde o dado é injetado. | ✅ versionado |
| `gerar.mjs` | 99 | **O build** (Node): pega o `dados.json`, injeta no `template.html`, escreve o `Calendario.html`. | ✅ versionado |
| `dados.exemplo.json` | 26 | **O formato do dado** (inventado). Documentação viva do schema + base de testes. | ✅ versionado |
| `sync-pendrive.sh` | 57 | **Distribuição**: copia o código pro pendrive pra regerar em qualquer máquina. | ✅ versionado |
| `README.md` | 69 | Documentação humana (filosofia, uso, formato). | ✅ versionado |
| `.gitignore` | 14 | A **política** código-entra / dado-não-entra. | ✅ versionado |
| `dados.json` | — | **A fonte da verdade**. Dado de saúde. *Vive só no pendrive.* | ❌ nunca no git |
| `Calendario.html` | — | **A saída gerada** (template + dado). Artefato, não fonte. | ❌ gitignored |

Não há subpastas (além desta, `docs/estudo/`).

> 🎯 **A política do `.gitignore` só vale se for verificada, não só declarada.**
> Antes de qualquer `git init`/`git add -A` numa cópia deste projeto, confirme que o
> dado real está mesmo fora do alcance: `git check-ignore -v dados.json` precisa
> **responder** (aponta a regra e a linha do `.gitignore` que casou). Se vier vazio,
> o próximo commit levaria dado de saúde pro histórico — e histórico do git não
> esquece por apagar o arquivo depois. Regra prática, não só teoria: foi esse
> comando que autorizou o commit inicial deste próprio material de estudo.

## 3. O insight central: existem DOIS tempos de execução

Confundir esses dois é o erro nº 1 de quem lê o projeto. São separados no tempo e no lugar.

### ⏱️ Tempo A — Build (raro: só quando muda um remédio, dose ou evento)

```
dados.json  ──┐
              ├──▶  node gerar.mjs  ──▶  Calendario.html  (pendrive + pasta local)
template.html ┘
```

O `gerar.mjs` roda **uma vez**, de cima a baixo, produz o arquivo e termina. Não é
servidor. Passos:

1. Descobre onde está o `dados.json` (argumento → senão procura o pendrive → senão local).
2. Lê e faz `JSON.parse` (com erro amigável se o JSON estiver quebrado).
3. Lê o `template.html` e confere que o marcador existe.
4. Serializa o dado (`JSON.stringify`), escapando `</` pra não fechar o `<script>` cedo.
5. Substitui o marcador pelo JSON (via **função**, pra `$` no dado não virar referência).
6. Escreve a saída em 1 ou 2 lugares, tolerando falha de um deles.
7. Imprime um resumo com as contagens.

### ⏱️ Tempo B — Runtime (toda vez que a página abre, e a cada segundo)

```
abrir Calendario.html
   └▶ o navegador executa o <script> do template
        └▶ lê o objeto DADOS embutido
             └▶ recalcula tudo a partir de "hoje"
                  └▶ pinta 6 regiões do DOM
   setInterval(tique, 1000) ──▶ relógio ao vivo + recarrega na virada do dia
```

A partida da página, na ordem em que roda no fim do script (7 chamadas em 6 passos —
o relógio são duas: `tique()` uma vez + `setInterval`):

1. `pintarContadores()` — dias desde cada evento + medidor rumo ao próximo marco.
2. `tique()` + `setInterval` — h/m/s ao vivo; `location.reload()` quando o dia vira.
3. `pintarHoje()` — períodos ativos hoje, agrupados por momento (manhã/tarde/jantar/noite).
4. `pintarProximas()` — mudanças com data **≥ hoje**.
5. `pintarHistorico()` — mudanças com data **≤ hoje**, por mês, mais recentes primeiro.
6. `pintarPendencias()` — o bloco amarelo "a confirmar".

## 4. Pontos de entrada e o "fio" principal

- **Entrada do build:** `gerar.mjs` é um _script top-level_ — não tem `function main()`;
  ele **é** o main, executa da primeira à última linha.
- **Entrada do runtime:** o `<script>` do template. As **7 chamadas** no final (depois
  de todas as definições — as 6 da lista acima, sendo o relógio duas delas: `tique()`
  uma vez + `setInterval`) são o "main" da página.

O fio completo, ponta a ponta:

> editar `dados.json` → `node gerar.mjs` (injeta no marcador) → `Calendario.html` →
> abrir no navegador → o script lê `DADOS` + a data de hoje → 6 funções preenchem o
> DOM → `setInterval` mantém o relógio vivo e recarrega à meia-noite.

## 5. Tecnologias, bibliotecas e padrões

**Tecnologias**
- **HTML5**; **CSS3** com Custom Properties (variáveis), Grid, Flexbox e media queries
  `prefers-color-scheme`, `prefers-reduced-motion` e `print`; **SVG inline** nos ícones.
- **JavaScript puro** (ES2020+), sem framework. APIs do navegador: DOM, `Date`,
  `Intl` (`toLocaleDateString`), `requestAnimationFrame`, `setInterval`, `location.reload`.
- **Node.js com ES Modules** (`import`, `import.meta.url`) e só módulos nativos:
  `node:fs`, `node:os`, `node:path`, `node:url`.
- **Bash** (`sync-pendrive.sh`).

**Bibliotecas de terceiros:** _nenhuma_ — e isso é proposital (offline, longevidade,
"não instalar nada").

**Padrões e conceitos** (detalhados em `CONCEITOS.md`):
separação código × dado · single source of truth + artefato derivado · templating por
injeção em build-time · estado derivado do tempo (a página não envelhece) ·
idempotência · programação defensiva / fail-soft · funções puras e composição ·
view = f(state) · escape/segurança · design tokens / theming · acessibilidade
(HTML semântico, `prefers-reduced-motion`) — **sem** _progressive enhancement_: a
página depende de JS pra qualquer conteúdo (ver Armadilhas de
[`template-html.explicado.md`](template-html.explicado.md)).

## 6. Mapa das conexões (quem lê o quê)

```
dados.exemplo.json          template.html (runtime)
  eventos[]      ─────────▶  pintarContadores()  (nome, inicio, cor, obs)
  medicamentos[].periodos ▶ pintarHoje() / pintarProximas() / pintarHistorico()
  confirmar[]    ─────────▶  pintarPendencias()

gerar.mjs  lê  template.html + dados.json  →  escreve  Calendario.html
sync-pendrive.sh  copia o código  →  <pendrive>/Calendario/codigo/
```
