# `template.html` — parte 2/3: CSS (detalhado)

Espelho de estudo da **aparência**. Material de leitura; não altera nada.
Versão enxuta: [`template-css.resumo.md`](template-css.resumo.md).

O CSS aqui é um **mini design system**: define _tokens_ (variáveis de cor/estilo) uma
vez e constrói tudo em cima deles. O truque que vale ouro: **quase nenhuma regra usa uma
cor crua** — usam `var(--token)`. Assim, trocar o tema é reescrever só os tokens.

> Como ler cada bloco: 📌 O quê · ⚙️ Como · 🎯 Porquê · 🔤 Sintaxe · 🧠 Conceito ·
> 🔀 Alternativas · ⚠️ Armadilhas

---

## Bloco 1 — Os _tokens_ no `:root` (linhas 12–20)

```css
:root {
  --plano: #f9f9f7; --superficie: #fcfcfb;
  --ink: #0b0b0b; --ink2: #52514e; --mudo: #898781;
  --linha: #e1e0d9; --borda: rgba(11,11,11,.10);
  --ev-verde: #008300; --ev-ciano: #2a78d6; --ev-rosa: #d55181;
  --bom: #0ca30c; --bom-texto: #006300;
  --aviso: #fab219; --aviso-texto: #7a5600;
  --sombra: 0 1px 2px rgba(11,11,11,.05), 0 8px 24px rgba(11,11,11,.05);
}
```

📌 **O quê.** Declara as **variáveis de CSS** (custom properties) do tema claro. Cada uma
é um _token_: um nome com significado, apontando pra um valor.

🔤 **Sintaxe.**
- `:root` é o seletor da raiz do documento (o `<html>`), o lugar canônico pra variáveis
  globais.
- `--nome: valor;` **declara** uma variável; depois se usa com `var(--nome)`.
- `rgba(11,11,11,.10)` é preto com **10% de opacidade** — uma borda que escurece o fundo
  sem ser uma cor sólida.

🧠 **Conceito — _design tokens_ e nomes por papel.** Repare que os nomes dizem **função**,
não aparência: `--plano` (o fundo da página), `--superficie` (o fundo dos cartões),
`--ink`/`--ink2`/`--mudo` (a **hierarquia** do texto: forte, médio, apagado), `--linha`
(divisórias), `--bom`/`--aviso` (verde/amarelo semânticos). Isso é o coração de um
_design system_: você pensa em "texto secundário", não em "#52514e".

🧠 **Conceito — camadas e hierarquia.** `--plano` < `--superficie` cria a ilusão de
**elevação** (o cartão "flutua" sobre a página), reforçada por `--sombra`. E os três tons
de texto criam **hierarquia visual** sem mudar tamanho.

🎯 **Porquê os `--ev-*` (verde/ciano/rosa).** São as cores de identidade dos eventos,
escolhidas e **validadas para daltonismo** (o comentário das linhas 10–11 cita a
paleta). O `dados.json` diz só `"verde"`; o CSS guarda o pixel exato.

---

## Bloco 2 — O tema escuro (linhas 21–30)

```css
@media (prefers-color-scheme: dark) {
  :root {
    --plano: #0d0d0d; --superficie: #1a1a19;
    --ink: #ffffff; --ink2: #c3c2b7; --mudo: #898781;
    --linha: #2c2c2a; --borda: rgba(255,255,255,.10);
    --ev-ciano: #3987e5;
    --bom-texto: #0ca30c; --aviso-texto: #fab219;
    --sombra: none;
  }
}
```

📌 **O quê.** Quando o sistema do usuário está no **modo escuro**, **redefine** os tokens.

🔤 **Sintaxe — `@media (prefers-color-scheme: dark)`.** Uma _media query_ que "liga" essas
regras só quando o SO pede tema escuro. Como redefine as **mesmas variáveis** no `:root`,
elas sobrescrevem as do Bloco 1.

🧠 **Conceito — theming por sobreposição de variáveis.** Este é o pulo do gato: **todo o
resto do CSS** (cartões, texto, medidores…) referencia `var(--token)` e **nunca** cita
uma cor crua. Então este único bloco **reskin-a a página inteira**. Sem ele, você teria
que duplicar dezenas de regras com cores diferentes.

