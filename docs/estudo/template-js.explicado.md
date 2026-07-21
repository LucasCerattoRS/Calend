# `template.html` — parte 3/3: JavaScript (detalhado)

Espelho de estudo do **comportamento** — o miolo da página. Material de leitura; não
altera nada. Versão enxuta: [`template-js.resumo.md`](template-js.resumo.md).

Este é o **Tempo B (runtime)** do [mapa](00-ARQUITETURA.md): roda no navegador quando a
página abre. A estrutura do arquivo é: primeiro **definições** (helpers e funções),
depois, lá no fim, as **chamadas** que disparam tudo. Vamos na ordem do código.

> Como ler cada bloco: 📌 O quê · ⚙️ Como · 🎯 Porquê · 🔤 Sintaxe · 🧠 Conceito ·
> 🔀 Alternativas · ⚠️ Armadilhas

---

## Bloco 0 — A costura com o build (linha 199)

```js
const DADOS = /*DADOS*/{}/*FIM*/;
```

📌 **O quê.** A variável que segura **todo o dado** da página.

🧠 **Conceito — a emenda entre os dois tempos.** No `template.html` (versionado), isto é
um objeto **vazio** `{}` cercado pelos marcadores `/*DADOS*/…/*FIM*/`. O `gerar.mjs`
(Tempo A) **substitui** esse trecho pelo JSON do `dados.json`. Então, no `Calendario.html`
gerado, `DADOS` já vem **preenchido**. Aqui é onde build e runtime se tocam.

⚠️ **Armadilha.** Como o dado é **embutido** no arquivo, editar o `dados.json` **não**
atualiza uma página já gerada — é preciso rodar o `gerar.mjs` de novo. (O que se atualiza
sozinho é o **cálculo a partir de hoje**, não o dado em si.)

---

## Bloco 1 — Ferramentas de data (linhas 201–214)

```js
const isoDe = (d) => [d.getFullYear(), d.getMonth() + 1, d.getDate()]
  .map((n, i) => (i ? String(n).padStart(2, '0') : n)).join('-');
const hoje = new Date();
const hojeISO = isoDe(hoje);

const diaDe = (iso) => { const [a, m, d] = iso.slice(0, 10).split('-').map(Number); return new Date(a, m - 1, d); };
const DIA_MS = 86400000;
const diasEntre = (a, b) => Math.round((diaDe(b) - diaDe(a)) / DIA_MS);
const fmtData = (iso) => diaDe(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const fmtLongo = (iso) => diaDe(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
const mesCurto = (iso) => diaDe(iso).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
const plural = (n, s, p) => `${n} ${n === 1 ? s : p}`;
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
```

📌 **O quê.** Um kit de funções puras pra converter, comparar e formatar datas. Tudo em
**horário local** — decisão deliberada do projeto.

🔤 **Sintaxe — _arrow functions_.** `const f = (x) => …` é uma função enxuta. Quando o
corpo é uma expressão só, ela é **retornada** sem `return`. Quando tem `{ }`, precisa de
`return` explícito (veja `diaDe`).

⚙️ **Como, função por função.**
- `isoDe(d)` — de um `Date` pra string `"AAAA-MM-DD"`. Monta um array
  `[ano, mês+1, dia]` e usa `.map((n, i) => …)`: no índice `0` (ano) devolve o número
  cru; nos outros, **preenche com zero à esquerda** (`padStart(2, '0')`, pra "7" virar
  "07"). `join('-')` cola com hífen.
- `diaDe(iso)` — o caminho inverso: `"AAAA-MM-DD"` → `Date` local à meia-noite.
  `iso.slice(0, 10)` pega só a parte da data (ignora hora, se houver); `split('-')`
  separa; `.map(Number)` converte pra número; `new Date(a, m - 1, d)` cria a data.
- `diasEntre(a, b)` — quantos dias entre duas datas ISO. Subtrai dois `Date`
  (vira diferença em **milissegundos**), divide por um dia e **arredonda**.

🧠 **Conceito 1 — mês começa em ZERO.** Em JavaScript, `new Date(ano, mês, dia)` usa mês
**0–11** (janeiro = 0). Por isso `diaDe` faz `m - 1`, e `isoDe` faz `getMonth() + 1`. É a
pegadinha nº 1 de datas em JS.

🧠 **Conceito 2 — data como número.** Subtrair dois `Date` funciona porque eles se
**convertem** pra milissegundos (desde 1970). É como o JS faz aritmética de tempo.

🧠 **Conceito 3 — por que `Math.round` em `diasEntre`.** Por causa do **horário de
verão**: num dia de virada, o "dia" tem 23 ou 25 horas, e a divisão não daria um inteiro
exato. Arredondar corrige isso. (No Brasil de hoje não há horário de verão, mas a
proteção fica.)

