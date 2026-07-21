# 🔀 Fluxogramas

Os principais fluxos do projeto, em [Mermaid](https://mermaid.js.org) (renderiza no
GitHub, VS Code com extensão, e muitos leitores de Markdown) **e** em texto, pra ler em
qualquer lugar.

---

## 1. Visão geral — os dois tempos

```mermaid
flowchart LR
  subgraph A["Tempo A — Build (raro)"]
    D[dados.json] --> G[node gerar.mjs]
    T[template.html] --> G
    G --> H[Calendario.html]
  end
  subgraph B["Tempo B — Runtime (toda abertura)"]
    H --> N[navegador executa o script]
    N --> R[recalcula a partir de hoje]
    R --> V[pinta 6 regiões do DOM]
  end
```

**Em texto:** `dados.json` + `template.html` → `gerar.mjs` → `Calendario.html`; abrir no
navegador → script lê `DADOS` + data de hoje → pinta a página.

---

## 2. Build — o que o `gerar.mjs` faz

```mermaid
flowchart TD
  start([node gerar.mjs]) --> entrada{"entrada:<br/>argumento? pendrive? local?"}
  entrada -->|nenhum existe| erro1[erro + exit 1]
  entrada -->|achou| parse{"JSON.parse<br/>válido?"}
  parse -->|não| erro2[erro amigável + exit 1]
  parse -->|é objeto?| valida{objeto?}
  valida -->|não| erro3[erro + exit 1]
  valida -->|sim| saidas[decide saídas<br/>pendrive + local, sem duplicar]
  saidas --> marc{"template tem<br/>o marcador?"}
  marc -->|não| erro4[erro + exit 1]
  marc -->|sim| inj["serializa + escapa &lt;/ + injeta (função)"]
  inj --> escreve[escreve cada saída<br/>try/catch por arquivo]
  escreve --> resumo([imprime contagens])
```

**Em texto:** achar dado → validar (existe? é JSON? é objeto?) → planejar saídas → conferir
marcador → injetar com segurança → escrever tolerando falha → relatar.

---

## 3. Runtime — a partida da página

```mermaid
flowchart TD
  open([página abre]) --> defs[define helpers e funções]
  defs --> c1["pintarContadores() — cria tiles e [data-vivo]"]
  c1 --> t1["tique() uma vez — preenche o relógio"]
  t1 --> si["setInterval(tique, 1000)"]
  si --> resto["pintarHoje / Proximas / Historico / Pendencias"]
  si -. a cada segundo .-> tick{"virou o dia?"}
  tick -->|sim| reload[location.reload]
  tick -->|não| vivo[atualiza h/min/seg]
```

**Ordem que importa:** `pintarContadores` **antes** de `tique` (o relógio precisa dos
elementos `[data-vivo]`).

---

## 4. O motor comum: uma linha do tempo, dois filtros

```mermaid
flowchart LR
  meds[medicamentos.periodos] --> mud["mudancas()<br/>início + fim"]
  evs[eventos] --> mud
  mud --> ordena[ordena por data<br/>desempate: marco &lt; fim &lt; início]
  ordena -->|"data ≥ hoje"| prox[pintarProximas]
  ordena -->|"data ≤ hoje"| hist[pintarHistorico]
```

**Em texto:** `mudancas()` achata períodos e eventos numa lista única ordenada; "Próximas"
e "Histórico" são só **filtros** dela (por isso hoje aparece nas duas).

---

## 5. Modelo de dados

```mermaid
flowchart TD
  raiz["dados.json (objeto)"] --> ev["eventos[]"]
  raiz --> med["medicamentos[]"]
  raiz --> conf["confirmar[] (strings)"]
  ev --> evc["nome · inicio · cor · obs?"]
  med --> medc["nome · apresentacao?"]
  med --> per["periodos[]"]
  per --> perc["de · ate|null · dose · momento · nota?"]
```

**Em texto:** um objeto com 3 listas; medicamento tem **períodos** (intervalos `[de, ate]`
com dose/momento) — o conceito central do formato.

---

## 6. `tique()` — o laço do relógio

```mermaid
flowchart TD
  a([a cada 1s]) --> b{"isoDe(agora) ≠ hojeISO?"}
  b -->|sim, virou o dia| c[location.reload]
  b -->|não| d["para cada [data-vivo]:<br/>ms = agora − início<br/>mostra h/min/seg"]
```

**Em texto:** se o dia virou, recarrega (a página se renova sozinha); senão, atualiza os
relógios ao vivo.
