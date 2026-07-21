# 🧪 Casos-limite — "o que acontece se…"

Comportamento **verificado de verdade**, não suposto: cada caso abaixo foi executado em
**2026-07-20** ("hoje" de referência) com o código real do projeto —

- casos de **runtime** via `harness-runtime.mjs`, que roda o `<script>` do
  `template.html` em Node com um DOM mínimo:
  `node docs/estudo/harness-runtime.mjs caso.json` (adicione `--html` pra ver o HTML cru);
- casos de **build** rodando o próprio `gerar.mjs` com saída em pasta temporária.

Cada caso traz o **JSON exato usado**, pra você reproduzir. Datas são relativas ao dia
da verificação — pra reproduzir depois, desloque-as em relação ao seu "hoje".

---

## Build (`gerar.mjs`)

### B1. JSON quebrado (vírgula sobrando / sintaxe inválida)

```json
{ "eventos": [ { "nome": "X", }, ] }
```

**Aconteceu:** mensagem amigável no stderr e `exit 1`; nada foi escrito.

```
O …/i-quebrado.json não é um JSON válido: Expected double-quoted property name in JSON at position 30 (line 1 column 31)
Confira vírgula sobrando, aspas e chaves — o dado não foi tocado.
```

**Por quê:** `JSON.parse` lança `SyntaxError`; o `try/catch` traduz (gerar.mjs, l. 46–52).
A mensagem do Node ainda aponta linha/coluna — útil pra achar o erro. ✅ falha limpa.

### B2. Raiz não é objeto (array, número, string…)

```json
[ 1, 2, 3 ]
```

**Aconteceu:** `O …/j-array.json precisa ser um objeto { … } com eventos/medicamentos.`
e `exit 1`.

**Por quê:** a validação tripla `!dados || typeof !== 'object' || Array.isArray`
(gerar.mjs, l. 53–56). ✅ falha limpa.

### B3. Caso de sucesso (controle)

`node gerar.mjs dados.exemplo.json <saida>` → gerou um HTML autocontido de ~22 KB,
`exit 0`, e o relatório "1 evento(s), 1 medicamento(s), 1 pendência(s)".

---

## Runtime (o script da página)

### R1. `DADOS = {}` (objeto vazio — nenhuma chave)

```json
{}
```

**Aconteceu:** a página abre **inteira e educada**, com os quatro estados vazios:

```
#pendencias: (vazio)
#contadores: Nenhum evento registrado.
#hojeMed:    Nenhum medicamento ativo hoje.
#proximas:   Nada agendado à frente. Quando a próxima troca for definida, ela aparece aqui.
#historico:  Nada registrado ainda.
```

**Por quê:** todo consumo é defensivo (`DADOS.eventos || []` etc.) e cada `pintar*` tem
um ramo de lista vazia. ✅ degrada perfeitamente.

### R2. Dois períodos **ativos ao mesmo tempo** no mesmo remédio

```json
{ "medicamentos": [ { "nome": "Remédio A", "periodos": [
  { "de": "2026-07-01", "ate": null,         "dose": "1 comprimido",    "momento": "manhã" },
  { "de": "2026-07-15", "ate": "2026-07-25", "dose": "meio comprimido", "momento": "noite" } ] } ] }
```

**Aconteceu:** os **dois aparecem**, cada um no seu momento:
`#hojeMed: manhã Remédio A 1 comprimido · noite Remédio A meio comprimido`.

**Por quê:** `pintarHoje` filtra períodos, não remédios — não existe regra "um período
por remédio". ⚠️ Nota: sobreposição **não é erro** aqui (ex.: dose de manhã + dose à
noite do mesmo fármaco), mas uma sobreposição **acidental** (esqueceu de fechar o
período anterior num desmame) também apareceria duplicada — a página mostraria as duas
doses. A disciplina de fechar `ate` é sua.

### R3. Período invertido (`de` > `ate`)

```json
{ "medicamentos": [ { "nome": "Remédio B", "periodos": [
  { "de": "2026-07-25", "ate": "2026-07-10", "dose": "1 comprimido", "momento": "manhã" } ] } ] }
```

**Aconteceu:** nunca ativo em "Hoje" (`Nenhum medicamento ativo hoje`) — mas a linha do
tempo exibe o **absurdo sem reclamar**: "último dia de Remédio B" em 10/07 (Histórico)
**antes** de "começa Remédio B" em 25/07 (Próximas).

**Por quê:** `ativoEm` exige `de <= hoje <= ate`, impossível com intervalo invertido; já
`mudancas()` emite os eventos de início/fim sem validar coerência. ⚠️ Não quebra, mas
**não avisa** — é o caso mais traiçoeiro da tabela: o dado errado fica visível, porém
plausível. Se um remédio "sumir" do Hoje, confira se `de`/`ate` não foram trocados.

### R4. Evento com início **no futuro**

```json
{ "eventos": [ { "nome": "Viagem", "inicio": "2026-07-30T00:00", "cor": "rosa" } ] }
```

