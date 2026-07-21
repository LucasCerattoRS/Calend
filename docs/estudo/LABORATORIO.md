# 🧫 Laboratório — mão na massa

Enquanto `CASOS-LIMITE.md` mostra o que **já foi verificado** por mim, aqui é pra
**você** rodar, com as próprias mãos. Cada experimento tem objetivo, passos,
resultado esperado e o conceito que ele prova.

## Regras do laboratório

1. **Nunca no `dados.json` real.** Todo experimento usa uma **cópia** de
   `dados.exemplo.json` — nunca o dado de saúde de verdade.
2. **Nunca dentro da pasta do projeto**, pra não sujar o `git status`. Crie a
   cópia num lugar temporário (na sua pasta de downloads, num `tmp/` fora do
   projeto, ou onde seu sistema guarda arquivos temporários).
3. **No fim de cada experimento, apague o arquivo de teste.** O laboratório não
   deixa rastro — se em algum momento `git status` (na pasta do projeto) mostrar
   um arquivo que você não reconhece, é sinal de que um teste vazou pro lugar
   errado; apague-o.
4. Os experimentos de **runtime** (o que a página mostra) usam o
   `harness-runtime.mjs` — não precisa de navegador:
   ```
   node docs/estudo/harness-runtime.mjs caminho/pro/seu-teste.json
   ```
5. Os experimentos de **build** rodam o `gerar.mjs` de verdade, com saída numa
   pasta temporária:
   ```
   node gerar.mjs caminho/pro/seu-teste.json caminho/pra/uma/pasta/temp/Calendario.html
   ```

Prepare o terreno uma vez:
```
cp dados.exemplo.json /caminho/temporário/teste.json
```
(no Windows/PowerShell: `Copy-Item dados.exemplo.json C:\caminho\temporário\teste.json`)

---

### Experimento 1 — controle: o fluxo inteiro, do dado ao HTML

**Objetivo:** ver o build funcionando de ponta a ponta antes de quebrar algo.

**Passos:**
1. `node gerar.mjs dados.exemplo.json /caminho/temp/Calendario.html`
2. Abra o `Calendario.html` gerado num navegador.

**Resultado esperado:** página abre com 1 evento ("Sobriedade", desde 2000),
1 remédio ativo hoje de manhã, sem pendências extras além da que já vem no
exemplo.

**Conceito provado:** o "fio" completo de `00-ARQUITETURA.md` §4 — dado → build
→ arquivo → runtime — não é só diagrama, é reproduzível em 2 comandos.

---

### Experimento 2 — quebrar o JSON de propósito

**Objetivo:** ver a "falha alta e clara" descrita em `CASOS-LIMITE.md` (B1) com
as próprias mãos, e aprender a ler a mensagem de erro do Node.

**Passos:**
1. Copie `dados.exemplo.json`, abra a cópia e deixe uma vírgula sobrando:
   `"cor": "verde",}` em vez de `"cor": "verde"}`.
2. Rode `node gerar.mjs sua-copia.json /caminho/temp/saida.html`.

**Resultado esperado:** o processo **não** escreve nada; imprime uma mensagem
com "não é um JSON válido" e aponta linha/coluna do erro; `echo $?` (ou
`$LASTEXITCODE` no PowerShell) mostra saída diferente de zero.

**Conceito provado:** `try/catch` em volta de `JSON.parse` (gerar.mjs) —
**falhar cedo e alto** é uma escolha, não um acidente. Compare com o
Experimento 4, onde o dado é aceito mas o resultado é sutilmente errado.

---

### Experimento 3 — um "desmame": segundo período no mesmo remédio

**Objetivo:** registrar uma redução de dose sem perder o histórico.

**Passos:**
1. Na cópia, feche o período existente do remédio de exemplo pondo
   `"ate": "2026-07-19"` (ajuste pra "ontem" em relação à sua data real).
2. Adicione um **segundo** objeto em `periodos`, com `"de"` = hoje, dose menor
   e o mesmo `momento`.
3. `node docs/estudo/harness-runtime.mjs sua-copia.json`

**Resultado esperado:** `#hojeMed` mostra só a dose **nova** (o período antigo
já não está ativo); `#historico` mostra a mudança de dose de hoje; se você
rodar de novo com uma data futura simulada (editando `"de"`/`"ate"` pra frente),
o período antigo reaparece no histórico, preservado.

**Conceito provado:** o modelo de dados não tem "editar dose" — tem **fechar e
abrir período**. É o mesmo padrão de versionamento por intervalos que aparece
em ledgers financeiros: nunca sobrescrever, sempre adicionar uma linha nova.

---

### Experimento 4 — o typo que não avisa: `"manha"` sem acento

**Objetivo:** sentir na pele o que `CASOS-LIMITE.md` (R8) só descreve — um erro
que **não quebra nada**, só degrada silenciosamente.

**Passos:**
1. Na cópia, troque `"momento": "manhã"` por `"momento": "manha"` (sem til).
2. `node docs/estudo/harness-runtime.mjs sua-copia.json --html`

**Resultado esperado:** o remédio ainda aparece em `#hojeMed`, mas com o rótulo
`manha` (sem acento) e um `<circle r="9">` — o ícone genérico de "sem horário",
não o ícone de sol da manhã. Compare o HTML com o do Experimento 1.

**Conceito provado:** enums "por convenção de string" (sem validação) aceitam
**qualquer string**; o typo não é rejeitado, é silenciosamente tratado como
"desconhecido". É o motivo de projetos maiores usarem enum de verdade ou
schema — ver `DECISOES.md`.

---

