# ✍️ Exercícios

Perguntas de revisão, do básico ao avançado. **Tente responder sem olhar** o código e as
explicações; depois confira no **GABARITO** (bem no fim). Cada resposta aponta o espelho
onde o assunto mora.

Método: cubra o gabarito com a mão, responda em voz alta ou por escrito, e só então role
até o fim.

---

## Nível 1 — Básico (panorama e dado)

1. Quais são os **dois tempos de execução** do projeto, e o que roda em cada um?
2. Qual arquivo é a **fonte da verdade** e por que ele nunca vai pro git?
3. No `dados.json`, o que é um **período** de um medicamento? Cite seus campos.
4. O que significa `"ate": null` num período?
5. Por que a chave `_leia` no `dados.exemplo.json` **não** aparece na página?
6. O que o `gerar.mjs` produz, e quando é preciso rodá-lo de novo?
7. Cite **duas** regras do JSON que, se quebradas, invalidam o arquivo.

## Nível 2 — Intermediário (build e página)

8. Por que o `gerar.mjs` escapa `</` para `<\/` antes de injetar o JSON?
9. Explique a "escada" `process.argv[2] || acharNoPendrive() || path.join(RAIZ, 'dados.json')`.
10. O que faz `path.dirname(fileURLToPath(import.meta.url))` e por que não usar só
    `'template.html'`?
11. Na página, qual a diferença entre `innerHTML` e `textContent`, e onde cada um é usado?
12. O que são os seis **`id`** do HTML e qual a relação deles com o JavaScript?
13. Como o **tema escuro** é aplicado a quase toda a página com um bloco pequeno de CSS?
14. O que faz `repeat(auto-fit, minmax(232px, 1fr))` e que problema ele evita?
15. Por que `pintarContadores()` precisa rodar **antes** de `tique()`?
16. Como a página "não envelhece" se ficar aberta durante a virada da meia-noite?

## Nível 3 — Avançado (armadilhas e porquês)

17. Por que `diaDe` monta a data por componentes em vez de `new Date("AAAA-MM-DD")`?
18. Por que a validação `if (!dados || typeof dados !== 'object' || Array.isArray(dados))`
    tem **três** partes? O que cada uma barra?
19. Por que injetar o JSON com uma **função** no `replace` em vez de uma string? Dê um
    exemplo de dado que quebraria a versão com string.
20. Por que `diasEntre` usa `Math.round`, e não `Math.floor`?
21. A comparação de datas em `ativoEm` é feita **como texto**. Por que isso funciona, e o
    que quebraria essa suposição?
22. Explique a ordenação `a.data.localeCompare(b.data) || PESO[a.tipo] - PESO[b.tipo]`.
23. Por que uma mudança datada **hoje** aparece tanto em "Próximas" quanto em "Histórico"?
    Isso é bug?
24. No CSS, por que `.prox-corpo` tem `min-width: 0`?
25. Por que o medidor só anima quando a largura é setada dentro de
    `requestAnimationFrame`?
26. O `sync-pendrive.sh` faz `mkdir -p` → `rm -rf` → `mkdir -p`. Por que essa sequência, e
    não só copiar por cima?

## Desafios (aplicar)

27. **Sem quebrar nada**, como você adicionaria um novo evento "Exercício" com contador
    verde? (Diga o arquivo e o passo seguinte.)
28. Um remédio teve a dose reduzida pela metade a partir de amanhã. Como registrar isso
    mantendo o histórico?
29. Onde você mexeria pra acrescentar um novo momento "madrugada" com ícone próprio?
30. Suponha que alguém "simplificasse" o código trocando `instante(ev.inicio)` por
    `new Date(ev.inicio)`. Que bug apareceria com um `inicio` **sem hora**
    (`"2000-01-01"`), e por quê?

## Nível 4 — Prática (rodar de verdade)

Use `docs/estudo/harness-runtime.mjs` e cópias de `dados.exemplo.json` fora da
pasta do projeto — nunca o `dados.json` real. Método diferente dos níveis
anteriores: aqui você **prevê por escrito**, depois **roda** e confere.

31. Dado o JSON abaixo, **preveja** (sem rodar) o que aparece em `#hojeMed`:
    ```json
    { "medicamentos": [ { "nome": "X", "periodos": [
      { "de": "2026-07-01", "ate": "2026-07-10", "dose": "1 cp", "momento": "manhã" } ] } ] }
    ```
    Rode com `harness-runtime.mjs` numa data de hoje posterior a 10/07/2026 pra
    conferir.
32. Mesma pergunta, agora prevendo o que aparece em `#proximas` e `#historico`
    (não só `#hojeMed`) pro JSON do exercício 31.
