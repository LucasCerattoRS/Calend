# `template.html` — parte 1/3: HTML (resumo)

Folha de consulta. Versão a fundo: [`template-html.explicado.md`](template-html.explicado.md).

**Ideia central.** A página nasce **vazia**: o HTML só define **contêineres com `id`**;
o JavaScript os preenche ao abrir, lendo o `DADOS`. É **view = f(estado)**.

**Esqueleto.**
```
<!doctype html> · <html lang="pt-BR">
<head> … meta charset/viewport/color-scheme · title · favicon (data URI) …
<body>
  .wrap
   ├─ header:  h1  +  #hoje
   ├─ #pendencias
   ├─ section "Contagem":  #contadores
   ├─ .duplo (grade)
   │    ├─ .s-hoje:  #hojeMed
   │    ├─ .s-prox:  #proximas
   │    └─ .s-hist:  #historico
   └─ footer (texto fixo)
```

**As 6 âncoras (o contrato HTML ↔ JS).**
| `id` | preenchido por |
|---|---|
| `#hoje` | linha direta (`textContent` = data de hoje) |
| `#pendencias` | `pintarPendencias()` |
| `#contadores` | `pintarContadores()` |
| `#hojeMed` | `pintarHoje()` |
| `#proximas` | `pintarProximas()` |
| `#historico` | `pintarHistorico()` |

**`<head>` num relance.**
| Tag | Papel |
|---|---|
| `meta charset="utf-8"` | bytes → caracteres (acentos, emoji); vem cedo |
| `meta viewport` | layout usa a largura real do celular |
| `meta color-scheme="light dark"` | UI nativa adapta ao tema; sem flash branco |
| `link rel="icon" href="data:…"` | favicon 📅 **embutido** (sem arquivo externo) |

**Gotchas.**
- **Sem JS → só títulos e rodapé** (os contêineres de conteúdo ficam vazios):
  **dependência dura de JS**, assumida — não é _progressive enhancement_.
- Renomear um `id` sem ajustar o JS → `getElementById` = `null` → `null.innerHTML` **lança
  erro** e derruba aquela seção e as seguintes.
- `.duplo/.s-hoje/.s-prox/.s-hist` são só **alças pro CSS** (a grade vem na parte 2).
- HTML semântico (`header/section/footer/h1/h2`) > `div` solto: significado + acessibilidade.
