# `dados.exemplo.json` — explicado

Espelho de estudo do arquivo `dados.exemplo.json`. É **material de leitura**: não
altera o projeto. Uso o arquivo de **exemplo** (dados inventados) de propósito — o
`dados.json` real é de saúde e nunca é mostrado nem tocado.

Este é o melhor lugar pra começar: **todo o resto do projeto existe para exibir este
dado.** Se você entende o formato, já entende o que o `gerar.mjs` transporta e o que o
`template.html` desenha.

> Como ler cada bloco: 📌 O quê · ⚙️ Como · 🎯 Porquê · 🔤 Sintaxe · 🧠 Conceito ·
> 🔀 Alternativas · ⚠️ Armadilhas

---

## Visão geral: o formato inteiro

```json
{
  "_leia": "…comentário disfarçado…",
  "eventos":      [ … ],
  "medicamentos": [ … ],
  "confirmar":    [ … ]
}
```

📌 **O quê.** O arquivo inteiro é **um objeto JSON** com quatro chaves de primeiro
nível: uma "falsa" (`_leia`) e três que são o dado de verdade — `eventos`,
`medicamentos` e `confirmar`. Cada uma das três é uma **lista** (array).

🧠 **Conceito — _schema_ (formato/contrato do dado).** Um schema é o "molde" que diz
quais chaves existem, de que tipo são e como se aninham. Aqui o schema não está escrito
num arquivo à parte (não há JSON Schema formal); ele é **documentado pelo exemplo** —
este próprio arquivo é o contrato. Quem consome o dado (o `template.html`) assume esse
formato.

🔀 **Alternativas.** Poderia haver um schema formal (`JSON Schema`, ou tipos em
TypeScript) validando o `dados.json` antes de gerar. Trade-off: mais garantia, porém
mais peças e dependências — contra a filosofia "sem instalar nada". Para um projeto
pessoal de um arquivo, o exemplo-como-contrato é suficiente.

⚠️ **Armadilha — JSON é rígido.** Diferente de JavaScript, JSON **não aceita
comentários** (`//` ou `/* */`) nem **vírgula sobrando** (_trailing comma_) depois do
último item. As chaves são sempre strings entre aspas duplas. Um errinho desses quebra
o arquivo inteiro — e é por isso que o `gerar.mjs` ganhou uma mensagem de erro amigável
pra esse caso.

---

## Bloco 1 — `_leia`: um comentário disfarçado

```json
  "_leia": "ESTE É O ARQUIVO DE EXEMPLO, com dados inventados — é o único que pode ir pro git. O de verdade é o dados.json, que fica só no pendrive.",
```

📌 **O quê.** Um bilhete pra quem abrir o arquivo, avisando que este é o exemplo.

⚙️ **Como.** É uma chave normal de objeto, com uma string de valor. Nada no código lê
`_leia` — o `template.html` só olha `eventos`, `medicamentos` e `confirmar`. Logo, essa
chave é **ignorada na prática**.

🎯 **Porquê.** Como JSON não tem sintaxe de comentário, a convenção é criar uma chave
que **ninguém consome** e usá-la como recado. O prefixo `_` (underscore) é o costume
para "isto é meta, não é dado".

🧠 **Conceito — convenção sobre configuração.** Não existe regra da linguagem que torne
`_leia` especial; é só um **acordo entre humanos**. Funciona porque o leitor do dado é
seletivo (pega chaves específicas) em vez de varrer tudo.

🔀 **Alternativas.** (a) Um arquivo `.txt` separado com o aviso — mas aí o aviso "viaja"
longe do dado. (b) `JSONC`/`JSON5`, dialetos que aceitam comentários de verdade — mas
exigem um parser especial; o `JSON.parse` nativo não os entende.

⚠️ **Armadilha.** Se algum dia o código passar a percorrer **todas** as chaves do
objeto (ex.: `Object.keys(dados)`), o `_leia` deixaria de ser inofensivo e apareceria
como se fosse dado. A técnica só é segura enquanto o consumo for seletivo.

