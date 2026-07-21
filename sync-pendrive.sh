#!/usr/bin/env bash
# Registra o CÓDIGO do Calendário no pendrive, em <pendrive>/Calendario/codigo/.
# O dado já vive no pendrive; isto leva o código junto, pra dar pra
# regenerar a página em qualquer máquina.
#
#   ./sync-pendrive.sh
#
# NUNCA sobrescreve o dados.json que já estiver lá — é a única cópia da informação.
set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Acha a pasta Calendario em qualquer pendrive montado (o rótulo muda de máquina).
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

mkdir -p "$DESTINO/codigo"
rm -rf "$DESTINO/codigo"
mkdir -p "$DESTINO/codigo"
for item in gerar.mjs template.html README.md dados.exemplo.json sync-pendrive.sh .gitignore; do
  [[ -e "$RAIZ/$item" ]] && cp -f "$RAIZ/$item" "$DESTINO/codigo/$item"
done

cat > "$DESTINO/COMO-USAR.txt" <<'EOF'
CALENDÁRIO — como usar

  Calendario.html   abra com 2 cliques. É a página: contagem de dias, o que tomo
                    hoje, próximas mudanças e histórico. Ela se recalcula sozinha
                    a cada dia — não precisa gerar de novo pra ela ficar em dia.

  dados.json        os fatos (eventos, medicamentos, períodos). É A ÚNICA CÓPIA.
                    Nunca vai pro git.

  codigo/           o código, pra regenerar em qualquer máquina:
                      node codigo/gerar.mjs
                    Só é preciso rodar isso quando MUDAR remédio, dose ou evento.
EOF

echo "Código do Calendário registrado em: $DESTINO/codigo"
ls -la "$DESTINO" | sed 's/^/  /'
[[ -e "$DESTINO/dados.json" ]] && echo "  (dados.json existente foi preservado)"