33. Escreva de memória uma função `isoDe(data)` que devolve `"AAAA-MM-DD"` a
    partir de um objeto `Date`, sem usar `toISOString()`. Cole no console do
    Node (`node`, modo interativo) e teste com `isoDe(new Date(2026, 0, 5))` —
    confira contra o `template-js.explicado.md` só depois.
34. Escreva de memória uma função `marcoDe(dias)` que devolve o próximo marco
    de uma lista `[7, 14, 21, 30, 60, 90, 120, 180, 270, 365, 548, 730]` (o
    "rumo a" dos contadores) e a fração de progresso até ele. Teste com
    `marcoDe(45)` e `marcoDe(1000)` — o segundo caso (acima do maior marco) é
    o mais fácil de esquecer. Depois confira contra o código real.
35. Sem rodar nada: um contador mostra **9697 dias** desde um evento. Se o
    código trocasse `Math.floor` por `Math.round` em `pintarContadores`, em que
    situação o número mostrado mudaria, e por quanto (no máximo)? Depois
    confirme criando um evento com `inicio` há poucas horas e observando o
    valor não mudar entre `harness-runtime.mjs` rodado duas vezes seguidas (o
    `floor` só muda quando passa uma janela de 24h completa).
36. **Quebre e explique (1):** edite uma cópia do `dados.exemplo.json` pondo
    `"periodos": null` num medicamento (em vez de um array). Rode o harness.
    O que acontece — silêncio, erro, ou algo no meio? Onde no código isso é
    decidido?
37. **Quebre e explique (2):** edite uma cópia pondo `"eventos": "Sobriedade"`
    (uma string, não um array). Rode o harness. Compare com o exercício 36: por
    que o resultado é diferente (ou igual)?
38. No `dados.exemplo.json`, o campo `_leia` é ignorado pelo código. Escreva um
    JSON válido que tenha **cinco** chaves de nível superior além de `eventos`,
    `medicamentos` e `confirmar` (invente os nomes), rode o harness, e confirme
    que a página não muda em nada. Que princípio de programação defensiva isso
    demonstra — e qual é o risco oposto (aceitar chaves extras sem aviso)?
39. Crie um remédio com **dois períodos que nunca se sobrepõem** (um `ate`
    antes do outro `de` começar) e verifique: existe algum dia, entre o fim de
    um e o início do outro, em que `#hojeMed` fica sem esse remédio? É bug ou
    é o comportamento correto pra um "intervalo sem remédio"?
40. Compare a saída de `harness-runtime.mjs` com `--html` e sem `--html` para o
    mesmo JSON. O que muda no que é impresso? Por que o harness precisa dos
    dois modos (dica: pense no que R6 de `CASOS-LIMITE.md` precisou provar).

---
---

# 🔑 GABARITO

> Pare aqui se ainda está tentando responder.

1. **Build (Tempo A)** — `node gerar.mjs` injeta o `dados.json` no `template.html` e gera
   o `Calendario.html`; roda no Node, uma vez. **Runtime (Tempo B)** — o navegador executa
   o script da página, que recalcula tudo a partir de hoje e pinta o DOM. (Arquitetura)
2. O **`dados.json`**; é informação de saúde, cópia única — fica só no pendrive e está no
   `.gitignore`. (Arquitetura / dados.exemplo)
3. Um **intervalo de validade**: `de`, `ate` (ou `null`), `dose`, `momento` e `nota?`. É o
   período que decide "o que tomo hoje". (dados.exemplo)
4. Período **em aberto** — sem data de término, segue valendo. É um "nada de propósito",
   diferente de esquecer o campo. (dados.exemplo)
5. Porque o código só lê `eventos`, `medicamentos` e `confirmar`; `_leia` é um comentário
   disfarçado, ignorado por ninguém consumir. (dados.exemplo)
6. Um `Calendario.html` autocontido (2 cópias: pendrive + local). Só se roda de novo
   quando **muda** um remédio, dose ou evento — o resto se recalcula sozinho. (gerar)
7. Ex.: **sem comentários**, **sem vírgula sobrando**, **chaves com aspas duplas** (duas
   quaisquer). (dados.exemplo)
8. Porque o navegador fecharia o `<script>` ao ver o texto `</script>` **dentro de uma
   string**; `<\/` evita isso e, em JS, é idêntico a `</`. (gerar)
9. `||` devolve o **primeiro valor "verdadeiro"**: usa o argumento de linha de comando; se
   não veio, tenta o pendrive; se não achou (`null`), cai no `dados.json` local. (gerar)
10. Dá a **pasta do próprio script** (ESM não tem `__dirname`). Um caminho relativo se
    resolveria contra o diretório de onde você chamou o comando, que pode ser outro. (gerar)
