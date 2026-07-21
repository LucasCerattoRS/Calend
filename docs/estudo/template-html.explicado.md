# `template.html` — parte 1/3: HTML (detalhado)

Espelho de estudo da **estrutura** da página. Material de leitura; não altera nada.
Versão enxuta: [`template-html.resumo.md`](template-html.resumo.md).

O `template.html` tem três camadas no mesmo arquivo: **HTML** (esqueleto),
**CSS** (aparência, parte 2) e **JavaScript** (comportamento, parte 3). Esta parte é o
esqueleto — e o ponto-chave para entendê-lo é:

> A página nasce **vazia de conteúdo**. O HTML só define **contêineres rotulados**
> (com `id`); quem os preenche, na hora que a página abre, é o JavaScript, lendo o
> `DADOS`. É a ideia **view = f(estado)** na sua forma mais simples.

> Como ler cada bloco: 📌 O quê · ⚙️ Como · 🎯 Porquê · 🔤 Sintaxe · 🧠 Conceito ·
> 🔀 Alternativas · ⚠️ Armadilhas

---

## Bloco 1 — Declaração e idioma (linhas 1–2)

```html
<!doctype html>
<html lang="pt-BR">
```

📌 **O quê.** Abre um documento HTML5 em português do Brasil.

🔤 **Sintaxe.** `<!doctype html>` **não é uma tag** — é uma _declaração_. É a forma
mínima do HTML5 (antigamente era uma linha gigante).

🎯 **Porquê.**
- O `doctype` liga o **"modo padrões"** do navegador. Sem ele, o navegador entra em
  _quirks mode_ (modo de compatibilidade antigo), onde o CSS se comporta de formas
  estranhas.
- `lang="pt-BR"` informa o idioma: ajuda leitores de tela a pronunciar certo,
  a hifenização, o corretor ortográfico e ofertas de tradução.

🧠 **Conceito — metadados de documento.** Antes de qualquer conteúdo, você declara "que
tipo de documento é este e em que língua". São informações **sobre** a página, não o
conteúdo dela.

---

## Bloco 2 — O `<head>`: configurações invisíveis (linhas 3–8)

```html
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>Calendário</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📅</text></svg>">
```

📌 **O quê.** O `<head>` reúne coisas que **não aparecem no corpo** da página, mas
configuram como ela é lida e exibida.

⚙️ **Como / 🎯 Porquê, tag por tag.**

- **`<meta charset="utf-8">`** — diz como transformar os **bytes** do arquivo em
  **caracteres**. É o que faz `á`, `ã`, `ç` e o emoji 📅 aparecerem certos em vez de
  virarem `Ã¡`. Precisa vir **bem no começo** do `<head>` (dentro dos primeiros 1024
  bytes) — e vem.

- **`<meta name="viewport" …>`** — instrução pro **celular**. `width=device-width` faz o
  layout usar a largura real do aparelho; `initial-scale=1` começa sem zoom. Sem isso, o
  celular finge ter ~980px de largura e "encolhe" a página, deixando tudo minúsculo.

- **`<meta name="color-scheme" content="light dark">`** — avisa que a página **suporta
  os dois temas**. Assim, elementos nativos (barras de rolagem, campos de formulário, o
  fundo padrão) se adaptam ao tema do sistema, e não há aquele "flash branco" ao abrir no
  modo escuro. Trabalha em dupla com o CSS `prefers-color-scheme` (parte 2).

- **`<title>Calendário</title>`** — o nome que aparece na aba do navegador e no favorito.

- **`<link rel="icon" href="data:image/svg+xml,…📅…">`** — o **favicon** (o ícone da
  aba). Aqui ele não é um arquivo separado: é um **SVG embutido** contendo o emoji 📅.

🧠 **Conceito — _data URI_.** Em vez de apontar para um arquivo externo
(`href="icone.svg"`), o recurso inteiro vai **embutido** na própria URL, no formato
`data:<tipo>,<conteúdo>`. Zero requisições, zero arquivos soltos — perfeitamente
alinhado ao lema **offline, um arquivo só**.

🔀 **Alternativas.** Um `.ico`/`.png` externo funcionaria, mas custaria mais um arquivo e
uma requisição de rede. O _data URI_ troca isso por uma linha um pouco mais feia — troca
que combina com a filosofia do projeto.

⚠️ **Armadilha.** O emoji no favicon só aparece porque o `charset` é UTF-8 e o navegador
aceita SVG em _data URI_. Em ambientes muito antigos, poderia não renderizar.

---

## Bloco 3 — O `<body>`: contêineres rotulados (linhas 165–196)

