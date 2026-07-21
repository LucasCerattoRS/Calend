# 🧭 Decisões de arquitetura (ADR)

Cada entrada aqui já aparece **espalhada** nos blocos 🔀 dos arquivos `.explicado.md` —
isto é a versão **consolidada**, uma por página, no formato ADR (_Architecture Decision
Record_): contexto → decisão → alternativas rejeitadas → trade-off aceito. Serve pra
responder, de uma vez, "por que não fizeram do jeito normal?".

O fio comum de **todas** as decisões abaixo: este é um projeto de **dado de saúde
pessoal**, que precisa **sobreviver anos** sem manutenção, rodando **offline**, num
pendrive que pode ser aberto em qualquer máquina Windows ou Linux. Ferramentas normais de
web são otimizadas pro oposto disso: times, deploys frequentes, internet disponível. A
maioria das decisões aqui é "o normal seria X, mas X otimiza pra um problema que este
projeto não tem".

---

## ADR 1 — Nenhum framework de UI (React, Vue, Svelte…)

**Contexto:** a página tem 6 regiões que mudam com o dado — parece o caso de uso clássico
de um framework reativo.

**Decisão:** JavaScript puro, `innerHTML` e `dado.map(x => \`html\`).join('')`.

**Por que não React/Vue/Svelte:**
- Framework = **dependência**: um `node_modules`, um bundler, uma versão que um dia para
  de rodar ou vira alvo de vulnerabilidade sem patch. Nada disso é aceitável num arquivo
  que precisa **abrir daqui a 10 anos** sem reinstalar nada.
- A complexidade que um framework resolve — reconciliação eficiente de UI, muitos
  componentes, estado compartilhado profundo — **não existe aqui**: são 6 blocos, sem
  interação do usuário que precise re-render parcial otimizado.
- `innerHTML` bruto seria perigoso em uma app com input de usuário livre (XSS); aqui o
  "input" é um JSON que **você mesmo** escreve, e ainda assim o projeto escapa tudo com
  `esc()` — a via manual, mas sem dependência.

**Trade-off aceito:** sem componentização, sem data-binding automático — cada `pintar*`
reescreve seu bloco inteiro (`innerHTML = ...`) em vez de atualizar só o que mudou. Pra 6
blocos, redesenhar tudo é imperceptível; num app com centenas de itens interativos, isso
pesaria.

**Reconsiderar se:** o projeto crescer pra ter formulários de edição, múltiplas telas ou
interação complexa — aí a ausência de state management começa a doer.

---

## ADR 2 — `localStorage` não é usado (nem cookies, nem IndexedDB)

**Contexto:** guardar preferências (ex.: tema escolhido manualmente) é o caso clássico de
`localStorage`.

**Decisão:** nenhuma persistência no navegador. O único estado é o `DADOS` embutido no
HTML e recalculado do zero a cada abertura.

**Por que não `localStorage`:** ele vive **por navegador, por perfil, por máquina** — o
oposto de "um pendrive que abre igual em qualquer computador". Se o tema escuro fosse
salvo em `localStorage`, abrir o mesmo `Calendario.html` em outro PC mostraria um estado
diferente, sem nenhuma pista de por quê. O projeto prefere **zero estado escondido**: tudo
que a página mostra vem só do `DADOS` + `new Date()`, nada mais — mais fácil de raciocinar,
impossível de "dessincronizar".

**Trade-off aceito:** preferências (como tema) não são "lembradas" entre sessões — dependem
só do SO (`prefers-color-scheme`). Ganho: **portabilidade total** — o mesmo arquivo, em
qualquer máquina, sempre mostra o mesmo resultado pro mesmo dado e data.

**Reconsiderar se:** surgir uma preferência genuinamente pessoal-da-máquina (não do dado)
que valha a pena lembrar — nesse caso ainda seria melhor um parâmetro na URL do que
`localStorage`, pra não quebrar a portabilidade.

---

## ADR 3 — Sem servidor (nem local, nem remoto)

**Contexto:** "app de calendário/saúde" soa como caso de uso de backend + banco de dados.

**Decisão:** nenhum servidor. Um `.html` estático, aberto direto do disco (`file://`).

**Por que não um servidor (nem local tipo Flask/Express):**
- Servidor = **processo rodando** = algo que pode não estar rodando quando você precisa
  (esqueceu de iniciar, a máquina reiniciou, a porta está ocupada). Um arquivo `.html` não
  tem esse modo de falha — ou o navegador abre, ou não.
- Servidor remoto = **dado de saúde saindo da sua posse física**, dependência de internet
  pra ver "o que eu tomo hoje", e superfície de ataque (login, API, backups na nuvem) que
  não existe pra um arquivo local.
- Nenhuma das vantagens de servidor (múltiplos usuários simultâneos, dado compartilhado em
  tempo real, processamento pesado) se aplica — é **uma pessoa, um pendrive**.

**Trade-off aceito:** sem acesso remoto (não dá pra ver de outro lugar sem levar o
pendrive), sem sincronização automática entre dispositivos. Ganho: dado nunca sai de
controle físico direto, disponibilidade não depende de nada externo.

