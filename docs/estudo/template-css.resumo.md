# `template.html` — parte 2/3: CSS (resumo)

Folha de consulta. Versão a fundo: [`template-css.explicado.md`](template-css.explicado.md).

**Ideia central.** Um mini _design system_: **tokens** (`--var`) no `:root`, e quase
nenhuma regra usa cor crua — todas usam `var(--token)`. Por isso o **tema escuro**
reescreve só os tokens e a página inteira se adapta.

**Tokens (por papel, não por cor).**
| Token | Papel |
|---|---|
| `--plano` / `--superficie` | fundo da página / fundo dos cartões (elevação) |
| `--ink` / `--ink2` / `--mudo` | texto forte / médio / apagado (hierarquia) |
| `--linha` / `--borda` | divisórias / bordas translúcidas |
| `--ev-verde/ciano/rosa` | cores de evento (validadas p/ daltonismo) |
| `--bom` / `--aviso` (+ `-texto`) | verde / amarelo semânticos |
| `--sombra` | sombra dos cartões (vira `none` no escuro) |

**Theming.** `@media (prefers-color-scheme: dark) { :root { …sobrescreve tokens… } }`.
Só muda o que precisa; o resto herda.

**Padrões que valem levar.**
| Padrão | Faz |
|---|---|
| `* { box-sizing: border-box }` | padding/borda **não** estouram o tamanho |
| `font: 16px/1.5 system-ui, …` | fonte do sistema, **zero download** (offline) |
| `grid-template-columns: repeat(auto-fit, minmax(232px,1fr))` | colunas fluidas **sem** breakpoint |
| `grid-template-areas: "hoje prox" "hist prox"` | layout **desenhado**; ordem visual ≠ HTML |
| `background: X; background: color-mix(...)` | _fallback_ progressivo (repete a propriedade) |
| `var(--cor, var(--mudo))` | variável com valor reserva |
| `transition: width .6s ease` | o medidor **anima** ao encher |

**Gotchas.**
- **`min-width: 0`** libera item de flex a encolher/quebrar (senão "vaza").
- Combinadores `A + B` (irmão adjacente) e `A > B` (filho direto): espaço **entre**, não em volta.
- A variável `--cor` é setada pelo **JS** por tile — o CSS só consome.
- Reordenar com Grid muda o **visual**, não a ordem de foco/leitor de tela (segue o HTML).
- Tem `@media (prefers-reduced-motion)` e `@media print` (preto-no-branco, `break-inside: avoid`).