⚙️ **Detalhes finos.**
- Só sobrescreve o que precisa mudar — `--ev-verde`, `--ev-rosa`, `--bom` e `--aviso`
  **nem aparecem** (os mesmos valores servem nos dois temas). Detalhe honesto: `--mudo`
  **está** na lista, mas redeclarado com o **mesmo** valor (`#898781`) — é redundante,
  inofensivo; o princípio "só o que muda" vale pros quatro tokens ausentes.
- `--ev-ciano` fica **mais claro** (`#3987e5`) pra brilhar no escuro.
- `--sombra: none` — sombra não "lê" em fundo preto; no escuro, a borda faz o trabalho.

⚠️ **Armadilha.** Se alguma regra usasse uma cor fixa (ex.: `color:#000`) em vez de
`var(--ink)`, ela **não** se adaptaria e "furaria" o tema escuro. A disciplina de sempre
usar token é o que faz o sistema funcionar.

---

## Bloco 3 — Reset e base (linhas 32–38)

```css
* { box-sizing: border-box; }
body {
  margin: 0; padding: 26px 16px 60px; background: var(--plano); color: var(--ink);
  font: 16px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  -webkit-text-size-adjust: 100%;
}
.wrap { max-width: 880px; margin: 0 auto; }
```

🔤 **Sintaxe / 🧠 Conceitos.**
- `* { box-sizing: border-box }` — o **reset** mais útil do CSS. Faz `width`/`height`
  **incluírem** padding e borda, em vez de somarem por fora. Sem isso, dar padding a algo
  com `width:100%` estoura o tamanho. O `*` aplica a todos os elementos.
- `font: 16px/1.5 system-ui, …` — **atalho** (shorthand) da fonte: `tamanho/altura-de-linha
  família`. `16px/1.5` = corpo 16px com espaçamento de linha 1.5×.
- `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` — a **pilha de fontes do
  sistema**: usa a fonte nativa de cada SO. **Zero download de fonte** — coerente com o
  offline. A vírgula é a lista de _fallback_ (tenta a 1ª, senão a 2ª…).
- `-webkit-text-size-adjust: 100%` — impede o iOS de **inflar** o texto sozinho ao girar
  a tela.
- `.wrap { max-width: 880px; margin: 0 auto }` — **centraliza** o conteúdo: largura
  máxima + margens automáticas dos dois lados.

---

## Bloco 4 — Tipografia e o cartão (linhas 40–47)

```css
h1 { font-size: 1.45rem; margin: 0; letter-spacing: -.015em; }
.data-hoje { margin: 2px 0 0; color: var(--ink2); font-size: .92rem; }
h2 { font-size: .75rem; text-transform: uppercase; letter-spacing: .09em;
     color: var(--mudo); font-weight: 700; margin: 28px 0 10px; }
.card { background: var(--superficie); border: 1px solid var(--borda);
        border-radius: 14px; padding: 16px 18px; box-shadow: var(--sombra); }
```

🧠 **Conceito — `rem` vs `px`.** `rem` é relativo ao tamanho de fonte da raiz (16px por
padrão). `1.45rem` ≈ 23px, mas **escala** se o usuário aumentar a fonte base — mais
acessível que `px` fixo.

🧠 **Conceito — o rótulo "sobrancelha" (`h2`).** Os `h2` viram **rótulos pequenos, em
CAIXA ALTA, espaçados e apagados** (`text-transform: uppercase`, `letter-spacing`,
`color: var(--mudo)`). É um padrão de UI pra títulos de seção discretos.

📌 `.card` é a "casca" reutilizável: superfície + borda + cantos arredondados + sombra.
Vários blocos herdam esse visual.

---

## Bloco 5 — Contadores: grade fluida e o medidor (linhas 49–68)

```css
.tiles { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(232px, 1fr)); }
...
.tile .ponto { width: 8px; height: 8px; border-radius: 50%; background: var(--cor); flex: none; }
.tile .vivo { ... font-variant-numeric: tabular-nums; min-height: 1.3em; }
.medidor { ... background: var(--linha);
           background: color-mix(in srgb, var(--cor) 15%, transparent); }
.medidor .fill { height: 100%; width: 0; background: var(--cor);
                 border-radius: 0 4px 4px 0; transition: width .6s ease; }
```