---

## Bloco 2 — `eventos`: as contagens de dias

```json
  "eventos": [
    {
      "nome": "Sobriedade",
      "inicio": "2000-01-01T00:00",
      "cor": "verde",
      "obs": "cor: verde, ciano ou rosa — identifica o contador na página. obs é opcional e aparece como nota."
    }
  ],
```

📌 **O quê.** Uma **lista de eventos** a partir dos quais a página conta dias. Aqui só
tem um; poderia ter vários (cada um vira um "tile"/cartão contador). Quem consome:
`pintarContadores()`.

🔤 **Sintaxe — array de objetos.** Os colchetes `[ … ]` são um array (lista ordenada);
as chaves `{ … }` são um objeto (conjunto de pares chave→valor). Aqui temos **uma lista
de objetos**, o formato mais comum pra "vários registros do mesmo tipo".

### `nome`
📌 Um rótulo livre ("Sobriedade") mostrado no cartão. 🎯 É texto humano; pode ser
qualquer coisa.

### `inicio` — a data/hora de partida
📌 Quando o evento começou: `"2000-01-01T00:00"`.

🔤 **Sintaxe — data ISO 8601.** O formato é `AAAA-MM-DD` opcionalmente seguido de
`Thh:mm`. O `T` separa a **data** da **hora**. É um _padrão internacional_ justamente
para não haver ambiguidade (nada de "01/02" ser fevereiro pra uns e janeiro pra
outros).

🎯 **Porquê o `T00:00` (e não só a data).** O contador da página faz duas coisas com
esse valor: conta os dias **e** mostra um relógio ao vivo (h/min/seg). Ter a hora
explícita garante que a página interprete o instante em **horário local**. Sem a hora,
`new Date("2000-01-01")` seria lido como **UTC** e adiantaria o contador algumas horas.
_(O código hoje se protege disso com uma função `instante()`, mas manter o `T00:00` no
dado é o hábito correto.)_

🧠 **Conceito — fuso horário e "meia-noite de quem?".** Uma mesma data "cai" em
instantes diferentes conforme o fuso. Datas de saúde são vividas no **relógio local**,
então o projeto trata tudo em horário local, de propósito.

🔀 **Alternativas.** Guardar um _timestamp_ numérico (ms desde 1970) seria menos
ambíguo pra máquina, porém ilegível pra humano editando à mão. O ISO equilibra os dois.

⚠️ **Armadilha.** Escrever a data noutro formato (`01/01/2000`) quebra tudo: o resto do
código compara e ordena datas **como texto**, contando com o formato `AAAA-MM-DD`
(veja o Bloco 3).

### `cor` — identidade visual, não pixel
📌 `"verde"` — escolhe a cor do contador.

🎯 **Porquê uma palavra e não um código de cor (`#008300`).** O dado diz **qual
identidade**, não **quais pixels**. O `template.html` traduz `verde`/`ciano`/`rosa`
(e `roxo`, que ele mapeia pra rosa) para variáveis de CSS já **validadas para os temas
claro e escuro e para daltonismo**.

🧠 **Conceito — indireção / _design tokens_.** Em vez de espalhar valores concretos
(hex) pelo dado, você usa um **nome simbólico** que um único lugar resolve. Trocar o
tom do "verde" no futuro é mexer em um ponto só, e o dado nem fica sabendo.

🔀 **Alternativas.** Pôr o hex direto no dado. Trade-off: acopla o dado ao tema, some no
modo escuro, e perde a validação de contraste. Por isso o projeto **não** faz isso.

⚠️ **Armadilha.** Uma cor fora do mapa (ex.: `"laranja"`) não dá erro — o código cai num
**padrão** (ciano). Silencioso: some sem avisar.

