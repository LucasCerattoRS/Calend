# `template.html` — parte 3/3: JavaScript (resumo)

Folha de consulta. Versão a fundo: [`template-js.explicado.md`](template-js.explicado.md).

**Forma do arquivo.** Primeiro **definições**; no fim, **7 chamadas** que executam a
página (o ponto de entrada). Roda no navegador quando a página abre.

**`const DADOS = /*DADOS*/{}/*FIM*/`** — a costura com o build: o `gerar.mjs` troca o `{}`
pelo JSON. O dado é **embutido** (regerar é preciso pra mudar o dado; o cálculo por "hoje"
é que se atualiza sozinho).

**Helpers de data (linhas 201–229).**
| Helper | Faz |
|---|---|
| `isoDe(Date)` → `"AAAA-MM-DD"` | data local → string ISO |
| `diaDe(iso)` → `Date` | string ISO → data local à meia-noite |
| `instante(iso)` → `Date` | idem, aceitando hora; **sempre local** |
| `diasEntre(a,b)` | diferença em dias (`Math.round` p/ horário de verão) |
| `fmtData/fmtLongo/mesCurto` | formatação pt-BR via `Intl` |
| `esc(s)` | escapa `& < > "` antes do `innerHTML` |

**As 6 pinturas (cada uma preenche 1 gancho).**
| Função | Preenche | Faz |
|---|---|---|
| `pintarContadores` | `#contadores` | tiles: dias, semanas, medidor; passa `--cor` p/ o CSS |
| `tique` (1×/s) | `[data-vivo]` | relógio h/m/s; **recarrega** na virada do dia |
| `pintarHoje` | `#hojeMed` | períodos ativos hoje, agrupados por momento (`Map`) |
| `pintarProximas` | `#proximas` | `mudancas()` filtrado por `data >= hoje` |
| `pintarHistorico` | `#historico` | `mudancas()` filtrado por `data <= hoje`, por mês |
| `pintarPendencias` | `#pendencias` | `confirmar` → aviso amarelo (`role="alert"`) |

**Motor comum.** `mudancas()` **deriva uma linha do tempo única** (início/fim de período +
marcos de evento), ordenada por data com desempate `PESO` (marco<fim<início). "Próximas" e
"Histórico" são só **filtros** dela; `itemMudanca(e, futuro)` serve às duas ("começa" vs
"começou").

**Padrões/idiomas.**
- Render: `dado.map(x => \`html\`).join('')` → `innerHTML` (**view = f(estado)**).
- `style="--cor:${corDe(ev.cor)}"` — JS **passa cor pro CSS**.
- `requestAnimationFrame(...)` — anima o medidor **depois** do primeiro paint.
- Agrupar com `Map`; ordenar com desempate via `||`; ternário encadeado p/ relativos.

**Gotchas.**
- **Mês base-0** (`new Date(a, m-1, d)`); `new Date("AAAA-MM-DD")` = **UTC** (por isso `diaDe`/`instante`).
- `pintarContadores` usa `Math.floor` (24 h **completas**, casa com o relógio ao lado);
  `diasEntre` usa `Math.round` (dias de **calendário**, protege do horário de verão).
- Aba em 2º plano: o navegador **estrangula** `setInterval`; o relógio congela e **pula
  pro valor certo** ao voltar (tudo é recalculado de `new Date()`, nunca incrementado).
- O rAF roda **antes** do próximo paint; o idioma garantido pra animar seria rAF duplo.
- Comparação de datas é **textual** (só vale no formato ISO).
- `pintarContadores` **antes** de `tique` (o relógio precisa dos `[data-vivo]`).
- `textContent` (texto puro) vs `innerHTML` (interpreta HTML → por isso o `esc`).
- Hoje aparece em **Próximas e Histórico** (`>=` e `<=`) — proposital.