🧠 **Conceito 1 — grade responsiva sem _media query_ (padrão "RAM").**
`repeat(auto-fit, minmax(232px, 1fr))` significa: "encaixe **quantas colunas couberem**,
cada uma com **no mínimo 232px** e crescendo igualmente (`1fr`)". Em telas largas viram
várias colunas; em telas estreitas, uma só — **sem** escrever _breakpoints_. (RAM =
_Repeat, Auto-fit, Minmax_.)

🧠 **Conceito 2 — variável setada pelo JS (`--cor`).** O `.ponto`, o `.medidor` e o
`.fill` usam `var(--cor)`, mas **essa variável não está no CSS** — o JavaScript a define
**por tile** (`style="--cor: var(--ev-verde)"`, na parte 3). Ou seja: o dado escolhe a
cor, e o CSS só a **consome**. Variáveis de CSS "descem" pros filhos (herdam).

🧠 **Conceito 3 — `tabular-nums` contra o "pulo".** O `.vivo` é o relógio ao vivo
(h/min/seg). `font-variant-numeric: tabular-nums` faz todos os dígitos terem a **mesma
largura**, então o número não "dança" a cada segundo. `min-height` reserva o espaço pra
não haver salto de layout enquanto ele não é preenchido.

🧠 **Conceito 4 — _fallback_ progressivo com propriedade repetida.** O `.medidor` declara
`background` **duas vezes**: primeiro `var(--linha)` (simples), depois
`color-mix(...)` (mistura moderna). Navegadores que **não** entendem `color-mix`
**ignoram** a 2ª linha e ficam com a 1ª. Navegadores modernos usam a 2ª. É _graceful
degradation_ em duas linhas.

🧠 **Conceito 5 — transição.** `.fill` nasce com `width: 0` e tem `transition: width .6s
ease`. Quando o JS muda a largura, ela **anima** em 0,6s (o medidor "enche"). (Como o JS
dispara isso vem na parte 3, com `requestAnimationFrame`.)

---

## Bloco 6 — Combinadores: espaço **entre**, não em volta (linhas 70–91)

```css
.momento + .momento { border-top: 1px solid var(--linha); margin-top: 12px; padding-top: 12px; }
.itens > li + li { margin-top: 9px; }
.chip.bom { color: var(--bom-texto); background: rgba(12,163,12,.12); }
```

🔤 **Sintaxe — combinadores.**
- `A + B` (**irmão adjacente**): estiliza `B` só quando vem **logo depois** de `A`. Por
  isso `.momento + .momento` põe divisória **entre** momentos, mas **não** acima do
  primeiro. Idem `li + li`: espaço entre itens, sem sobra no topo.
- `A > B` (**filho direto**): `.itens > li` pega só os `li` filhos imediatos de `.itens`.

🧠 **Conceito — chips/badges.** `.chip` é uma "pílula" (`border-radius: 99px`,
`inline-flex`) com uma cor semântica: `.bom` (verde, "começa hoje") e `.aviso` (amarelo,
"último dia"). O `i` interno é a bolinha colorida. Tinta translúcida (`rgba(...,.12)`) dá
o fundo suave.

---

## Bloco 7 — Próximas e a linha do tempo do histórico (linhas 93–132)

```css
.prox-corpo { min-width: 0; }
...
.hist { position: relative; margin: 0; padding: 0 0 0 18px; list-style: none;
        border-left: 2px solid var(--linha); }
.hist > li::before { content: ""; position: absolute; left: -24px; top: 5px; width: 9px;
                     height: 9px; border-radius: 50%; background: var(--mudo);
                     border: 2px solid var(--superficie); }
.tdot.marco { background: var(--cor, var(--mudo)); }
```

⚠️ **Armadilha famosa — `min-width: 0` no flex.** Itens de _flexbox_ têm largura mínima
"automática" = o conteúdo. Isso impede textos longos de quebrarem e faz "vazar". `min-width:
0` libera o item a **encolher** e quebrar linha. É um dos _gotchas_ mais comuns do flex.

🧠 **Conceito — linha do tempo com `::before` + posição absoluta.** O trilho vertical é a
`border-left` do `<ul class="hist">`. Cada bolinha é um **pseudo-elemento** `::before`
(um elemento "fantasma" criado pelo CSS via `content: ""`) posicionado **absolutamente**
sobre o trilho (`left: -24px`). A borda da cor da superfície faz a bolinha "furar" o
trilho. Zero HTML extra pros pontos.