### `obs` — nota opcional
📌 Um texto que aparece como observação no cartão. 🔤 **Campo opcional**: se não existir,
a página simplesmente não mostra nota (o código testa `ev.obs ? … : ''`).

🧠 **Conceito — campos opcionais.** Nem todo registro precisa de todas as chaves. O
consumidor precisa **tolerar a ausência** — e tolera, com o operador ternário.

---

## Bloco 3 — `medicamentos` e o conceito de `periodos`

Este é o coração do modelo. Leia com calma.

```json
  "medicamentos": [
    {
      "nome": "Remédio de exemplo",
      "apresentacao": "10mg",
      "periodos": [
        { "de": "2000-01-01", "ate": null, "dose": "1 comprimido", "momento": "manhã" }
      ]
    }
  ],
```

📌 **O quê.** Uma lista de medicamentos. Cada remédio tem `nome`, `apresentacao`
(opcional) e — o principal — uma lista de **`periodos`**.

🧠 **Conceito-chave — modelar o tempo como _intervalos de validade_.** Um remédio não é
"uma dose"; é "**tal dose, durante tal janela de tempo**". Cada período é um intervalo
`[de, ate]` com a dose e o momento que valem **naquela janela**. "O que tomo hoje" é
só perguntar: _quais períodos contêm a data de hoje?_

🎯 **Porquê assim.** Porque doses mudam ao longo do tempo. Um **desmame** (redução
gradual) é o mesmo remédio com **dois períodos** e doses diferentes — sem apagar o
passado nem precisar editar "a dose atual" todo dia. O histórico fica registrado de
graça.

### `apresentacao`
📌 A forma/concentração ("10mg", "gotas 20mg/ml"). Opcional; aparece coladinha ao nome.

### Dentro de um período

#### `de` e `ate` — os limites do intervalo
📌 `de`: quando o período começa. `ate`: quando termina — ou **`null`** se está em
aberto (segue valendo).

🔤 **Sintaxe — `null`.** É o valor JSON para "vazio de propósito / não se aplica". Não é
`0`, não é `""`, não é a chave faltando: é um **"nada" explícito**.

🎯 **Porquê `null` e não simplesmente omitir a chave.** `null` comunica intenção: "eu
**sei** que este período está em aberto". Uma chave faltando pareceria "esqueci de
preencher". No código, ambos funcionariam (o teste é `!p.ate`, e tanto `null` quanto
`undefined` são _falsy_), mas o `null` é a escolha **honesta e documentada**.

🧠 **Conceito — intervalo fechado e limite aberto.** Aqui o intervalo é **fechado dos
dois lados**: um dia conta como ativo se `de ≤ dia ≤ ate`. Quando `ate` é `null`, o
lado direito vira **ilimitado** ("até segunda ordem"). Compare com _intervalos
semiabertos_ `[de, ate)`, comuns em programação pra evitar sobreposição — aqui a escolha
foi o fechado, que casa com "o último dia ainda conta".

🔤 **Detalhe importante — comparação de datas como texto.** O código decide se um
período está ativo com algo como `p.de <= hoje && (!p.ate || p.ate >= hoje)`, onde
`hoje` é uma string `"AAAA-MM-DD"`. Isso **compara strings**, não datas. Funciona
**porque** o formato ISO com zeros à esquerda ordena alfabeticamente **na mesma ordem**
que cronologicamente: `"2000-01-09" < "2000-01-10"` tanto como texto quanto no calendário.

⚠️ **Armadilha.** Esse truque **só** vale para `AAAA-MM-DD` com zero à esquerda. Datas
sem padding (`2000-1-9`) ou em outro formato **quebram a ordenação**. E misturar
data-só (`"2000-01-01"`) com data-e-hora (`"2000-01-01T08:00"`) nesses campos também
bagunça a comparação — por isso `de`/`ate` são sempre **data pura**.

