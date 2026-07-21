# `sync-pendrive.sh` — explicado (detalhado)

Espelho de estudo do script de **distribuição** (Bash). Material de leitura; não altera
nada. Versão enxuta: [`sync-pendrive.resumo.md`](sync-pendrive.resumo.md).

📌 **O papel.** O **dado** já vive no pendrive. Este script leva o **código** junto (pra
`<pendrive>/Calendario/codigo/`), pra você poder **regerar a página em qualquer máquina**.
Ele **nunca** toca no `dados.json`. Roda no **Linux** (o Windows usa a cópia local;
macOS ficaria de fora — ver a armadilha do Bloco 3).

> Como ler cada bloco: 📌 O quê · ⚙️ Como · 🎯 Porquê · 🔤 Sintaxe · 🧠 Conceito ·
> 🔀 Alternativas · ⚠️ Armadilhas

---

## Bloco 1 — Cabeçalho e modo estrito (linhas 1–9)

```bash
#!/usr/bin/env bash
# ... comentários ...
set -euo pipefail
```

🔤 **Sintaxe — o _shebang_.** `#!/usr/bin/env bash` na 1ª linha diz ao sistema **com que
programa** executar o arquivo. Usar `/usr/bin/env bash` (em vez de `/bin/bash` fixo) acha o
bash **onde ele estiver** no `PATH` — mais portável.

🧠 **Conceito — modo estrito do Bash (`set -euo pipefail`).** Liga três proteções:
- `-e` — **aborta** se qualquer comando falhar (em vez de seguir em frente cegamente).
- `-u` — erro se usar uma **variável não definida** (pega erros de digitação).
- `-o pipefail` — num _pipe_ (`a | b`), falha se **qualquer** parte falhar (não só a
  última).

🎯 **Porquê.** Bash "solto" ignora erros por padrão — perigoso quando o script cria e
apaga pastas. O modo estrito o torna previsível.

---

## Bloco 2 — Onde o script mora (linha 11)

```bash
RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
```

📌 **O quê.** Descobre a pasta do próprio script — o equivalente Bash do `RAIZ` do
`gerar.mjs`.

⚙️ **Como (de dentro pra fora).** `${BASH_SOURCE[0]}` é o caminho do script; `dirname`
tira o nome do arquivo (sobra a pasta); `cd …` entra nela e `pwd` imprime o **caminho
absoluto**. O `$( … )` (_command substitution_) captura essa saída na variável.

🧠 **Conceito — ancorar no script, não no diretório atual.** Assim o script copia os
arquivos certos mesmo se você o chamar de outro lugar (`~/qualquer/sync-pendrive.sh`).

---

## Bloco 3 — Achar o pendrive (linhas 13–26)

```bash
DESTINO=""
for base in "/run/media/$USER" "/media/$USER"; do
  [[ -d "$base" ]] || continue
  for dir in "$base"/*/; do
    if [[ -d "${dir}Calendario" ]]; then DESTINO="${dir}Calendario"; break 2; fi
  done
done

if [[ -z "$DESTINO" ]]; then
  echo "Não achei a pasta Calendario em nenhum pendrive montado." >&2
  echo "Plugue o pendrive (ou crie <pendrive>/Calendario) e rode de novo." >&2
  exit 1
fi
```

⚙️ **Como.** Percorre os diretórios onde o Linux monta mídia (`/run/media/você`,
`/media/você`). Para cada um que existe, olha as **subpastas** (`"$base"/*/`) procurando
uma que contenha `Calendario`. Achou → guarda em `DESTINO` e para.

🔤 **Sintaxe.**
- `[[ -d "$base" ]]` → **testa** se é um diretório. `-z "$x"` → se a string é **vazia**.
- `|| continue` → "se o teste falhar, pule pra próxima volta".
- `"$base"/*/` → **_globbing_**: expande pras subpastas (a barra final restringe a
  diretórios).
- `break 2` → sai de **dois** laços de uma vez (o interno **e** o externo).
- `>&2` → manda o `echo` pro **stderr** (canal de erro). `exit 1` → sai com falha.

🧠 **Conceito — mesma sondagem do `gerar.mjs`, em Bash.** A letra/rótulo do pendrive muda
de máquina; então o código **procura** em vez de fixar um caminho.