🧠 **Conceito 4 — `Intl` (formatação localizada).** `toLocaleDateString('pt-BR', {…})`
formata a data **no padrão brasileiro** sem biblioteca: `fmtData` → `20/07/2026`,
`fmtLongo` → `20 de julho`, `mesCurto` → `jul`. O `.replace('.', '')` tira o ponto que o
pt-BR põe no mês curto ("jul." → "jul").

⚠️ **Armadilha — `diaDe` vs `new Date("AAAA-MM-DD")`.** `diaDe` monta a data **por
componentes** (local) de propósito. Passar a string direto pro `new Date` a leria como
**UTC**, deslocando o dia. Por isso o projeto tem `diaDe` e `instante` (Bloco 2), e não
usa `new Date(string)` cru.

---

## Bloco 2 — `instante` e `esc` (linhas 216–229)

```js
const instante = (s) => {
  const [f, h = ''] = String(s).split('T');
  const [a, m, d] = f.split('-').map(Number);
  const [hh = 0, mn = 0, sg = 0] = h.split(':').map(Number);
  return new Date(a, (m || 1) - 1, d || 1, hh, mn, sg);
};

const esc = (s) => String(s).replace(/[&<>"]/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
```

📌 **O quê.** `instante` transforma `"AAAA-MM-DD"` **ou** `"AAAA-MM-DDThh:mm"` num `Date`
**local**. `esc` deixa um texto **seguro** pra ir pro HTML.

🔤 **Sintaxe — _destructuring_ com valor padrão.** `const [f, h = ''] = ….split('T')`
separa em duas partes; se **não houver** `T` (só data), `h` assume `''`. Idem
`[hh = 0, mn = 0, sg = 0]`: se a hora não tiver minutos/segundos, viram 0.

🎯 **Porquê `instante` existe.** É a proteção contra o _gotcha_ do Bloco 1: construindo
por componentes, o horário é **sempre local**, com ou sem hora na string. `(m || 1) - 1`
e `d || 1` são defesas extras contra pedaços faltando.

🧠 **Conceito — `esc` e o dicionário-no-`replace`.** `String(s).replace(/[&<>"]/g, fn)`
troca cada caractere perigoso. A função recebe o caractere `c` e o busca num **objeto-mapa**
`{ '&': '&amp;', … }[c]` — usar um objeto como **tabela de tradução** é um idioma limpo.
`String(s)` garante que funcione mesmo se `s` não for string. Escapar evita que um `<`
numa nota ("PA < 12/8") quebre a página.

---

## Bloco 3 — A data de hoje no cabeçalho (linhas 231–232)

```js
document.getElementById('hoje').textContent =
  cap(hoje.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
```

📌 **O quê.** Escreve algo como "Segunda-feira, 20 de julho de 2026" no `<p id="hoje">`.

🔤 **Sintaxe — `textContent` vs `innerHTML`.** `textContent` insere **texto puro** (não
interpreta HTML) — seguro e rápido, ideal aqui. `cap(...)` deixa a inicial maiúscula
(o pt-BR devolve "segunda-feira" em minúscula).

🧠 **Conceito — este é um dos ganchos do HTML.** É a primeira das seis regiões sendo
preenchida (as outras vêm pelas funções `pintar*`).

---

## Bloco 4 — Cores e ícones embutidos (linhas 234–246)

```js
const CORES = { verde: 'var(--ev-verde)', ciano: 'var(--ev-ciano)', rosa: 'var(--ev-rosa)', roxo: 'var(--ev-rosa)' };
const corDe = (nome) => CORES[nome] || 'var(--ev-ciano)';

const ICO = {
  'manhã': `<svg ...></svg>`,
  ...
  alerta: `<svg ...></svg>`,
};
```

🧠 **Conceito — tabela de tradução + _fallback_.** `corDe` mapeia o nome do `dados.json`
(`"verde"`) pra **variável de CSS** (`var(--ev-verde)`) — fechando o ciclo dado → CSS que
vimos na parte 2. Nome desconhecido cai em ciano (`|| 'var(--ev-ciano)'`). `roxo` é um
apelido que também aponta pra rosa.

🎯 **Porquê os ícones são strings de SVG inline.** Pra funcionar **offline**, sem baixar
biblioteca de ícones. Guardados num objeto `ICO`, buscados por chave. Os SVGs usam
`stroke="currentColor"`, então **herdam a cor do texto** ao redor — mudam de cor sozinhos
conforme o tema.

---

## Bloco 5 — Marcos e progresso (linhas 248–255)

