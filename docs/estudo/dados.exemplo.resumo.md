# `dados.exemplo.json` — resumo (enxuto)

Folha de consulta rápida. Versão a fundo:
[`dados.exemplo.explicado.md`](dados.exemplo.explicado.md).

**O que é.** Um objeto JSON com **3 listas de dado** + 1 recado. É o **contrato/schema**
do projeto: todo o resto existe pra exibir isto.

```json
{ "_leia": "recado", "eventos": [ … ], "medicamentos": [ … ], "confirmar": [ … ] }
```

**Campos.**
| Onde | Campo | Tipo | Papel | Quem lê |
|---|---|---|---|---|
| raiz | `_leia` | string | comentário disfarçado (ignorado) | ninguém |
| evento | `nome` | string | rótulo do contador | `pintarContadores` |
| evento | `inicio` | data ISO **com hora** | início da contagem | `pintarContadores` |
| evento | `cor` | `verde\|ciano\|rosa\|roxo` | identidade visual (símbolo, não hex) | `pintarContadores` |
| evento | `obs` | string? | nota opcional | `pintarContadores` |
| remédio | `nome` | string | nome do medicamento | pintar Hoje/Próximas/Histórico |
| remédio | `apresentacao` | string? | forma/concentração | idem |
| remédio | `periodos` | array | **intervalos de validade** | idem |
| período | `de` | data | início (inclusive) | `ativoEm` |
| período | `ate` | data \| `null` | fim (inclusive) ou aberto | `ativoEm` |
| período | `dose` | string | texto livre ("1 comprimido") | idem |
| período | `momento` | `manhã\|tarde\|jantar\|noite` | quando tomar (agrupa/ícone) | `pintarHoje` |
| período | `nota` | string? | observação do período | idem |
| raiz | `confirmar` | string[] | pendências → aviso amarelo | `pintarPendencias` |

**A ideia central.** Um remédio = lista de **períodos** (`[de, ate]` com dose/momento).
"O que tomo hoje" = filtrar os períodos que **contêm a data de hoje**. Um **desmame** é o
mesmo remédio com **2 períodos** e doses diferentes — o histórico sai de graça.

**Gotchas.**
- JSON: **sem** comentário, **sem** vírgula sobrando, chaves com **aspas duplas**.
- `inicio` com `T00:00` (senão `new Date` leria como **UTC** e adiantaria o contador).
- Datas em `AAAA-MM-DD`: a comparação no código é **textual** (só funciona com esse formato).
- `ate: null` = "em aberto **de propósito**" (diferente de esquecer o campo).
- `momento` tem que bater **exatinho**, com acento; senão cai em "sem horário".
- `cor` fora do mapa → vira **ciano**, sem erro.
- `confirmar` vazio e ausente ficam **iguais** na tela (o bloco só some).