---

## ADR 4 — Sem JSON Schema / TypeScript / validador formal

**Contexto:** `CASOS-LIMITE.md` documenta várias formas do `dados.json` degradar
**silenciosamente** quando foge da convenção (cor desconhecida, momento sem acento,
período invertido) — um schema formal pegaria esses erros na hora.

**Decisão:** nenhuma validação além do mínimo em `gerar.mjs` (`é objeto? não é array?`). A
"validação" real é `dados.exemplo.json` servindo de documentação viva do formato.

**Por que não JSON Schema/TypeScript:** ambos exigem **ferramenta extra** — um validador
(`ajv` ou similar) ou um compilador (`tsc`) — quebrando a regra de "zero dependência,
roda com só `node` instalado". TypeScript, além disso, só valida em **tempo de
desenvolvimento**; no `.mjs` rodando puro em produção, o tipo já não protege nada em
runtime (precisaria de checagem manual de qualquer forma).

**Trade-off aceito, custo real:** é o próprio motivo de existir do `CASOS-LIMITE.md` — cor
errada vira ciano sem avisar, `"manha"` sem acento cai num "desconhecido" mudo, um período
invertido não é sinalizado. O projeto aposta que **um usuário só** (você, escrevendo o
próprio JSON com cuidado) é um risco aceitável menor que o custo de manter tooling.

**Reconsiderar se:** mais de uma pessoa passar a editar o `dados.json` diretamente — aí um
validador simples (mesmo que só um script `.mjs` caseiro, sem lib) começa a valer a pena.

---

## ADR 5 — Sem biblioteca de datas (date-fns, Luxon, Moment…)

**Contexto:** manipulação de data é notoriamente cheia de armadilhas (fuso, mês 0-based,
horário de verão) — exatamente o tipo de problema que libs de data existem pra resolver.

**Decisão:** só `Date` nativo + `Intl`, com helpers próprios (`isoDe`, `diaDe`, `instante`,
`diasEntre`).

**Por que não date-fns/Luxon:** o projeto só precisa de um punhado de operações (montar
data local, formatar em pt-BR, diferença em dias) — instalar uma lib inteira pra ~30 linhas
de helper é dependência desproporcional ao problema. `Intl.DateTimeFormat` nativo já cobre
formatação localizada sem lib nenhuma.

**Trade-off aceito:** os helpers precisam ser escritos (e entendidos) à mão — é por isso
que `diaDe`/`instante`/`diasEntre` existem e por que `EXERCICIOS.md` cobra reimplementá-los
de memória (Nível 4). Uma lib madura já teria essas armadilhas resolvidas e testadas; aqui,
a correção depende do cuidado de quem escreveu (e testou — ver `CASOS-LIMITE.md`).

**Reconsiderar se:** o projeto precisasse de fusos horários **múltiplos** (não é o caso: é
sempre "o fuso de quem está olhando a tela") ou cálculo de datas recorrentes complexas
(regras de repetição tipo "toda segunda sexta-feira do mês").

---

## ADR 6 — Sem PWA / Service Worker

**Contexto:** "app offline" é a descrição clássica de PWA (_Progressive Web App_) — daria
pra instalar como app, com ícone, funcionando offline "de verdade" via cache.

**Decisão:** nenhum manifest, nenhum service worker. Offline "de graça", porque é um
arquivo local.

**Por que não PWA:** service worker resolve o problema de **cachear conteúdo baixado da
internet** pra funcionar sem rede depois. Este projeto nunca teve internet envolvida — o
arquivo já nasce local, aberto com `file://` ou duplo clique. Adicionar um service worker
seria resolver um problema que não existe, com a complexidade extra de lifecycle de cache
(invalidação, atualização em segundo plano) que é justamente uma das partes mais
traiçoeiras de PWA.

**Trade-off aceito:** nenhum — não há vantagem de PWA que se aplique aqui. A única coisa
que se perde é "aparecer como app instalável" com ícone na tela inicial, o que o favicon
(`data:` URI embutido) já cobre parcialmente pra quem fixa a aba/atalho.

---

## Resumo — o padrão por trás das decisões

| Pergunta que cada ADR responde | Resposta comum |
|---|---|
| Por que não [ferramenta popular]? | Ela resolve um problema de **escala, time ou internet** que este projeto — uma pessoa, um pendrive, dado de saúde — não tem. |
| Qual o custo pago? | Mais código manual, sem as garantias automáticas (tipos, cache, reatividade) que a ferramenta traria. |
| Qual o ganho? | Zero dependência = **roda daqui a 10 anos** só com `node` instalado; nenhuma peça externa pode "parar de funcionar" ou introduzir uma vulnerabilidade não-patcheada. |

Isso não é regra geral pra todo projeto — é a leitura correta **para este contexto**
(offline-first, dado de saúde, longevidade). Um app de time, com deploy contínuo e mil
usuários, inverteria quase todas essas decisões — e estaria certo em fazê-lo.
