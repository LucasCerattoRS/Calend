# 📅 Calendário

> **Contador de dias e organizador de medicamentos** — uma página HTML única, 100% offline, que vive num pendrive e nunca envelhece.

![Licença](https://img.shields.io/badge/licen%C3%A7a-CC%20BY--NC--SA%204.0-blue)
![Dependências](https://img.shields.io/badge/depend%C3%AAncias-zero-brightgreen)
![Offline](https://img.shields.io/badge/offline-100%25-orange)
![Stack](https://img.shields.io/badge/stack-JS%20puro%20%2B%20Node-yellow)

Sem framework. Sem servidor. Sem banco de dados. Sem `node_modules`. Um arquivo `.html`
autocontido que abre com dois cliques em qualquer máquina — Windows ou Linux — e mostra:

- ⏱️ **Contadores de dias** desde eventos importantes (com marcos de progresso: 7, 30, 90, 365 dias…)
- 💊 **O que tomar hoje**, agrupado por momento do dia (manhã · tarde · jantar · noite)
- 🔜 **Próximas mudanças** de dose ou término de tratamento
- 📜 **Histórico** em linha do tempo do que já aconteceu
- ⚠️ **Pendências** — o que ficou sem confirmar vira aviso amarelo (a página **nunca inventa** um dado que não foi dito)

A página **se recalcula a partir da data do dia** toda vez que abre. Por isso não fica
desatualizada: os contadores sobem sozinhos e as trocas de dose entram em vigor na data
certa, sem ninguém tocar em nada.

---

## 🎛️ Duas versões da contagem

O projeto mantém **duas leituras do mesmo dado**, em branches paralelos. Tudo o mais
(medicamentos, histórico, pendências, formato do `dados.json`) é idêntico — muda só o
bloco de **Contagem**:

| Branch | Contagem | Quando serve |
|---|---|---|
| **`main`** (esta) | *Stat tiles*: o número de dias como herói, com um medidor rumo ao próximo marco | Leitura de relance — "quantos dias?" e "quanto falta pro próximo marco?" |
| **[`barras`](https://github.com/LucasCerattoRS/Calend/tree/barras)** | Bloco escuro com quatro barras (dias · horas · minutos · segundos), cada uma preenchendo a fração da sua unidade e correndo a cada segundo | Sensação de tempo passando — o desenho muda ao longo do dia |

Trocar de versão é trocar de branch e regerar: `git switch barras && node gerar.mjs`.
O `dados.json` não muda, então a troca é reversível a qualquer momento.

---

## 🧭 Filosofia

Este projeto otimiza para um contexto que a maioria das ferramentas web ignora:
**uma pessoa, dado sensível de saúde, um pendrive, e a obrigação de continuar
funcionando daqui a 10 anos sem manutenção.**

| Princípio | Na prática |
|---|---|
| **Código × dado separados** | O código é versionado e público; o `dados.json` real vive **só no pendrive** e nunca entra no git (`.gitignore`). |
| **Fonte única da verdade** | O `dados.json` é o oficial; o `Calendario.html` é derivado — pode ser apagado e regerado à vontade. |
| **Zero dependência** | Roda com Node puro. Nada pra instalar, nada que possa quebrar com o tempo ou virar vulnerabilidade sem patch. |
| **Offline-first de verdade** | Não é PWA com cache: é um arquivo local. Ou o navegador abre, ou não — não existe "servidor fora do ar". |
| **Estado derivado do tempo** | Guarda-se a **data de início**, nunca "dias decorridos". O valor se recalcula sozinho e jamais desatualiza. |
| **Fail-soft** | Dado torto degrada com aviso ou silêncio controlado — documentado caso a caso em [`CASOS-LIMITE.md`](docs/estudo/CASOS-LIMITE.md). |

Cada "por que **não** usar X?" (React, localStorage, servidor, TypeScript, lib de datas,
PWA) tem uma resposta formal em [`DECISOES.md`](docs/estudo/DECISOES.md), no estilo ADR.

---

## ⚙️ Como funciona

```mermaid
flowchart LR
    D["📄 dados.json<br/>(os fatos — só no pendrive)"] --> G
    T["🧩 template.html<br/>(a página, sem dado nenhum)"] --> G
    G["⚙️ node gerar.mjs<br/>(injeta o dado no molde)"] --> C
    C["✅ Calendario.html<br/>(arquivo único, autocontido)"] --> N["🌐 Abre em qualquer<br/>navegador, offline"]
```

Dois momentos, bem separados:

1. **Build (raro):** `node gerar.mjs` injeta o JSON no marcador `/*DADOS*/…/*FIM*/` do
   template e escreve o `Calendario.html`. Só precisa rodar quando **mudar** um remédio,
   dose ou evento.
2. **Abertura (todo dia):** o JavaScript embutido lê `new Date()` e redesenha as seis
   regiões da página a partir do dado + data atual. **View = f(estado)** — sem framework.

O `gerar.mjs` encontra o pendrive sozinho (sondando os pontos de montagem) e escreve a
página em dois lugares — no pendrive e na cópia local — sem nunca tocar no `dados.json`.

---

## 🚀 Comece em 1 minuto

Requisitos: [Node.js](https://nodejs.org) 18+ e mais nada.

```bash
git clone https://github.com/LucasCerattoRS/Calend.git
cd Calend

# Gera uma página de demonstração com os dados de exemplo (inventados):
node gerar.mjs dados.exemplo.json demo.html

# Abra demo.html no navegador. Pronto — isso é o app inteiro.
```

Para usar de verdade: copie `dados.exemplo.json` para `dados.json` **fora do
repositório** (ex.: `<pendrive>/Calendario/dados.json`), preencha com seus fatos e rode
`node gerar.mjs`. O `./sync-pendrive.sh` (Linux) leva o código junto pro pendrive, pra
regenerar em qualquer máquina.

---

## 📋 O formato do dado

O `dados.exemplo.json` é a documentação viva do formato — dados inventados, comentados no
próprio arquivo:

```json
{
  "eventos": [
    { "nome": "Sobriedade", "inicio": "2000-01-01T00:00", "cor": "verde" }
  ],
  "datas": [
    { "nome": "Vencimento de exemplo", "data": "2000-06-15", "repete": "anual", "cor": "ciano" }
  ],
  "medicamentos": [
    {
      "nome": "Remédio de exemplo",
      "apresentacao": "10mg",
      "periodos": [
        { "de": "2000-01-01", "ate": null, "dose": "1 comprimido", "momento": "manhã" }
      ]
    }
  ],
  "confirmar": [
    "cada item aqui vira um aviso amarelo na página"
  ]
}
```

| Campo | O que é |
|---|---|
| `eventos[].inicio` | Data-hora de início do contador. A página mostra dias corridos, semanas e o próximo **marco** (7, 30, 90, 365 dias…). |
| `eventos[].cor` | `verde`, `ciano` ou `rosa` — identifica visualmente o contador. |
| `datas[]` | Marcos pessoais no calendário: `{ "nome": "…", "data": "AAAA-MM-DD", "repete": "anual", "cor": "ciano" }`. `repete` é opcional; sem ele vale só naquele dia. 29/02 anual cai em 28/02 nos anos sem dia 29. |
| calendário | Grade mensal com feriados nacionais (Páscoa, Carnaval, Corpus Christi calculados) e Dia do Gaúcho (RS), mais eventos, aniversários de evento, marcos em dias, `datas` e início/fim de remédio. O botão **Exportar .ics** gera `calendario.ics` para Google Agenda/celular, **sem remédios** (dado de saúde). |
| `medicamentos[].periodos` | **É o período que manda.** "O que tomo hoje" = filtrar quem tem `de ≤ hoje ≤ ate`. `ate: null` = em aberto. |
| — desmame | Mesmo remédio, dois períodos com doses diferentes. A troca aparece em "Próximas" antes e no "Histórico" depois — automaticamente. |
| `confirmar` | O que ficou em aberto (dose não dita, término indefinido). Vira aviso amarelo — **a página nunca inventa valores**. |

---

## 📚 Material de estudo — o diferencial deste repositório

Além do app, o repositório carrega em [`docs/estudo/`](docs/estudo/) uma **documentação
didática completa do código-fonte**, escrita para quem está aprendendo programação e quer
entender cada linha — não só usar.

### Estoque e retiradas (opcional)

Cada medicamento aceita `retiradas: [{ "data": "2026-07-01", "quantidade": 120 }]` (o que foi pego na farmácia) e cada período aceita `por_dia` (unidades por dia). A página mostra "Estoque de remédios": retirado, usado (estimado), sobra e até quando dura; e avisa quando o remédio teria acabado antes de uma retirada (retirada possivelmente não registrada). Sem `quantidade` em todas as retiradas, só lista as datas. Retiradas não vão para o `.ics`.


### Como o material é organizado

Cada arquivo de código tem **dois espelhos**, para dois momentos de estudo:

- **`*.explicado.md`** — leitura profunda, bloco a bloco de código, sempre na mesma
  estrutura: 📌 O quê · ⚙️ Como · 🎯 Porquê · 🔤 Sintaxe · 🧠 Conceito · 🔀 Alternativas ·
  ⚠️ Armadilhas.
- **`*.resumo.md`** — folha de consulta enxuta, pra revisar depois.

### O mapa completo

| Arquivo | O que entrega |
|---|---|
| [`ROTEIRO.md`](docs/estudo/ROTEIRO.md) | **Comece aqui.** Ordem de leitura que segue o fluxo do dado, com colunas de progresso pra marcar. |
| [`00-ARQUITETURA.md`](docs/estudo/00-ARQUITETURA.md) | O mapa geral: estrutura, ponto de entrada, os dois tempos de execução. |
| `*.explicado.md` / `*.resumo.md` | Espelhos didáticos de cada arquivo: dado, build (`gerar.mjs`), HTML, CSS, JS e o script de sync. |
| [`CONCEITOS.md`](docs/estudo/CONCEITOS.md) | ~50 verbetes do zero: de _truthy/falsy_ a CSS Grid, cada um apontando onde aparece no projeto. |
| [`GLOSSARIO.md`](docs/estudo/GLOSSARIO.md) · [`FLUXOGRAMA.md`](docs/estudo/FLUXOGRAMA.md) | Vocabulário e fluxos em diagrama. |
| [`DECISOES.md`](docs/estudo/DECISOES.md) | 6 ADRs: por que **não** framework, localStorage, servidor, schema, lib de datas, PWA — com trade-offs e "reconsiderar se". |
| [`CASOS-LIMITE.md`](docs/estudo/CASOS-LIMITE.md) | O que acontece com dado vazio, torto ou fora da convenção — **cada caso verificado de verdade**, com o JSON usado e a saída real capturada. |
| [`LABORATORIO.md`](docs/estudo/LABORATORIO.md) | 9 experimentos guiados de mão na massa (quebre o JSON de propósito, simule um desmame, emule tema escuro…) + tour de DevTools. |
| [`EXERCICIOS.md`](docs/estudo/EXERCICIOS.md) | 40 exercícios do básico ao avançado, com gabarito verificado — inclusive os casos em que a resposta surpreende. |
| [`harness-runtime.mjs`](docs/estudo/harness-runtime.mjs) | Ferramenta que roda o `<script>` real da página em Node (via `vm` + DOM falso) — foi como os gabaritos e casos-limite foram **provados**, não supostos. |
| [`codigo-comentado/`](docs/estudo/codigo-comentado/) | Cópias dos fontes com comentários `[ESTUDO]` linha a linha; os originais ficam limpos. |

> 💡 Mesmo que você nunca use o app, este material serve como estudo de caso de
> **JavaScript sem framework, manipulação de datas, templating, CSS moderno com design
> tokens, Node.js e Bash** — num código pequeno o bastante pra caber inteiro na cabeça.

---

## 🗂️ Estrutura do repositório

```
Calend/
├── template.html          # A página: HTML + CSS + JS embutidos, zero dado
├── gerar.mjs              # O build: injeta dados.json no template → Calendario.html
├── sync-pendrive.sh       # Leva o código pro pendrive (Linux; nunca toca no dado)
├── dados.exemplo.json     # O formato, documentado com dados inventados
├── .gitignore             # A política: dados.json e Calendario.html NUNCA entram
├── testes/                # node --test testes/gerar.test.mjs (runner nativo do Node)
└── docs/estudo/           # Documentação didática completa (ver tabela acima)
```

---

## ✅ Estado e testes

Em uso real e estável. Tecnologias: HTML + CSS + JavaScript puro na página, Node.js
(só módulos nativos) no build, Bash no `sync-pendrive.sh`.

```bash
node --test testes/gerar.test.mjs testes/pagina.test.mjs   # build + página (relógio fixo, America/Sao_Paulo)
node docs/estudo/harness-runtime.mjs                       # roda o <script> da página em Node e mostra cada seção
```

O CI (`.github/workflows/testes.yml`) roda os mesmos comandos a cada push e PR.
`testes/pagina.test.mjs` executa o `<script>` real do `template.html` com a data/hora
**congeladas** e `TZ=America/Sao_Paulo`, então cobre virada de mês/ano, ano bissexto, último
dia de uso e a virada do dia à meia-noite — o que decide se o remédio aparece em "hoje".

**Auditoria de dados locais (16/10/2026):** fixtures sintéticas, dois defeitos corrigidos com teste
(`testes/gerar.test.mjs`):
- `dados.json` salvo com BOM UTF-8 (Bloco de Notas do Windows) era recusado como "JSON inválido".
  Agora o BOM é ignorado.
- Evento ou remédio sem `nome` passava pelo build e a página escrevia a palavra "undefined".
  Agora o build recusa e diz onde. Número (`"dose": 2`) continua aceito — a página sempre o
  mostrou certo. Período sem `dose` (dose ainda não dita, ver `confirmar`) continua aceito e a
  página mostra vazio em vez de "undefined"; só dose de tipo errado (ex.: `true`) é recusada
  (revisão do PR #4).
- Pendências da auditoria resolvidas (16/10/2026, branch `claude/build-listas-atomico-16out`):
  - `eventos`, `medicamentos` ou `periodos` que não sejam lista (`{}`, texto, número, `true`)
    faziam o `gerar.mjs` abortar com stack trace. Agora o build recusa, diz onde
    (ex.: `medicamentos[0].periodos ("M"): precisa ser uma lista [ … ]`) e não gera nada.
    Ausente ou `null` continua valendo como lista vazia.
  - A escrita do `Calendario.html` não era atômica: falha no meio (disco cheio, pendrive
    arrancado) deixava a página truncada. Agora cada destino é gravado num temporário oculto
    na mesma pasta (`.Calendario.html.<pid>.tmp`) e renomeado por cima; se falhar, a página
    anterior fica intacta e o temporário é apagado. Vale para os dois destinos; a falha de um
    não impede o outro.
- Testes: `node --test testes/gerar.test.mjs testes/pagina.test.mjs` → 20 passam (antes da
  correção, os testes novos de lista e de falha no meio da escrita falhavam). O teste de falha
  no meio usa `ulimit -f` e é pulado no Windows.

**Revisão de 09/10/2026 (datas):**
- `de` com hora (`2026-03-01T08:00`) fazia o remédio **sumir de "Hoje" no dia em que começa**
  (comparação de texto com `AAAA-MM-DD`). A página agora compara só o dia.
- `ate` não era validado: `10/03/2026` passava pelo build, gerava "Invalid Date" e tirava o
  remédio de "Hoje". Agora o build recusa `ate` fora do formato, datas que não existem
  (`2026-02-30`, `2027-02-29`) e `ate` anterior a `de`.
- O contador usava milissegundos; início dentro do antigo horário de verão fazia o dia virar
  1 h fora de hora. Agora conta pelo relógio de parede local.
- O formato aceitava `2026-03-01T99:99`: o contador normalizava para 05/03 04:39 e a linha do
  tempo mostrava 01/03. Agora o build exige hora 00–23 e minuto/segundo 00–59, com ou sem hora
  (`AAAA-MM-DD`, `AAAA-MM-DDThh:mm` ou `AAAA-MM-DDThh:mm:ss`) — em `inicio`, `de` e `ate`.

**Revisão de 08/10/2026:** um evento sem `inicio` passava pelo build e, na página, derrubava o
script inteiro (todas as seções em branco); um período sem `de` sumia em silêncio. Agora o
`gerar.mjs` recusa o dado e diz onde está o erro — caso **B4** do `CASOS-LIMITE.md`.

**Pendências**
- A página usa o **fuso do computador** que a abre, não fixa `America/Sao_Paulo`. Em máquina com
  fuso errado, o "hoje" (e o remédio do dia) muda. Decisão pendente: fixar o fuso ou avisar na página.
- A página só tem o **momento** (manhã/tarde/jantar/noite), não horário de relógio da dose.
- `docs/estudo/codigo-comentado/` e os `*.explicado.md` ainda descrevem o código anterior a esta revisão.
- `sync-pendrive.sh` só existe para Linux; no Windows a cópia pro pendrive é manual.

---

## 🎓 Para estudar

1. **Datas em horário local, sem UTC** — `template.html`, funções `diaDe`, `instante`, `dia` e
   `corrido` (logo no começo do `<script>`): por que `new Date("2026-01-01")` adiantaria o contador,
   por que datas ISO não se comparam como texto quando uma tem hora, e por que diferença em ms erra
   com horário de verão.
2. **Templating por marcador** — `gerar.mjs`, o `replace` com **função** no `/*DADOS*/…/*FIM*/`:
   por que uma string ali corromperia o JSON (`$&`, `$'`) e por que `</` é escapado.
3. **View = f(estado)** — `template.html`, `pintarHoje` / `mudancas`: a página inteira é recalculada
   a partir do dado e de `new Date()`; nada de "dias decorridos" guardado.
4. **Validar na fronteira** — `gerar.mjs`, bloco `faltas`: o erro aparece no build, com caminho
   (`medicamentos[0].periodos[1]`), em vez de virar uma página em branco; `dataReal` confere que o dia existe.
5. **Testar com relógio congelado** — `testes/pagina-runner.mjs`: `Date` substituído por uma subclasse
   fixa dentro do `vm`, e `TZ` definido no processo filho — a única forma de testar datas de forma repetível.

---

## 🔒 Privacidade por construção

O dado real (`dados.json`) e a página gerada com ele (`Calendario.html`) são **bloqueados
pelo `.gitignore`** — a separação código × dado não é disciplina, é regra mecânica do
repositório. Tudo que está versionado aqui usa exclusivamente os **dados inventados** do
`dados.exemplo.json`.

---

## 📄 Licença

**© 2026 LuKas — todos os direitos reservados**, com uso liberado nos termos da
[**CC BY-NC-SA 4.0**](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.pt-br)
(Atribuição · Não Comercial · Compartilha Igual):

- ✅ Pode usar, estudar, adaptar e redistribuir — **com crédito ao autor**.
- 🚫 **Não** pode usar comercialmente.
- 🔁 Derivados devem circular sob **esta mesma licença**.

Detalhes em [`LICENSE.md`](LICENSE.md).

> ⚕️ **Aviso:** isto é uma ferramenta pessoal de organização, não um dispositivo médico.
> Não substitui orientação profissional de saúde.