```html
<body>
<div class="wrap">
  <header>
    <h1>Calendário</h1>
    <p class="data-hoje" id="hoje"></p>
  </header>

  <div id="pendencias"></div>

  <section>
    <h2>Contagem</h2>
    <div class="tiles" id="contadores"></div>
  </section>

  <div class="duplo">
    <section class="s-hoje">
      <h2>Hoje</h2>
      <div class="card" id="hojeMed"></div>
    </section>
    <section class="s-prox">
      <h2>Próximas mudanças</h2>
      <div class="card" id="proximas"></div>
    </section>
    <section class="s-hist">
      <h2>Histórico</h2>
      <div class="card" id="historico"></div>
    </section>
  </div>

  <footer>Recalculado na hora em que a página abre — não envelhece.<br>
    Para mudar remédio, dose ou evento: edite o <code>dados.json</code> e rode <code>node gerar.mjs</code>.</footer>
</div>
```

📌 **O quê.** O corpo visível. Repare que quase todo `<div>` importante está **vazio** —
`id="hoje"`, `id="pendencias"`, `id="contadores"`, `id="hojeMed"`, `id="proximas"`,
`id="historico"`. São **buracos rotulados** que o JavaScript vai preencher.

🔤 **Sintaxe — HTML semântico.** `<header>`, `<section>`, `<footer>`, `<h1>`, `<h2>` são
tags **com significado** (não meros `<div>`): ajudam leitores de tela e a estrutura do
documento. `<h1>` é o título principal; cada `<h2>` é um título de seção.

🧠 **Conceito 1 — o `id` como "gancho" (handle).** Um `id` é um nome único no documento.
O JS acha o elemento por ele (`document.getElementById('contadores')`) e injeta conteúdo
via `innerHTML`. O HTML é o **contrato**: promete que esses seis ganchos existem; o JS
cumpre preenchendo-os.

🧠 **Conceito 2 — separação de responsabilidades.** Mesmo estando tudo **num arquivo**,
os **papéis** são separados: HTML = estrutura, CSS = aparência, JS = comportamento,
`DADOS` = os fatos. Trocar o dado não mexe no HTML; mudar a cor não mexe no JS.

**O mapa que liga esta parte ao JavaScript (parte 3):**

| Contêiner (`id`) | Quem preenche | Com o quê |
|---|---|---|
| `#hoje` | linha direta no script | a data de hoje por extenso |
| `#pendencias` | `pintarPendencias()` | o bloco amarelo "a confirmar" |
| `#contadores` | `pintarContadores()` | os _tiles_ de contagem de dias |
| `#hojeMed` | `pintarHoje()` | os remédios de hoje, por momento |
| `#proximas` | `pintarProximas()` | as mudanças futuras |
| `#historico` | `pintarHistorico()` | as mudanças passadas, por mês |

🧠 **Conceito 3 — a grade "duplo".** As classes `duplo`, `s-hoje`, `s-prox`, `s-hist`
não fazem nada sozinhas aqui; elas são **alças para o CSS** (parte 2), que no desktop
coloca "Hoje" e "Próximas" lado a lado e encaixa o "Histórico" embaixo. No celular, a
ordem do HTML é que vale. Guarde o nome; a mecânica vem na parte do CSS.

📌 **O rodapé** é o único texto **fixo** (não gerado): a explicação de que a página se
recalcula sozinha e a receita pra atualizar o dado. O `<br>` quebra a linha; `<code>`
formata os comandos em fonte monoespaçada.

🔀 **Alternativas / melhoria possível.** Trocar `<div class="wrap">` por `<main
class="wrap">` daria um _landmark_ semântico a mais para acessibilidade. (Não altero o
código — é só uma observação de estudo.)

⚠️ **Armadilhas.**
- **Sem JavaScript, a página fica praticamente vazia** — sobram o `h1`, os títulos de
  seção e o rodapé (que são estáticos); todos os contêineres de conteúdo ficam em
  branco. É uma escolha consciente (ferramenta pessoal, sempre com JS), mas vale nomear
  certo: **não** é _progressive enhancement_ (que funcionaria sem JS) — e chamar de
  _graceful degradation_ seria generoso, porque não há degradação "graciosa": sem JS,
  não há conteúdo. É **dependência dura de JS**, assumida de propósito.
- **Os `id`s são um contrato frágil.** Renomear `id="contadores"` aqui sem renomear no JS
  faz `getElementById` devolver `null`, e tentar `null.innerHTML = …` **lança um erro**
  que interrompe o resto do script. Ou seja: quebra aquela seção **e** as seguintes.

---

## Recapitulando a parte HTML

- `doctype` + `lang` ligam o modo padrões e o idioma.
- O `<head>` configura codificação (UTF-8), celular (viewport), tema (color-scheme),
  título e favicon **embutido** (data URI, sem arquivo externo).
- O `<body>` é um conjunto de **contêineres vazios com `id`** — seis ganchos que o JS
  preenche na hora. A estrutura é semântica; a aparência e o comportamento moram nas
  outras duas partes.
- Mentalidade central: **o HTML promete os ganchos; o JS entrega o conteúdo.**

➡️ Próximo: **parte 2/3 — o CSS** (`template-css.explicado.md`): tokens de design,
temas claro/escuro, a grade "duplo" e o modo de impressão.