🔤 **Sintaxe — `var()` com _fallback_.** `var(--cor, var(--mudo))` usa `--cor` **se
existir**; senão, cai pra `--mudo`. O 2º argumento do `var()` é o valor reserva. (Os
marcos de evento têm cor; os pontos comuns caem no cinza.)

---

## Bloco 8 — A grade "duplo": ordem visual ≠ ordem do HTML (linhas 142–150)

```css
.duplo { display: grid; gap: 0 22px; }
@media (min-width: 780px) {
  .duplo { grid-template-columns: 1fr 1fr; align-items: start;
           grid-template-areas: "hoje prox" "hist prox"; }
  .s-hoje { grid-area: hoje; } .s-prox { grid-area: prox; } .s-hist { grid-area: hist; }
}
```

📌 **O quê.** No celular, uma coluna só (ordem do HTML: Hoje → Próximas → Histórico). A
partir de **780px de largura**, vira duas colunas com um desenho específico.

🧠 **Conceito 1 — `grid-template-areas` (layout em "ASCII").** Você **desenha** o layout
com nomes: `"hoje prox"` (linha 1) e `"hist prox"` (linha 2). Depois cada seção reivindica
uma área (`grid-area: hoje`). Resultado: **Hoje** em cima à esquerda, **Histórico**
embaixo à esquerda, e **Próximas** ocupando a **coluna direita inteira** (aparece nas duas
linhas). É legível como um mapa.

🧠 **Conceito 2 — _mobile-first_ e ordem visual desacoplada.** A base é o celular; a
_media query_ **adiciona** o desktop. E repare: no desktop, o **Histórico** aparece antes
do **Próximas** visualmente (coluna esquerda), mas no **HTML** a ordem é Próximas antes de
Histórico. O Grid deixa **reordenar visualmente** sem mexer no HTML — e o HTML mantém a
ordem que faz sentido pra leitor de tela e pro celular.

⚠️ **Armadilha.** Reordenar visualmente com Grid/Flex pode **divergir** da ordem de
leitura (foco do teclado, leitor de tela seguem o HTML). Aqui a ordem do HTML foi mantida
sensata de propósito — mas é um ponto de atenção de acessibilidade sempre que se reordena.

---

## Bloco 9 — Movimento reduzido e impressão (linhas 156–162)

```css
@media (prefers-reduced-motion: reduce) { .medidor .fill { transition: none; } }
@media print {
  :root { --plano: #fff; --superficie: #fff; --ink: #000; ... --sombra: none; }
  body { padding: 0; }
  .tile, .card { break-inside: avoid; }
}
```

🧠 **Conceito — _media queries_ de acessibilidade e contexto.**
- `prefers-reduced-motion: reduce` — se o usuário pediu **menos animação** (por enjoo,
  vestibular), o medidor **não anima**. Respeitar isso é acessibilidade.
- `@media print` — um **CSS só pra impressão**: reseta os tokens pra **preto no branco**
  (economiza tinta, garante contraste no papel), tira o padding e usa
  `break-inside: avoid` pra um cartão **não** ser cortado no meio entre duas páginas.

🎯 **Porquê isso importa.** Mostra maturidade: a página se comporta bem em **contextos que
não são "tela clara, com mouse"** — no escuro, impressa, e pra quem evita animação.

---

## Recapitulando o CSS

- **Tokens no `:root`** nomeados por papel; o **tema escuro** só reescreve os tokens, e a
  página inteira se adapta porque **ninguém usa cor crua**.
- Base sólida: `box-sizing: border-box`, fonte do sistema (offline), `rem` acessível.
- Padrões modernos: grade fluida `auto-fit/minmax` (sem breakpoint), `grid-template-areas`
  (layout desenhado), variável `--cor` vinda do **JS**, `color-mix` com _fallback_,
  linha do tempo com `::before`.
- _Gotchas_ que valem lembrar: `min-width: 0` no flex; combinadores `+`/`>` pra espaçar
  "entre"; ordem visual ≠ ordem do HTML.
- Cuidado com o usuário: `prefers-reduced-motion` e um `@media print` de verdade.

➡️ Próximo: **parte 3/3 — o JavaScript** (`template-js.explicado.md`): o miolo que lê o
`DADOS` e preenche os seis ganchos.