11. `innerHTML` **interpreta HTML** (usado no render, com `esc` no dado); `textContent`
    insere **texto puro** (usado no cabeçalho `#hoje`). (template-html / js)
12. `#hoje`, `#pendencias`, `#contadores`, `#hojeMed`, `#proximas`, `#historico` — são os
    **ganchos** vazios que as funções `pintar*` preenchem. O HTML promete; o JS entrega.
    (template-html)
13. Todo o CSS usa `var(--token)` e nenhuma cor crua; o bloco `@media (prefers-color-scheme:
    dark)` **redefine os tokens** no `:root`, e a página inteira se adapta. (template-css)
14. Cria **quantas colunas couberem**, cada uma ≥ 232px, crescendo igual — layout responsivo
    **sem** escrever _breakpoints_. (template-css)
15. Porque `tique()` procura os elementos `[data-vivo]`, que **são criados** por
    `pintarContadores()`. Fora de ordem, o relógio não acharia nada. (template-js)
16. `tique()` compara `isoDe(agora)` com `hojeISO`; quando muda, chama `location.reload()`,
    e a página recalcula pra a nova data. (template-js)
17. Porque `new Date("AAAA-MM-DD")` (só data) é interpretado como **UTC** e desloca o dia;
    montando por componentes, o horário é **local**. (template-js / dados.exemplo)
18. `!dados` barra `null` (pois `typeof null === 'object'`); `typeof !== 'object'` barra
    número/string/booleano; `Array.isArray` barra arrays (`typeof [] === 'object'`). (gerar)
19. Numa **string** de troca, `$&`, `` $` ``, `$'`, `$$` são especiais e seriam expandidos.
    Ex.: um dado contendo `"$'"` corromperia a página. Uma **função** usa o retorno
    literal. (gerar)
20. Porque no **horário de verão** um dia tem 23 ou 25 h; a divisão não daria inteiro, e
    `round` corrige. `floor` erraria por 1 na virada. (template-js)
21. Funciona porque `AAAA-MM-DD` com zero à esquerda ordena **alfabeticamente = por data**.
    Quebraria com outro formato (`DD/MM`), sem zero à esquerda, ou misturando data com
    data-e-hora. (template-js / dados.exemplo)
22. Ordena por **data** (`localeCompare`); se empata (retorna `0`, falso), o `||` cai pro
    desempate por **tipo** (`PESO`: marco < fim < início). (template-js)
23. "Próximas" filtra `data >= hoje` e "Histórico" `data <= hoje`; ambos incluem **hoje**.
    **Não é bug** — é proposital, com hoje como eixo ("começa" vs "começou"). (template-js)
24. Itens de flex têm largura mínima = o conteúdo, o que impede quebrar linha e faz "vazar";
    `min-width: 0` libera o item a encolher. (template-css)
25. Porque a `transition` só anima uma **mudança entre dois valores computados**: se a
    largura real fosse setada no mesmo fôlego do `innerHTML`, o navegador nunca
    registraria o `width: 0` inicial — nada a animar. O `requestAnimationFrame` adia a
    troca (o callback roda **antes do próximo paint**, mas já noutro momento do ciclo);
    o idioma 100% garantido seria `rAF` duplo ou forçar reflow. (template-js/css)
26. Pra um **recomeço limpo**: garante a pasta, apaga tudo, recria vazia — assim arquivos
    **removidos** do projeto também somem do pendrive. Copiar por cima deixaria lixo. (sync)
27. No **`dados.json`** (o real, no pendrive), acrescente um objeto em `eventos` com
    `nome`, `inicio` (com `T00:00`), `cor: "verde"`; depois rode `node gerar.mjs`. (dados/gerar)
28. Feche o período atual pondo `ate` = hoje e adicione um **novo período** com `de` =
    amanhã e a nova dose — dois períodos, histórico preservado (é um desmame). (dados.exemplo)
29. No **JS**: adicione `'madrugada'` ao objeto `ICO` (com o SVG) e ao array `ordem` de
    `pintarHoje` (na posição desejada). (template-js)
30. O contador **adiantaria ~3 h** (no fuso de Brasília): `new Date("2000-01-01")`
    (data pura) é lido como **meia-noite UTC** = 21:00 do dia **anterior** no horário
    local — o instante de início fica 3 h mais cedo e o tempo decorrido, maior. Com o
    código **atual** isso não acontece: o `instante()` monta por componentes exatamente
    pra prevenir esse bug. (template-js)

**Nível 4** (verificado com `harness-runtime.mjs` em 2026-07-20)