```js
const MARCOS = [7, 14, 21, 30, 60, 90, 120, 180, 270, 365, 548, 730];
function marcoDe(dias) {
  const prox = MARCOS.find((m) => m > dias);
  if (!prox) return null;
  const prev = MARCOS.filter((m) => m <= dias).pop() || 0;
  return { prox, faltam: prox - dias, frac: (dias - prev) / (prox - prev) };
}
```

📌 **O quê.** Dado um número de dias, descobre o **próximo marco** (7, 14, 21…), quanto
**falta** e a **fração** já percorrida desde o marco anterior (pra encher o medidor).

🔤 **Sintaxe — métodos de array.** `find(m => m > dias)` devolve o **primeiro** que passa
no teste (o próximo marco). `filter(m => m <= dias)` pega **todos** os já vencidos, e
`.pop()` tira o **último** (o maior) — o marco anterior. `|| 0` cobre o começo (nenhum
vencido ainda).

🧠 **Conceito — estado derivado.** Nada disso é "guardado": é **calculado** a partir de
`dias`, que por sua vez vem de "hoje − início". É o tema do projeto: a página **deriva**
tudo do tempo, então nunca fica desatualizada. Se passou de 730 dias, `prox` é `undefined`
e a função devolve `null` (o medidor some).

---

## Bloco 6 — `pintarContadores`: o render mais rico (linhas 257–281)

```js
function pintarContadores() {
  const agora = new Date();
  const alvo = document.getElementById('contadores');
  const evs = DADOS.eventos || [];
  if (!evs.length) { alvo.innerHTML = '<p class="muted">Nenhum evento registrado.</p>'; return; }
  alvo.innerHTML = evs.map((ev, i) => {
    const dias = Math.floor(Math.max(0, agora - instante(ev.inicio)) / DIA_MS);
    ...
    return `<article class="tile" style="--cor:${corDe(ev.cor)}"> ... </article>`;
  }).join('');
  requestAnimationFrame(() => alvo.querySelectorAll('.medidor .fill')
    .forEach((f) => { f.style.width = f.dataset.w; }));
}
```

📌 **O quê.** Constrói um cartão (_tile_) por evento: número de dias, semanas, medidor e
observação.

