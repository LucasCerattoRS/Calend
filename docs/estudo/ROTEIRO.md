# 🧭 Roteiro de estudo

Ordem escolhida: **seguir o fluxo de dados** — primeiro o _dado_ que entra, depois o
_build_ que o transforma, depois a _página_ que o exibe. É a ordem que faz cada peça já
chegar explicada quando a próxima precisar dela.

## Duas versões por arquivo

Cada arquivo de código tem **dois** espelhos, pra dois momentos de estudo:

- **`*.explicado.md` (detalhado)** — leitura profunda, da primeira vez. Vai a fundo em
  sintaxe, conceito, alternativas e armadilhas.
- **`*.resumo.md` (enxuto)** — folha de consulta rápida, pra **revisar** depois, colar na
  parede, ou repassar antes dos exercícios.

Método: leia o **detalhado** tampando as explicações e tentando prever o que o código faz;
volte ao **resumo** pra fixar; teste-se no `EXERCICIOS.md` sem colar.

> Estrutura de cada bloco no detalhado: 📌 O quê · ⚙️ Como · 🎯 Porquê · 🔤 Sintaxe ·
> 🧠 Conceito · 🔀 Alternativas · ⚠️ Armadilhas

## Ordem e progresso

Duas colunas de checkbox abaixo, com papéis diferentes — não confunda uma com a
outra:

- **Material pronto** — já vem marcado. Diz se o arquivo **existe e foi
  verificado**; é sobre o material, não sobre você. Não desmarque.
- **Meu progresso** — começa **vazio**, de propósito. É seu: marque só quando
  **você** realmente estudou aquele arquivo (leu tampando as explicações,
  entendeu o porquê, não só passou o olho).

**Etapa 0 — Panorama** _(leia antes de tudo)_
| Material pronto | Meu progresso | Arquivo |
|---|---|---|
| [x] | [ ] | `00-ARQUITETURA.md` — o mapa geral e os dois tempos de execução. |
| [x] | [ ] | `ROTEIRO.md` — este arquivo. |

**Etapa 1 — O dado (o que entra)**
| Material pronto | Meu progresso | Arquivo |
|---|---|---|
| [x] | [ ] | `dados.exemplo.explicado.md` |
| [x] | [ ] | `dados.exemplo.resumo.md` |

**Etapa 2 — O build (como o dado vira página)**
| Material pronto | Meu progresso | Arquivo |
|---|---|---|
| [x] | [ ] | `gerar.explicado.md` |
| [x] | [ ] | `gerar.resumo.md` |

**Etapa 3 — A página (o que sai e roda no navegador)**
| Material pronto | Meu progresso | Arquivo |
|---|---|---|
| [x] | [ ] | `template-html.explicado.md` / `.resumo.md` — estrutura e as 6 âncoras. |
| [x] | [ ] | `template-css.explicado.md` / `.resumo.md` — design system: tokens, temas, grade, print. |
| [x] | [ ] | `template-js.explicado.md` / `.resumo.md` — o miolo: datas, contadores, 6 pinturas. |

**Etapa 4 — Distribuição**
| Material pronto | Meu progresso | Arquivo |
|---|---|---|
| [x] | [ ] | `sync-pendrive.explicado.md` / `.resumo.md` — o script Bash de sync. |

**Etapa 5 — Camada conceitual** _(consulta transversal)_
| Material pronto | Meu progresso | Arquivo |
|---|---|---|
| [x] | [ ] | `CONCEITOS.md` |
| [x] | [ ] | `GLOSSARIO.md` |
| [x] | [ ] | `FLUXOGRAMA.md` |

**Etapa 6 — Praticar e se testar**
| Material pronto | Meu progresso | Arquivo |
|---|---|---|
| [x] | [ ] | `LABORATORIO.md` — experimentos de mão na massa com o `dados.exemplo.json`. |
| [x] | [ ] | `CASOS-LIMITE.md` — o que acontece com dado vazio, torto ou fora da convenção (verificado, com JSON de cada caso). |
| [x] | [ ] | `DECISOES.md` — por que o projeto **não** usa framework/lib/servidor. |
| [x] | [ ] | `EXERCICIOS.md` — perguntas do básico ao avançado, com gabarito ao final. |

✅ **Material completo** — incluindo o item 3, entregue como **cópias anotadas** em
`codigo-comentado/` (`gerar.comentado.mjs`, `template.comentado.html`). Os arquivos
originais ficaram **intactos**; pra descartar as anotações, apague a pasta.

## Pré-requisitos por etapa

| Etapa | Você vai encontrar | Bom saber antes |
|---|---|---|
| 1 | JSON, modelagem de dados, datas ISO | nada — começamos do zero |
| 2 | Node, módulos, sistema de arquivos, regex | ter lido a Etapa 1 |
| 3 | DOM, `Date`/`Intl`, template strings, CSS moderno | Etapas 1 e 2 |
| 4 | Bash, variáveis, loops | Etapa 2 |

> Legenda — coluna **Material pronto**: `[x]` arquivo existe e foi verificado (não
> mexa aqui). Coluna **Meu progresso**: `[ ]` você ainda não estudou · marque `[x]`
> conforme for terminando cada um, no seu ritmo.
