# Auditoria de robustez e correção

## Escopo e método

Revisados os fluxos executáveis de `gerar.mjs`, `template.html` e
`sync-pendrive.sh`, seus testes, README e configuração da suíte.
Contexto: página offline de uso individual e geração/sincronização local.
Foram usadas exclusivamente fixtures sintéticas. Nenhum push, deploy ou acesso
a dados reais. As simulações de pendrive usam diretórios temporários.

Suíte inicial: `node --test testes/*.test.mjs`: **39 testes aprovados**, zero
falhas e zero testes pulados. Os testes de regressão foram escritos e executados
antes das alterações de produção.

## Bugs reproduzidos e corrigidos

### 1. Contador perde uma hora quando o início cai em horário local inexistente

Em `America/Sao_Paulo`, o início `2018-11-04T00:00` era normalizado pelo
construtor local de Date para 01:00. Em `2018-11-05T00:00:00-02:00`, o contador
mostrava **0 dias**, contrariando a contagem por relógio de parede adotada pelo
projeto, que exige **1 dia**. A correção representa os componentes do início
na mesma escala numérica de parede usada para o relógio atual, sem normalizar
esse início pelas transições do fuso.

Regressão: `início na meia-noite suprimida pelo horário de verão preserva a hora de parede`,
em `testes/pagina.test.mjs`. Antes: falha com `E 0 dias`; esperado `E 1 dia`.
O teste também verifica 00:30 do mesmo dia.

### 2. Sincronização inicial bem-sucedida retorna erro

Com a pasta Calendario existente, mas ainda sem dados.json, o script copiava o
código e gravava as instruções corretamente, porém retornava status **1**.
A última expressão `[[ -e ... ]] && echo ...` determinava o status do script.
A correção usa `if` para tornar o aviso opcional sem transformar a ausência
do arquivo em falha. Erros anteriores continuam sujeitos a `set -euo pipefail`.

Regressão: `sincronização inicial sem dados.json termina com sucesso`, em
`testes/sync.test.mjs`. Antes: arquivos copiados, mas assert falhava com `1 !== 0`.
O teste também confirma que nenhum dados.json é criado.

## Outras verificações e limites

- A suíte existente cobre listas vazias/nulas, campos hostis, chave __proto__,
  validação de datas, BOM, dose zero/ausente, saída igual à entrada,
  preservação de permissões, temporário preexistente e falha durante escrita.
- A falha parcial entre dois destinos continua sendo tolerada conforme o
  contrato e teste existentes; não foi reclassificada como bug.
- Lidos os mecanismos de escrita atômica e exclusividade do temporário.
  Não foi executado teste de estresse com processos concorrentes, troca de
  symlinks durante escrita ou interrupção por falta de energia. Não se afirma
  ausência de condições de corrida.
- Não verificados: Windows, navegadores reais, pendrive físico, falhas reais de
  montagem/disco, todos os fusos históricos, carga extrema e durabilidade após
  queda de energia. Os testes da página usam VM com DOM simplificado.
- A escolha documentada de usar o fuso do computador foi preservada.
- Os espelhos didáticos em docs/estudo/codigo-comentado não foram atualizados;
  o README já registra que descrevem versões anteriores.

Este relatório permanece fora dos commits.

## Resultado final

- Suíte completa após as correções: **41 testes aprovados**, zero falhas,
  zero pulados (`node --test testes/*.test.mjs`). As duas regressões passam.
- `node docs/estudo/harness-runtime.mjs`: terminou com status 0.
- `bash -n sync-pendrive.sh` e `git diff --check`: sem erros.
- Commit `40d3315`: correção do contador e sua regressão.
- Commit `359c7a2`: correção do status da sincronização e sua regressão.
- Sem dependências novas ou refatoração estética.