🧠 **Conceito 1 — o padrão de render "map → string → innerHTML".** `evs.map(ev => \`…\`)`
transforma **cada** evento num pedaço de HTML (via _template literal_, as crases
`` ` ``); `.join('')` cola tudo; `alvo.innerHTML = …` joga na página de uma vez. É a forma
mais simples de **view = f(dado)**: sem framework, só string.

🧠 **Conceito 2 — passar dado pro CSS.** `style="--cor:${corDe(ev.cor)}"` **define** a
variável `--cor` naquele tile; os filhos (`.ponto`, `.medidor`, `.fill`) a consomem (parte
2). O dado escolhe a cor, em tempo de render.

🧠 **Conceito 3 — `data-*` como ponte, e `requestAnimationFrame` pra animar.** Cada tile
guarda `data-vivo="${i}"` (índice do evento, usado pelo relógio) e o medidor guarda
`data-w="…%"` (a largura-alvo). O HTML entra com o `.fill` em `width: 0`; o
`requestAnimationFrame` adia o `f.style.width = f.dataset.w` pra um momento posterior, e
aí a `transition` do CSS **anima** o preenchimento.

**Precisão importa aqui:** o callback do `rAF` roda **antes do próximo paint** (ele faz
parte dos passos de renderização do navegador), não "depois de pintar". O que ele
resolve é outra coisa: se a largura final fosse setada **no mesmo fôlego** do
`innerHTML` (síncrono), o navegador nunca chegaria a **computar** o estado inicial
`width: 0` — e uma `transition` só anima uma **mudança entre dois valores computados**;
sem "antes", não há o que animar. Adiar pro `rAF` dá ao navegador a chance de registrar
o estado inicial primeiro.

⚠️ **Nuance — o idioma 100% garantido é outro.** Um `rAF` **simples** funciona nos
navegadores atuais, mas está no limite da especificação (o callback ainda roda antes do
primeiro paint do conteúdo novo). As formas à prova de discussão são: **`rAF` duplo**
(`requestAnimationFrame(() => requestAnimationFrame(mudar))`) ou **forçar reflow** antes
de mudar (`void f.offsetWidth`). Vale conhecer as três.

⚠️ **Armadilha — ordem de chamada.** Como o relógio (`tique`) procura os elementos
`[data-vivo]`, `pintarContadores` **precisa** rodar **antes** de `tique`. Veja a ordem no
Bloco 12.

---

## Bloco 6b — o template do tile por dentro (linhas 262–277)

O Bloco 6 mostrou o esqueleto; agora o miolo que estava elidido — é onde mora a sintaxe
mais densa do arquivo.

```js
alvo.innerHTML = evs.map((ev, i) => {
  const dias = Math.floor(Math.max(0, agora - instante(ev.inicio)) / DIA_MS);
  const sem = Math.floor(dias / 7); const resto = dias % 7;
  const semTxt = sem >= 1
    ? ` · ${plural(sem, 'semana', 'semanas')}${resto ? ` e ${plural(resto, 'dia', 'dias')}` : ''}` : '';
  const m = marcoDe(dias);
  return `<article class="tile" style="--cor:${corDe(ev.cor)}">
    <h3><span class="ponto"></span>${esc(ev.nome)}</h3>
    <div class="valor">${dias}<span> ${dias === 1 ? 'dia' : 'dias'}</span></div>
    <div class="sub">desde ${fmtLongo(ev.inicio)}${semTxt}</div>
    <div class="vivo" data-vivo="${i}">&nbsp;</div>
    ${m ? `<div class="medidor"><div class="fill" data-w="${(m.frac * 100).toFixed(1)}%"></div></div>
    <div class="meta"><span>rumo a ${m.prox} dias</span><span>${m.faltam === 1 ? 'falta 1' : `faltam ${m.faltam}`}</span></div>`
  : `<div class="meta"><span>acima de ${MARCOS[MARCOS.length - 1]} dias — marco máximo vencido</span></div>`}
    ${ev.obs ? `<div class="nota">${esc(ev.obs)}</div>` : ''}
  </article>`;
}).join('');
```

🎯 **Porquê `Math.floor` aqui, se `diasEntre` usa `Math.round`?** Não é descuido — são
**perguntas diferentes**:
- O contador responde "quantas janelas de **24 h completas** se passaram desde o instante
  X?". `floor`: com 6,9 dias corridos, mostra **6** — o 7º dia só conta quando **fecha**.
  Isso casa com o relógio ao lado ("e 21 h 36 min…"): dias fechados + horas correndo.
- `diasEntre` responde "quantos dias de **calendário** entre duas datas?" (meia-noite a
  meia-noite). Aí `round` protege da aritmética não-inteira do horário de verão.

Trocar um pelo outro daria um contador que "vira" na hora errada, ou rótulos "em N dias"
errados. Guarde o par: **instante decorrido → floor; distância de calendário → round.**

🔤 **Sintaxe — template literal DENTRO de template literal.** Em
`${m ? `<div…>…` : `<div…>…`}`, as crases **internas** abrem novas strings dentro da
expressão do `${…}` — é legal porque cada `${}` avalia uma expressão completa, e uma
template literal **é** uma expressão. Poderoso, mas no limite da legibilidade; a
alternativa seria montar `medidorHtml` numa variável antes do `return`.

⚙️ **Os demais detalhes, um a um.**
- `Math.max(0, agora - instante(...))` — um evento com início **no futuro** não vira
  contagem negativa: trava em 0 (e o tile mostra "0 dias").
- `sem`/`resto` — divisão inteira + resto (`% 7`): "153 dias" vira "21 semanas e 6 dias".
  No `semTxt`, `${resto ? … : ''}` usa **0 como falsy**: "e 0 dias" nunca aparece.
- `&nbsp;` no `.vivo` — um espaço "duro" como conteúdo provisório. Junto com o
  `min-height: 1.3em` do CSS, **reserva a linha** antes do primeiro `tique()` — sem pulo
  de layout quando o relógio chega.
- `data-w="${(m.frac * 100).toFixed(1)}%"` — a fração vira porcentagem com 1 casa
  (`"37.5%"`), já no formato que `style.width` aceita. Fica **guardada** no atributo até
  o `requestAnimationFrame` aplicá-la (Conceito 3 acima).
- `MARCOS[MARCOS.length - 1]` — o idioma clássico pra "último item" (o moderno seria
  `MARCOS.at(-1)`). É o caso `marcoDe() === null`: acima de 730 dias, sem medidor.
- `${ev.obs ? `…` : ''}` — o idioma "campo opcional no render", que você verá 3× de novo
  no Bloco 8b.

---

## Bloco 7 — `tique`: o relógio vivo e a virada do dia (linhas 283–296)

```js
function tique() {
  const agora = new Date();
  if (isoDe(agora) !== hojeISO) { location.reload(); return; }
  document.querySelectorAll('[data-vivo]').forEach((el) => {
    const ev = (DADOS.eventos || [])[Number(el.getAttribute('data-vivo'))];
    if (!ev) return;
    const ms = Math.max(0, agora - instante(ev.inicio));
    const h = Math.floor(ms / 3600000) % 24;
    const mnt = Math.floor(ms / 60000) % 60;
    const s = Math.floor(ms / 1000) % 60;
    el.textContent = `e ${h} h ${String(mnt).padStart(2, '0')} min ${String(s).padStart(2, '0')} s`;
  });
}
```

📌 **O quê.** Roda a cada segundo (via `setInterval`, Bloco 12). Faz duas coisas.

⚙️ **Como.**
1. **Virou o dia?** Se `isoDe(agora)` (a data de agora) mudou em relação a `hojeISO` (a
   data de quando a página abriu), chama `location.reload()` — recarrega a página, que
   recalcula tudo pra a nova data. É o que faz a página **nunca envelhecer** deixada
   aberta.
2. **Senão**, atualiza cada relógio ao vivo: pega o evento pelo `data-vivo`, calcula os
   ms desde o início e quebra em **h : min : s** com aritmética de resto (`%`).

🔤 **Sintaxe — a matemática do relógio.** `Math.floor(ms / 3600000) % 24` = horas dentro
do dia; `% 60` para minutos e segundos. `padStart(2, '0')` mantém dois dígitos ("09").

🧠 **Conceito — laço de tempo e derivação contínua.** Junto com o `tabular-nums` do CSS
(parte 2), o número não "pula". É a mesma filosofia: o valor exibido é **derivado do
relógio**, atualizado de fininho.

🔤 **Sintaxe — `getAttribute('data-vivo')` vs `dataset.vivo`.** O glossário apresenta
`el.dataset.x`, mas aqui o código usa `el.getAttribute('data-vivo')`. São duas portas
pro **mesmo** atributo: `dataset` é a API dedicada (converte nomes: `data-meu-x` →
`dataset.meuX`); `getAttribute` é a genérica, direta e explícita. Ambas devolvem
**string** — daí o `Number(...)` pra virar índice do array. (Repare que o próprio
arquivo usa as duas: aqui `getAttribute`; no medidor, `f.dataset.w`.)

🧠 **Nuance de runtime — `setInterval` em aba de segundo plano.** Navegadores
**estrangulam** timers de abas fora de foco (tipicamente pra no máximo ~1 disparo por
minuto; aba suspensa, nem isso). O relógio "congela"… e, ao voltar o foco, **pula
direto pro valor certo**. Por quê? Porque `tique()` **recalcula do zero** a partir de
`new Date()` a cada chamada, em vez de incrementar um contador (`s++`). Um relógio
incremental **atrasaria de verdade** a cada estrangulamento. É a filosofia do projeto
(estado **derivado**, nunca acumulado) pagando dividendo de graça — e a virada de dia
também se recupera: o primeiro tique depois de a aba "acordar" percebe a data nova e
dispara o `location.reload()`.

---

## Bloco 8 — O que vale hoje (linhas 298–336)

```js
const ativoEm = (p, iso) => p.de <= iso && (!p.ate || p.ate >= iso);
const nomeCompleto = (m) => m.nome + (m.apresentacao ? ` ${m.apresentacao}` : '');

function pintarHoje() {
  const porMomento = new Map();
  for (const m of DADOS.medicamentos || []) {
    for (const p of m.periodos || []) {
      if (!ativoEm(p, hojeISO)) continue;
      const k = p.momento || 'sem horário';
      if (!porMomento.has(k)) porMomento.set(k, []);
      porMomento.get(k).push({ m, p });
    }
  }
  const ordem = ['manhã', 'tarde', 'jantar', 'noite'];
  const chaves = [...porMomento.keys()].sort((a, b) => {
    const ia = ordem.indexOf(a); const ib = ordem.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  ...
}
```

📌 **O quê.** Descobre quais períodos estão **ativos hoje**, agrupa por **momento** e
desenha, na ordem manhã → tarde → jantar → noite.

🧠 **Conceito 1 — teste de intervalo (`ativoEm`).** `p.de <= iso && (!p.ate || p.ate >=
iso)`: hoje está **dentro** do período? Compara **strings de data** (funciona pelo formato
ISO — ver o espelho do dado). `!p.ate` trata o período em aberto (`ate: null`) como "sem
fim".

🧠 **Conceito 2 — agrupar com `Map`.** `porMomento` é um `Map` (dicionário ordenado)
"momento → lista de itens". O padrão `if (!map.has(k)) map.set(k, [])` cria a lista na
primeira vez; depois só empurra. `{ m, p }` guarda o remédio **e** o período juntos
(_shorthand_ de `{ m: m, p: p }`).

🧠 **Conceito 3 — ordenar por uma ordem canônica.** Os momentos precisam sair numa ordem
**humana**, não alfabética. `ordem.indexOf(a)` dá a posição desejada; quem não está na
lista vira `99` (vai pro fim). O `sort` compara essas posições. Assim "manhã" (0) vem
antes de "noite" (3), e "sem horário" (99) por último.

🔤 **Sintaxe — `[...porMomento.keys()]`.** O _spread_ `...` transforma o iterador de
chaves do `Map` num **array**, pra poder ordenar.

---

## Bloco 8b — o render de "Hoje": chips e campos opcionais (linhas 321–335)

A parte do render que estava elidida:

```js
alvo.innerHTML = chaves.map((k) => `
  <div class="momento">
    <div class="m-rotulo">${ICO[k] || ICO['sem horário']}<span>${esc(k)}</span></div>
    <ul class="itens">${porMomento.get(k).map(({ m, p }) => `
      <li>
        <div class="linha">
          <span class="med">${esc(m.nome)}${m.apresentacao ? ` <span class="apres">${esc(m.apresentacao)}</span>` : ''}${
            p.de === hojeISO ? '<span class="chip bom"><i></i>começa hoje</span>' : ''}${
            p.ate === hojeISO ? '<span class="chip aviso"><i></i>último dia</span>' : ''}</span>
          <span class="dose">${esc(p.dose)}</span>
        </div>
        ${p.nota ? `<div class="nota">${esc(p.nota)}</div>` : ''}
      </li>`).join('')}
    </ul>
  </div>`).join('');
```

⚙️ **Como.**
- **`map` dentro de `map`:** o HTML aninhado espelha o dado aninhado — momentos por fora
  (`chaves.map`), itens por dentro (`porMomento.get(k).map`). Cada nível tem seu
  `.join('')`.
- **`.map(({ m, p }) => …)`** — _destructuring_ direto no parâmetro: cada item da lista é
  `{ m, p }` (remédio + período, guardados juntos no Bloco 8).
- **`ICO[k] || ICO['sem horário']`** — _fallback_ de ícone: um momento fora do combinado
  (ex.: `"madrugada"`) **mantém o rótulo com o texto real** (`esc(k)`), mas ganha o ícone
  de relógio. Dado imprevisto **degrada**, não quebra.

🧠 **Conceito — os dois chips são comparações de igualdade com hoje.**
`p.de === hojeISO` → chip verde "**começa hoje**"; `p.ate === hojeISO` → chip amarelo
"**último dia**". Repare que **não** é um `else if`: um período de um dia só
(`de` = `ate` = hoje) ganharia **os dois chips** — e estaria certo, é primeiro e último
dia ao mesmo tempo.

🔤 **Sintaxe — o idioma "opcional no render", 3×.** `apresentacao`, os chips e a `nota`
usam todos `${cond ? \`html\` : ''}`: campo ausente/condição falsa viram **string
vazia**, e o HTML simplesmente não ganha aquele pedaço. É o jeito de tolerar campos
opcionais **na saída** (o espelho do que o `|| []` faz na **entrada**).

---

## Bloco 9 — Derivar a linha do tempo (linhas 338–368)

```js
const PESO = { marco: 0, fim: 1, inicio: 2 };
function mudancas() {
  const evs = [];
  for (const m of DADOS.medicamentos || []) {
    for (const p of m.periodos || []) {
      const base = { nome: nomeCompleto(m), detalhe: `${p.dose}${p.momento ? ` · ${p.momento}` : ''}`, cor: null };
      evs.push({ data: p.de, tipo: 'inicio', ...base, nota: p.nota || null });
      if (p.ate) evs.push({ data: p.ate, tipo: 'fim', ...base, nota: null });
    }
  }
  for (const ev of DADOS.eventos || []) {
    evs.push({ data: ev.inicio.slice(0, 10), tipo: 'marco', nome: ev.nome, detalhe: null, nota: null, cor: ev.cor || null });
  }
  return evs.sort((a, b) => a.data.localeCompare(b.data) || PESO[a.tipo] - PESO[b.tipo]);
}
```

📌 **O quê.** Transforma o modelo de dados numa **lista única de acontecimentos** datados:
cada período vira um "início" e (se tem fim) um "fim"; cada evento vira um "marco".

🧠 **Conceito 1 — _flatten_ / derivar um fluxo de eventos.** As duas listas do
`dados.json` (medicamentos e eventos) são "achatadas" numa só, ordenada por data. Essa
lista é a **fonte** tanto do "Próximas" quanto do "Histórico" — que são só **filtros**
dela (Bloco 10 e 11). Escrever a derivação **uma vez** e filtrar é mais limpo que montar
duas listas separadas.

🔤 **Sintaxe — _spread_ de objeto `...base`.** `{ data, tipo, ...base, nota }` copia as
chaves de `base` (nome, detalhe, cor) pra dentro do novo objeto — evita repetir. `nota:
p.nota || null` normaliza "sem nota" pra `null`.

🧠 **Conceito 2 — ordenar com desempate.** `a.data.localeCompare(b.data) || PESO[a.tipo]
- PESO[b.tipo]`: ordena por **data**; se empatar (mesma data), `localeCompare` devolve
`0` (falso), e o `||` cai pro **segundo critério**, o `PESO` (marco < fim < início). É o
idioma "ordene por X, depois por Y".

🎯 **Porquê `itemMudanca(e, futuro)` recebe um `futuro`.** O mesmo acontecimento é escrito
como **"começa"** no futuro e **"começou"** no passado. Uma função de render só, com um
sinalizador, serve às duas seções (princípio **DRY** — não repita).

---

## Bloco 9b — os ajudantes do meio: `agruparPorData` e `itemMudanca` (linhas 355–368)

```js
function agruparPorData(lista) {
  const g = new Map();
  for (const e of lista) { if (!g.has(e.data)) g.set(e.data, []); g.get(e.data).push(e); }
  return [...g.entries()];
}

function itemMudanca(e, futuro) {
  const verbo = e.tipo === 'fim' ? 'último dia de'
    : e.tipo === 'inicio' ? (futuro ? 'começa' : 'começou') : '';
  const dot = `<i class="tdot ${e.tipo}"${e.cor ? ` style="--cor:${corDe(e.cor)}"` : ''}></i>`;
  return `<li>${dot}${verbo ? `${verbo} ` : ''}<b>${esc(e.nome)}</b>${
    e.detalhe ? ` <span class="det">· ${esc(e.detalhe)}</span>` : ''}${
    e.nota ? `<div class="nota">${esc(e.nota)}</div>` : ''}</li>`;
}
```

📌 **`agruparPorData`.** O **mesmo** padrão de agrupamento com `Map` do Bloco 8, agora
com a **data** como chave.

🔤 **Sintaxe — `[...g.entries()]`.** `entries()` devolve um **iterador** de pares
`[chave, valor]`; o _spread_ o materializa num **array de pares** `[data, itens]`. Por
que materializar? Porque quem consome precisa de coisas que iterador não tem: o
`for (const [data, itens] of grupos)` funcionaria com os dois, mas o
**`.reverse()`** do histórico só existe em array. E como `Map` **preserva a ordem de
inserção** e a lista chegou **ordenada por data** (do `sort` de `mudancas`), os grupos
saem ordenados de graça — o agrupamento não desfaz a ordenação.

📌 **`itemMudanca`.** Um `<li>` para um acontecimento, em três peças:
- **`verbo`** — ternário encadeado por tipo: `fim` → "último dia de"; `inicio` →
  "começa"/"começou" conforme `futuro`; `marco` cai no `''` (eventos como "Sobriedade"
  não ganham verbo, só o nome em negrito). Por isso o `${verbo ? \`${verbo} \` : ''}`
  logo adiante — sem verbo, sem espaço órfão.
- **`dot`** — a bolinha `.tdot` com a **classe do tipo** (o CSS pinta `inicio` de verde,
  `fim` de amarelo); pros **marcos com cor**, injeta `--cor` inline — a mesma ponte
  JS→CSS dos tiles, casando com o `var(--cor, var(--mudo))` de _fallback_ do CSS
  (parte 2, Bloco 7).
- **A linha final** — `esc()` em **tudo** que vem do dado (`nome`, `detalhe`, `nota`) e o
  idioma "opcional no render" 2×.

---

## Bloco 10 — `pintarProximas` (linhas 370–388)

```js
function pintarProximas() {
  const grupos = agruparPorData(mudancas().filter((e) => e.data >= hojeISO));
  ...
  const rel = d === 0 ? 'hoje' : d === 1 ? 'amanhã' : `em ${plural(d, 'dia', 'dias')}`;
  ...
}
```

📌 **O quê.** Pega a linha do tempo, **filtra o futuro** (`data >= hoje`), agrupa por data
e desenha cada dia com um rótulo relativo ("hoje", "amanhã", "em 5 dias").

🧠 **Conceito — filtrar o fluxo derivado.** Note como é pouco código: toda a lógica pesada
está em `mudancas()` e `agruparPorData()`; aqui é só **filtrar + formatar**. Reuso em
ação.

🔤 **Sintaxe — ternário encadeado.** `d === 0 ? 'hoje' : d === 1 ? 'amanhã' : '…'` é um
`if/else if/else` compacto.

---

## Bloco 11 — `pintarHistorico` (linhas 390–412)

```js
function pintarHistorico() {
  const passadas = mudancas().filter((e) => e.data <= hojeISO);
  ...
  const grupos = agruparPorData(passadas).reverse();
  let html = ''; let mesAtual = ''; let aberto = false;
  for (const [data, itens] of grupos) {
    const mes = cap(diaDe(data).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }));
    if (mes !== mesAtual) {
      if (aberto) html += '</ul>';
      html += `<div class="mes">${mes}</div><ul class="hist">`;
      mesAtual = mes; aberto = true;
    }
    ...
  }
  if (aberto) html += '</ul>';
  alvo.innerHTML = html;
}
```

📌 **O quê.** O espelho de "Próximas", pro **passado** (`data <= hoje`), do mais recente
pro mais antigo, com **separadores de mês**.

🧠 **Conceito 1 — cabeçalho de seção com estado corrente.** Diferente das outras funções
(que usam `.map`), aqui o HTML é montado **imperativamente** numa string, porque é preciso
**abrir** um `<ul>` novo a cada mês e **fechar** o anterior. `mesAtual` lembra o mês atual;
`aberto` lembra se há um `<ul>` pendente pra fechar. É o padrão clássico de "agrupar com
cabeçalho" quando a marcação não é uniforme.

🧠 **Conceito 2 — `.reverse()` pra ordem decrescente.** A linha do tempo vem crescente; o
histórico quer o recente primeiro, daí o `reverse()`.

⚠️ **Observação de comportamento (não é bug).** "Próximas" usa `>= hoje` e "Histórico"
usa `<= hoje` — logo, uma mudança **datada hoje** aparece **nas duas** ("começa" numa,
"começou" na outra). É defensável (hoje é o eixo); só é bom saber que é proposital.

---

## Bloco 12 — `pintarPendencias` e a partida (linhas 414–430)

```js
function pintarPendencias() {
  const itens = DADOS.confirmar || [];
  if (!itens.length) return;
  document.getElementById('pendencias').innerHTML = `
    <div class="card avisos" role="alert">
      <h3>${ICO.alerta}A confirmar — isto ainda não está definido; não invente, confirme antes</h3>
      <ol>${itens.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>
    </div>`;
}

pintarContadores();
tique();
setInterval(tique, 1000);
pintarHoje();
pintarProximas();
pintarHistorico();
pintarPendencias();
```

📌 **`pintarPendencias`.** Se há itens em `confirmar`, desenha o **bloco amarelo de
aviso**; senão, `return` — e o `#pendencias` fica vazio. `role="alert"` sinaliza a leitores
de tela que é um aviso importante. É a **filosofia do projeto em código**: mostrar o que
falta em vez de inventar.

📌 **A "partida" (as 7 chamadas finais).** Tudo acima eram **definições**; aqui é o
**ponto de entrada** que executa a página. A **ordem importa**:
1. `pintarContadores()` cria os tiles (e os elementos `[data-vivo]`).
2. `tique()` roda **uma vez** já pra preencher o relógio (sem esperar 1 segundo) — e
   precisa dos elementos do passo 1.
3. `setInterval(tique, 1000)` agenda o relógio pra cada segundo dali em diante.
4–7. As demais seções pintam.

🧠 **Conceito — script _top-level_, sem `main()`.** Não há função "principal"; as chamadas
soltas no fim **são** o programa. Como o `<script>` está no fim do `<body>`, o HTML já
existe quando ele roda — por isso os `getElementById` encontram os ganchos.

---

## Recapitulando o JavaScript

- **Definições primeiro, chamadas no fim.** As 7 chamadas finais são o ponto de entrada.
- **Datas 100% locais** (`isoDe`/`diaDe`/`instante`), com os _gotchas_ tratados: mês
  base-0, `new Date(string)` = UTC, e `Math.round` pro horário de verão.
- **Render sem framework:** `dado.map(x => \`html\`).join('')` → `innerHTML`. O JS ainda
  **passa cor pro CSS** via `--cor` e **anima** o medidor com `requestAnimationFrame`.
- **Uma linha do tempo derivada** (`mudancas`) alimenta "Próximas" e "Histórico" só por
  **filtro** — reuso limpo. `itemMudanca(e, futuro)` serve às duas com um sinalizador.
- **Agrupar com `Map`**, **ordenar com desempate** (`||`), **relativos** ("hoje/amanhã/há
  N dias").
- **Auto-atualização:** `tique` recarrega na virada do dia; o resto é derivado de "hoje".
- **Segurança e cuidado:** `esc` em todo texto do usuário; `role="alert"`; e a recusa a
  inventar (pendências).

➡️ Próximo no roteiro: **Etapa 4 — `sync-pendrive.sh`** (o script Bash de distribuição).
