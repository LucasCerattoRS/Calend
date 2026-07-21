# `sync-pendrive.sh` — resumo (enxuto)

Folha de consulta. Versão a fundo: [`sync-pendrive.explicado.md`](sync-pendrive.explicado.md).

**O que é.** Script Bash de **distribuição** (Linux). Leva o **código** pro pendrive
(`<pendrive>/Calendario/codigo/`) pra regerar a página em qualquer máquina. **Nunca** toca
no `dados.json`.

**Fluxo.**
1. `set -euo pipefail` — modo estrito.
2. `RAIZ` = pasta do script.
3. **Procura** `Calendario` em `/run/media/$USER` e `/media/$USER`; nada → erro + `exit 1`.
4. **Recomeço limpo** de `codigo/` (`mkdir -p` → `rm -rf` → `mkdir -p`).
5. Copia uma **allowlist** de arquivos (sem `dados.json`).
6. Escreve `COMO-USAR.txt` (heredoc).
7. **Relatório** + aviso "dados.json preservado".

**Idiomas Bash.**
| Idiom | Faz |
|---|---|
| `#!/usr/bin/env bash` | _shebang_ portável |
| `set -euo pipefail` | aborta em erro / var indefinida / falha em pipe |
| `"$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"` | pasta absoluta do script |
| `[[ -d x ]]` / `[[ -z x ]]` | testa "é diretório" / "string vazia" |
| `\|\| continue` | pula a iteração se o teste falhar |
| `"$base"/*/` | _glob_ das subpastas |
| `break 2` | sai de dois laços |
| `>&2` | escreve no stderr |
| `cat > f <<'EOF' … EOF` | heredoc literal (não expande `$`) |

**Gotchas.**
- Só **Linux** (macOS monta em `/Volumes`, fora da lista); no **Windows** usa-se a
  cópia local do código.
- `rm -rf "$DESTINO/codigo"` é seguro porque `DESTINO` é validado (não-vazio) e específico.
- O **recomeço limpo** garante que arquivos removidos do projeto sumam do pendrive.
- `dados.json` fora da allowlist **de propósito** = a única cópia do dado fica intocada.
