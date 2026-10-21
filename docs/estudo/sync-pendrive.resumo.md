# `sync-pendrive.sh` — resumo (enxuto)

Folha de consulta. Versão a fundo: [`sync-pendrive.explicado.md`](sync-pendrive.explicado.md).

**O que é.** Script Bash de **distribuição** (Linux). Leva o **código** pro pendrive
(`<pendrive>/Calendario/codigo/`) pra regerar a página em qualquer máquina. **Nunca** toca
no `dados.json`.

**Fluxo.**
1. `set -euo pipefail` — modo estrito.
2. `RAIZ` = pasta do script.
3. **Procura** `Calendario` em `/run/media/$USER` e `/media/$USER`; nada → erro + `exit 1`.
4. Se já está no próprio destino, pula a cópia; se `codigo/` é link para outro local, recusa.
5. Cria `codigo/` se necessário e atualiza uma **allowlist** (sem `dados.json`), preservando extras.
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
- Não apaga a pasta: arquivos extras e subpastas permanecem preservados.
- GNU `cp --remove-destination` substitui arquivos sem escrever através de links.
- Uma falha pode deixar o código parcialmente atualizado; não há transação da pasta inteira.
- `dados.json` fora da allowlist **de propósito** = a única cópia do dado fica intocada.