#### `dose` — texto, não número
📌 `"1 comprimido"`. 🎯 **Porquê texto livre.** Dose é uma frase humana: "meio
comprimido", "10 gotas", "1 e meio". Forçar número perderia essa naturalidade.

🔀 **Alternativas / trade-off.** Um campo estruturado (`{ quantidade: 1, unidade:
"comprimido" }`) permitiria somar/validar, mas engessaria a escrita e complicaria o
dado à mão. O projeto prioriza **honestidade e flexibilidade** sobre cálculo.

#### `momento` — uma "enum por convenção"
📌 `"manhã"`. Diz em que parte do dia tomar; a página **agrupa** os remédios por momento
e escolhe um ícone (sol, tarde, jantar, lua).

🧠 **Conceito — _enum_ informal (conjunto fechado de valores).** O código espera um de
quatro valores: `manhã`, `tarde`, `jantar`, `noite`, e usa essa ordem pra organizar o
dia. Qualquer outro valor cai num balde "sem horário" no fim. Não há validação que
_force_ isso — é um **conjunto combinado**, não imposto.

⚠️ **Armadilha — acento e grafia.** Tem que bater **exatamente**: `"manha"` (sem o til)
não é reconhecido como manhã — vai pro balde "sem horário" e perde o ícone/ordem certos.
Maiúscula/minúscula e espaços também contam.

#### `nota` (não aparece no exemplo, mas existe)
📌 Um período pode ter uma `nota` opcional (ex.: "tomar com comida"), exibida abaixo do
item. Mesmo padrão de campo opcional do `obs`.

---

## Bloco 4 — `confirmar`: transformar dúvida em aviso

```json
  "confirmar": [
    "cada item aqui vira um aviso amarelo na página, pra não esquecer o que ficou em aberto"
  ]
```

📌 **O quê.** Uma lista de frases. Cada uma vira um item num **bloco amarelo de
"a confirmar"** no topo da página. Quem consome: `pintarPendencias()`.

🎯 **Porquê existe.** É a filosofia do projeto virada dado: **a página nunca inventa
valores**. Se uma dose não foi dita ou uma data de término está indefinida, isso não é
chutado — é **listado como pendência**, à vista. "Mostrar que falta" é muito diferente
de "preencher no escuro".

🧠 **Conceito — tornar o desconhecido _de primeira classe_.** Em vez de esconder
incertezas (deixando um campo vazio silencioso), o sistema dá a elas um lugar visível e
nomeado. É uma decisão de _design de confiança_: você olha a página e sabe no que pode
confiar e o que ainda está em aberto.

🔀 **Alternativas.** Poderia inferir defaults ("se não sei a dose, assumo a anterior").
Trade-off perigoso num contexto de saúde: um palpite parece um fato. O projeto recusa
isso de propósito.

⚠️ **Armadilha.** Se `confirmar` estiver vazio (`[]`) ou ausente, o bloco simplesmente
não aparece — o código faz `if (!itens.length) return;`. Ou seja: "sem pendências" e
"esqueci de listar as pendências" ficam **visualmente iguais**. A lista é tão boa
quanto a sua disciplina de mantê-la.

---

## Recapitulando o modelo

- **Objeto raiz** com três listas de dado (`eventos`, `medicamentos`, `confirmar`) e um
  recado (`_leia`).
- **Eventos** = contadores de dias, com cor simbólica.
- **Medicamentos** = nome + **períodos**; cada período é um **intervalo de tempo** com a
  dose/momento que valem nele. O tempo é modelado explicitamente — é o que faz a página
  se recalcular sozinha e guardar histórico.
- **Confirmar** = as dúvidas honestas, visíveis.
- Tudo em **datas ISO** e **comparação textual**; **campos opcionais** tolerados pelo
  consumidor; **`null`** como "aberto de propósito".

➡️ Próximo no roteiro: **`gerar.explicado.md`** — como este dado é injetado no
`template.html` para virar a página `Calendario.html`.