31. `#hojeMed` fica **sem** o remédio X: o período terminou em 10/07, e `ativoEm`
    exige `de <= hoje <= ate`. Rodando o harness com "hoje" > 10/07/2026 confirma:
    "Nenhum medicamento ativo hoje." (template-js)
32. `#historico` mostra "último dia de X" em 10/07 (mudança **passada**);
    `#proximas` **não** mostra nada sobre X (o fim já passou, não é mais "à
    frente"). Só o **início** (`de`) e o **fim** (`ate`) geram entradas na linha
    do tempo — um período fechado no passado não deixa nada em Próximas. (template-js)
33. Confira contra o bloco de "Helpers de data" do template-js — a armadilha
    mais comum é usar `date.getMonth()` sem lembrar que já é 0-based (então
    **não** precisa `-1` de novo ao montar a string), e é fácil trocar a ordem
    ano-mês-dia sem o zero à esquerda (`5` em vez de `05`), quebrando o formato
    ISO. (template-js)
34. `marcoDe(45)` → `{ prox: 60, faltam: 15, frac: (45-30)/(60-30) = 0.5 }`.
    `marcoDe(1000)` → `MARCOS.find(m => m > 1000)` não acha nada (`undefined`,
    que é falsy) → a função retorna **`null`** — é o caso "acima do marco
    máximo", tratado à parte em `pintarContadores` (o texto "marco máximo
    vencido"). Esquecer o `if (!prox) return null` é o erro mais comum ao
    reimplementar. (template-js)
35. Só mudaria em janelas onde a diferença exata de milissegundos, dividida por
    24h, cai **entre** um inteiro e o próximo — ou seja, em qualquer instante
    que não seja exatamente uma virada de dia completo desde o `inicio`, e o
    efeito é de **no máximo 1 dia** a mais (arredondar pra cima em vez de
    truncar). Verificado: rodar o harness duas vezes no mesmo dia dá o mesmo
    "9697 dias" nas duas — `floor` só muda no instante exato em que uma nova
    janela de 24h se completa, não a cada execução. (template-js)
36. **Silêncio, sem erro.** `m.periodos || []` trata `null` como falsy e cai no
    array vazio — o medicamento simplesmente não conta pra nada, e a página
    mostra "Nenhum medicamento ativo hoje." normalmente. É decidido pelo
    padrão `|| []` que aparece em cada `for (const p of m.periodos || [])`
    (template.html, próximo às pinturas). (template-js)
37. **Erro, quebra tudo.** `DADOS.eventos || []` só protege contra valores
    **falsy** (`null`, `undefined`, `0`, `''`) — mas uma **string não-vazia**
    é *truthy*, então `evs` vira a própria string `"Sobriedade"`, e
    `evs.map(...)` lança `TypeError: evs.map is not a function`, **derrubando
    o script inteiro** (nada mais roda depois, porque `pintarContadores` é a
    **primeira** chamada da lista de entrada). Diferença chave do exercício
    36: `|| []` protege contra "campo ausente/nulo", **não** contra "campo do
    tipo errado". (template-js / gerar)
38. A página **não muda em nada** — o `.gitignore` do exemplo já avisa que
    algumas chaves (como `_leia`) são ignoradas; o mesmo vale pra qualquer
    chave extra, porque o código só lê `DADOS.eventos`, `DADOS.medicamentos` e
    `DADOS.confirmar` por nome — nunca itera "todas as chaves do objeto". Isso
    é **allowlist implícita** (só o que é lido nomeadamente importa); o risco
    oposto é que um erro de digitação numa chave (`"eventoss"`) também é
    "aceito" silenciosamente — vira só mais uma chave extra ignorada, sem
    aviso de que você esqueceu o `s` certo. (dados.exemplo / gerar)
39. **Não é bug.** Nos dias entre o fim de um período e o início do outro, o
    remédio **some** de `#hojeMed` — e isso é correto: um "buraco" entre
    períodos representa um intervalo real sem aquele remédio (ex.: pausa
    prescrita). `ativoEm` não tenta "preencher a lacuna"; se isso for
    indesejado, a correção é no **dado** (fechar o buraco com um período), não
    no código. (dados.exemplo / template-js)
40. Sem `--html`, o texto vem **limpo** (tags viram espaço, `esc()` é
    revertido) — bom pra ler o conteúdo. Com `--html`, vem o **markup cru**
    (classes, `style="--cor:…"`, atributos `data-*`) — necessário pra provar
    coisas que só existem no HTML e não aparecem como texto, como qual
    `var(--cor)` um fallback de cor desconhecida realmente escolheu (R6 de
    CASOS-LIMITE.md não dava pra confirmar só lendo texto — precisava ver o
    atributo `style`). (harness-runtime.mjs)