### Experimento 5 — cor que não existe no mapa

**Objetivo:** ver o fallback de cor em ação.

**Passos:**
1. Na cópia, troque `"cor": "verde"` por `"cor": "laranja"`.
2. `node docs/estudo/harness-runtime.mjs sua-copia.json --html`

**Resultado esperado:** o `style` do tile mostra `--cor:var(--ev-ciano)` — a cor
caiu pro padrão, sem nenhum aviso no console nem na tela.

**Conceito provado:** `CORES[nome] || 'var(--ev-ciano)'` é _fail-soft_ — nunca
quebra por causa de uma cor errada — mas o preço é que o erro fica **invisível**
até você notar visualmente que duas cores "diferentes" saíram iguais.

---

### Experimento 6 — evento no futuro

**Objetivo:** ver como o contador se comporta **antes** do marco acontecer.

**Passos:**
1. Na cópia, mude o `inicio` do evento pra uma data futura, ex.:
   `"2026-08-15T00:00"`.
2. `node docs/estudo/harness-runtime.mjs sua-copia.json`

**Resultado esperado:** `#contadores` mostra "0 dias" (nunca negativo);
`#proximas` mostra o marco como "em N dias".

**Conceito provado:** `Math.max(0, agora - instante(...))` — a defesa contra
tempo negativo é **uma linha**, fácil de esquecer se você reescrever a função do
zero (é literalmente o Exercício 30 de EXERCICIOS.md, num ângulo diferente).

---

### Experimento 7 — tirar a hora do `inicio` do evento

**Objetivo:** testar se `"inicio": "2000-01-01"` (sem `T00:00`) quebra alguma
coisa.

**Passos:**
1. Na cópia, troque `"inicio": "2000-01-01T00:00"` por `"inicio": "2000-01-01"`.
2. `node docs/estudo/harness-runtime.mjs sua-copia.json`
3. Compare a contagem de dias com o Experimento 1 (mesma data, com hora).

**Resultado esperado:** **nenhuma diferença** — a contagem de dias é idêntica.

**Conceito provado:** `instante()` monta a data por **componentes** (ano, mês,
dia, hora — essa última default `0` se ausente), então funciona igual com ou
sem hora. É a mesma função que **evitaria** o bug de 3h que o Exercício 30
descreve pra quem trocasse `instante()` por `new Date()` direto — aqui você
confirma que, com o código atual, o campo de hora é opcional na prática.

---

### Experimento 8 — imprimir a página

**Objetivo:** ver o CSS de impressão em ação.

**Passos:**
1. Abra o `Calendario.html` do Experimento 1 no navegador.
2. `Ctrl+P` (ou `Cmd+P`) → visualize o preview de impressão (não precisa
   imprimir de fato).

**Resultado esperado:** fundo branco, texto preto, sem sombras, e nenhum tile
é cortado ao meio entre páginas.

**Conceito provado:** `@media print` (template.html, perto da l. 157) redefine
os **mesmos tokens** de cor usados em tela — não é um CSS separado, é o sistema
de design tokens sendo reaproveitado pro papel; `break-inside: avoid` é a regra
que impede um cartão ser serrado ao meio na quebra de página.

---

### Experimento 9 — emular tema escuro sem trocar o SO

**Objetivo:** ver o tema escuro sem precisar mudar a configuração do sistema
operacional.

**Passos:**
1. Abra o `Calendario.html` no navegador, abra o DevTools (`F12`).
2. Chrome/Edge: `Ctrl+Shift+P` → "Show Rendering" → "Emulate CSS media feature
   prefers-color-scheme" → `dark`.
   Firefox: no painel de Inspector, ícone de sol/lua no canto, ou
   `about:config` → `ui.systemUsesDarkTheme`.

**Resultado esperado:** a página inteira vira escura **sem recarregar** —
fundo, texto, bordas, tudo trocado.

**Conceito provado:** é a mesma media query do Experimento 8, agora
`prefers-color-scheme: dark` — a UI inteira muda com um bloco de CSS pequeno
porque **tudo** usa `var(--token)`, nunca cor crua (ver `template-css.explicado.md`).

---

## Tour rápido de DevTools pra este projeto

Não é genérico — são os pontos que **este** projeto especificamente recompensa
inspecionar:

- **Inspecionar um tile e ver `--cor` computado:** clique com o botão direito
  num contador → Inspecionar → na aba "Computed" (ou "Styles"), procure
  `--cor` — é o custom property que o JS **passou** via `style="--cor:…"`
  (ver `corDe()` em `template-js.explicado.md`).
- **Breakpoint em `tique()`:** na aba Sources, ache a `<script>` inline, ache
  `function tique`, clique no número da linha pra por um breakpoint. A cada
  segundo a execução para ali — dá pra inspecionar `agora`, `hojeISO` no
  console enquanto pausado.
- **Emular `prefers-reduced-motion`:** mesmo painel "Rendering" do Experimento
  9, "Emulate CSS media feature prefers-reduced-motion" → `reduce`. O medidor
  de progresso para de animar a barra (a `transition` é removida — l. 156 do
  template.html).
- **Painel Application/Storage:** propositalmente **vazio** — o projeto não usa
  `localStorage`, cookies nem IndexedDB. Confirmar isso no DevTools é uma forma
  rápida de verificar a promessa de "sem persistência no navegador" (ver
  `DECISOES.md`).

---

## Depois de terminar

Apague os arquivos de teste que você criou fora do projeto. Se quiser
confirmar que nada vazou pra dentro da pasta do projeto:
```
git status
```
Só deve aparecer o que você já esperava (ou nada, se não editou nada aqui).