⚠️ **Armadilha.** É específico de **Linux**: `/run/media/$USER` e `/media/$USER` são
convenções Linux. O **macOS monta volumes externos em `/Volumes`**, que não está na
lista — num Mac, o script terminaria em "não achei a pasta Calendario". E não há
caminho Windows aqui — no Windows o fluxo é outro (uma cópia local do código na
pasta do usuário, ex.: `C:\Users\voce\Calendario`).

---

## Bloco 4 — Copiar o código com "recomeço limpo" (linhas 28–33)

```bash
mkdir -p "$DESTINO/codigo"
rm -rf "$DESTINO/codigo"
mkdir -p "$DESTINO/codigo"
for item in gerar.mjs template.html README.md dados.exemplo.json sync-pendrive.sh .gitignore; do
  [[ -e "$RAIZ/$item" ]] && cp -f "$RAIZ/$item" "$DESTINO/codigo/$item"
done
```

📌 **O quê.** Zera a pasta `codigo/` e copia **só** os arquivos de código listados.

🧠 **Conceito 1 — _clean slate_ (recomeço limpo).** A sequência `mkdir -p` → `rm -rf` →
`mkdir -p` garante uma pasta **vazia**: assim, se um arquivo foi **removido** do projeto,
ele também some do pendrive (uma cópia "por cima" deixaria lixo pra trás). O primeiro
`mkdir -p` evita erro caso a pasta ainda não exista.

🧠 **Conceito 2 — lista de permissão (allowlist).** Copia **exatamente** os itens da lista.
Repare que **`dados.json` NÃO está nela** — é assim que o script honra "nunca tocar no
dado". `[[ -e "$RAIZ/$item" ]] && cp …` só copia se o arquivo existir.

⚠️ **Armadilha — `rm -rf` em variável.** `rm -rf "$DESTINO/codigo"` é seguro porque
`DESTINO` foi validado (não é vazio) e o alvo é específico (`/codigo`). `rm -rf` em uma
variável mal formada é uma das formas clássicas de acidente em shell — o modo estrito
(`-u`) e a checagem de `-z` ajudam a evitar isso.

---

## Bloco 5 — Escrever o `COMO-USAR.txt` (linhas 35–53)

```bash
cat > "$DESTINO/COMO-USAR.txt" <<'EOF'
CALENDÁRIO — como usar
... texto ...
EOF
```

🔤 **Sintaxe — _here-document_ (heredoc).** `cat > arquivo <<'EOF' … EOF` escreve tudo
entre os marcadores no arquivo. Aspas em `'EOF'` tornam o conteúdo **literal** (não
expande `$variáveis` nem comandos) — ideal pra um texto fixo com `$` ou `\` dentro.

🎯 **Porquê.** Deixa junto do dado um lembrete de uso pra quem abrir o pendrive noutra
máquina, sem precisar do README.

---

## Bloco 6 — Relatório final (linhas 55–57)

```bash
echo "Código do Calendário registrado em: $DESTINO/codigo"
ls -la "$DESTINO" | sed 's/^/  /'
[[ -e "$DESTINO/dados.json" ]] && echo "  (dados.json existente foi preservado)"
```

⚙️ **Como.** Confirma o destino, **lista** o conteúdo (o `sed 's/^/  /'` **indenta** cada
linha, colando dois espaços no início) e, **se** havia um `dados.json`, avisa que foi
**preservado** — reforçando a promessa de não tocar no dado.

🧠 **Conceito — feedback e verificação.** Um bom script termina **mostrando o que fez**,
pra você conferir de olho. O aviso final é uma garantia explícita de segurança.

---

## Recapitulando o `sync-pendrive.sh`

- **Modo estrito** (`set -euo pipefail`) + **ancorar no script** = base segura.
- **Procura** o pendrive (rótulo muda), como o `gerar.mjs`.
- **Recomeço limpo** + **allowlist** de arquivos → o código fica idêntico ao projeto, e o
  `dados.json` **nunca** é copiado nem sobrescrito.
- **Heredoc** pro `COMO-USAR.txt`; **relatório** no fim.
- Idiomas Bash: `$( … )`, `[[ -d ]]`/`[[ -z ]]`, `|| continue`, _globbing_ `*/`,
  `break 2`, `>&2`, heredoc `<<'EOF'`.