**Aconteceu:** tile mostra **"Viagem 0 dias desde 30 de julho — rumo a 7 dias,
faltam 7"**, e o marco aparece em Próximas: `30 jul · em 10 dias · Viagem`.

**Por quê:** o `Math.max(0, agora - instante(...))` trava a contagem em 0 (nada de "-10
dias"); `marcoDe(0)` devolve `{prox: 7, faltam: 7, frac: 0}` (medidor zerado); e
`mudancas()` põe o marco na linha do tempo, que em Próximas é futuro normal.
✅ comportamento razoável — o contador "espera" o dia chegar.

### R5. `confirmar` ausente × `confirmar: []`

```json
{}
```
```json
{ "confirmar": [] }
```

**Aconteceu:** **idênticos** — `#pendencias: (vazio)` nos dois.

**Por quê:** `DADOS.confirmar || []` normaliza ausência pra lista vazia e
`if (!itens.length) return;` some com o bloco. ⚠️ Consequência já apontada no espelho do
dado: "sem pendências" e "esqueci de listar" são **indistinguíveis** na tela.

### R6. Cor desconhecida (`"laranja"`)

```json
{ "eventos": [ { "nome": "Teste", "inicio": "2026-07-01T00:00", "cor": "laranja" } ] }
```

**Aconteceu:** o tile sai com `style="--cor:var(--ev-ciano)"` (verificado com `--html`)
— ou seja, **ciano**, sem nenhum aviso.

**Por quê:** `corDe = (nome) => CORES[nome] || 'var(--ev-ciano)'`. ⚠️ Fallback
**silencioso**: se dois eventos tiverem cores fora do mapa, ambos ficam ciano e a
identidade visual se perde sem erro nenhum.

### R7. Momento desconhecido (`"madrugada"`)

```json
{ "medicamentos": [
  { "nome": "Remédio C", "periodos": [ { "de": "2026-07-01", "ate": null, "dose": "1 cp", "momento": "madrugada" } ] },
  { "nome": "Remédio D", "periodos": [ { "de": "2026-07-01", "ate": null, "dose": "1 cp", "momento": "noite" } ] } ] }
```

**Aconteceu:** `#hojeMed: noite Remédio D 1 cp · madrugada Remédio C 1 cp` — o grupo
"madrugada" **existe e mantém o rótulo**, mas vai pro **fim** (depois de "noite") e usa o
**ícone de relógio** do "sem horário" (verificado no HTML: o `<circle r="9">`).

**Por quê:** `ordem.indexOf('madrugada')` = −1 → vira 99 no sort (fim da fila);
`ICO[k] || ICO['sem horário']` cobre o ícone. ✅ degrada bem — texto preservado, ordem e
ícone genéricos.

### R8. Momento **sem acento** (`"manha"`)

```json
{ "medicamentos": [ { "nome": "Remédio E", "periodos": [
  { "de": "2026-07-01", "ate": null, "dose": "1 cp", "momento": "manha" } ] } ] }
```

**Aconteceu:** grupo rotulado `manha` (sem acento, como veio), tratado como momento
**desconhecido** — mesmo destino do R7 (fim da ordem, ícone de relógio).

**Por quê:** a "enum por convenção" compara strings **exatas**; `"manha" !== "manhã"`.
⚠️ O erro de digitação **não some nem grita** — aparece sutilmente errado. Confira o
acento quando um remédio cair no lugar errado da lista.

### R9. Período de **um dia só** (`de` = `ate` = hoje)

```json
{ "medicamentos": [ { "nome": "Remédio F", "periodos": [
  { "de": "2026-07-20", "ate": "2026-07-20", "dose": "dose única", "momento": "manhã" } ] } ] }
```

**Aconteceu:** em Hoje, o item ganha **os dois chips**: `Remédio F [começa hoje]
[último dia] dose única`. E a mudança datada de hoje aparece em **Próximas E
Histórico** (rotulada "hoje" nas duas).

**Por quê:** os chips são dois `if` independentes (`p.de === hojeISO` e
`p.ate === hojeISO`), não um `else if` — e um período de um dia é de fato primeiro E
último dia. Os filtros `>= hoje` / `<= hoje` incluem ambos o dia de hoje (decisão já
documentada no espelho do JS). ✅ estranho à primeira vista, correto ao pensar.

---

## Resumo da postura do código

| Situação | Postura |
|---|---|
| Dado **malformado** (JSON inválido, raiz errada) | **falha alta e clara, no build** — nada chega à página |
| Dado **ausente** (chaves, campos opcionais) | **degrada silenciosa e corretamente** (estados vazios, `\|\| []`) |
| Dado **fora da convenção** (cor, momento, intervalo invertido) | **degrada silenciosamente** — funciona, mas sem avisar ⚠️ |

A terceira linha é a lição: as convenções (`cor` do mapa, `momento` com acento,
`de ≤ ate`) são **contratos com você mesmo** — o código não os fiscaliza. Ver
[`DECISOES.md`](DECISOES.md) sobre por que não há um validador de schema.
