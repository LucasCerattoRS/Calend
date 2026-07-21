# `gerar.mjs` — resumo (enxuto)

Folha de consulta rápida. Versão a fundo: [`gerar.explicado.md`](gerar.explicado.md).

**O que é.** O **build** em Node. Roda 1×, injeta o `dados.json` dentro do
`template.html` e escreve o `Calendario.html`. Sem dependências. Não desenha nada — só
transporta o dado pra dentro da página.

**Uso (CLI).**
```
node gerar.mjs                          # acha o pendrive sozinho
node gerar.mjs dados.json               # caminho do dado explícito
node gerar.mjs dados.json saida.html    # dado e saída explícitos
```

**Fluxo em 7 passos.**
1. **Entrada:** `argv[2] || acharNoPendrive() || <local>/dados.json`.
2. **Existe?** senão erro no stderr + `exit(1)`.
3. **Parse:** `JSON.parse` dentro de `try/catch` (erro amigável) + valida que é objeto.
4. **Saídas:** pendrive + pasta local, num `Set` (não duplica); ou o caminho de `argv[3]`.
5. **Template:** lê e confere o marcador `/*DADOS*/…/*FIM*/` (regex).
6. **Injeta:** `JSON.stringify(…,null,2)`, escapa `</`, substitui via **função** replacer.
7. **Escreve:** cada saída com `try/catch` próprio (_fail-soft_) + imprime contagens.

**Idiomas-chave.**
| Idiom | O que faz |
|---|---|
| `path.dirname(fileURLToPath(import.meta.url))` | pasta do script (ESM não tem `__dirname`) |
| `a \|\| b \|\| c` | escada de _fallback_ (primeiro "verdadeiro" vence) |
| `[\s\S]*?` | "qualquer char, até quebra de linha", **não-guloso** |
| `.replace(re, () => txt)` | injeta o texto **sem** interpretar `$&`, `$'`, `$$`… |
| `.replace(/<\//g, '<\\/')` | impede que `</script>` no dado feche o `<script>` |
| `[...new Set([...])]` | remove caminhos duplicados |
| `try/catch` **por** saída | pendrive off não impede a cópia local |
| `(x \|\| []).length` | contar sem quebrar se a chave faltar |

**Gotchas.**
- `typeof null === 'object'` **e** `typeof [] === 'object'` → por isso a validação usa
  `!dados`, `typeof`, **e** `Array.isArray`.
- Compare caminhos com `path.resolve`, **nunca** como string crua.
- `exit(0)` = sucesso, `≠ 0` = falha; erros vão pro **stderr**, resultado pro **stdout**.
- Trocar a função do `replace` por string reintroduz o bug do `$` (silencioso).
