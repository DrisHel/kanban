# Aula 03 — Template Kanban (MVC + banco em memória + Tailwind)

Template de partida para a atividade prática da Aula 03. Uma aplicação de gestão de tarefas estilo Trello/Jira (quadro → colunas → cartões), em MVC, com "banco de dados" em memória e UI em Tailwind (via CDN).

**Estado atual:** as atividades obrigatórias 1–7 estão implementadas: cartões podem ser criados, movidos, editados e excluídos; limites de WIP e títulos duplicados são validados; novas colunas podem ser adicionadas. As atividades extras 8–11 continuam fora do escopo desta entrega.

## Rodando

```bash
npm install
npm test              # suíte completa (unit + integration + e2e)
npm run test:coverage  # com relatório de cobertura — a meta é 100%
npm run dev             # sobe o servidor em http://localhost:3002
```

Abra `http://localhost:3002` para usar o quadro. A aplicação mantém os dados em memória; reiniciar o servidor restaura o seed.

## Estrutura (package by feature)

```
src/
├── boards/                  → tudo relacionado a Quadro e Coluna
│   ├── Board.ts               MODEL: aggregate root (colunas, criação de coluna)
│   ├── Column.ts               MODEL: uma coluna (nome, ordem, limite de WIP)
│   ├── BoardRepository.ts      MODEL (persistência): banco em memória do quadro
│   ├── BoardController.ts      CONTROLLER: exibição e criação de coluna
│   ├── boardView.ts             VIEW: monta o "view model" (inclui os cartões)
│   └── errors.ts                 erros de domínio deste módulo
├── cards/                   → tudo relacionado a Cartão
│   ├── Card.ts                 MODEL: validação e operações de mover/renomear/priorizar
│   ├── CardRepository.ts        MODEL (persistência): banco em memória dos cartões — PRONTO
│   ├── CardController.ts        CONTROLLER: criar/mover/editar/excluir; detalhe e busca extras pendentes
│   └── errors.ts                 erros de domínio deste módulo
├── shared/
│   ├── errors.ts                NotImplementedError
│   ├── http.ts                   ControllerResult + respond()
│   └── errorHandler.ts           mapeia erro de domínio → status HTTP
├── views/
│   ├── board/index.ejs           UI do quadro (Tailwind)
│   └── error.ejs                  página de erro genérica
├── seed.ts                   dados hard-coded (o quadro que aparece em GET /)
├── routes.ts                  todas as rotas já registradas
├── server.ts                   monta o Express app (injeta repositórios)
└── index.ts                    sobe o servidor HTTP
```

Por que `boards/` e `cards/` como módulos separados (em vez de `domain/`, `controllers/`, `views/` como na Aula 02)? Porque o tema da Aula 03 é justamente **package by feature x package by layer** — este template já nasce organizado por funcionalidade. Reparem no acoplamento cruzado que isso expõe: `BoardController` depende do `CardRepository` (para desenhar cartões dentro das colunas) e `CardController` depende do `BoardRepository` (para validar coluna). Isso é discutido em [`../aula03.md`](../aula03.md).

## O que já está pronto x o que é a atividade

| Camada | Pronto | Pendente (atividade da turma) |
| --- | --- | --- |
| Model (`Board`, `Column`) | Validação de nome/WIP, consulta de colunas, snapshot | — |
| Model (`Card`) | Validação de título/prioridade/coluna, `restore`, mover, renomear, priorizar, snapshot | — |
| Persistência (`*Repository`) | CRUD completo, em memória, testado | — (já está pronto; usem os métodos existentes) |
| Controller (`BoardController`) | Exibição e criação de colunas | — |
| Controller (`CardController`) | Criar, mover, editar e excluir cartões; WIP e duplicidade | Detalhe e busca (atividades extras 8 e 9) |
| View / rotas | Renderização do quadro, todas as rotas registradas, tratamento de erro central | — |
| Testes | 100% de cobertura em todas as métricas | — |

## Testes: onde estão e o que fazer com eles

```
test/
├── unit/                 → Model isolado (Board, Column, Card)
├── integration/
│   ├── boards/, cards/    → Repository real (sem dublês)
│   ├── shared/             → errorHandler isolado
│   └── routes/             → Express + Controller + Repository reais, via Supertest
│       ├── board.routes.test.ts
│       └── cards.routes.test.ts   ← criação, movimentação, edição e exclusão
└── e2e/
    └── board.e2e.test.ts    → quadro semeado e jornada de cartões via HTTP
```

Detalhes dos testes:

1. As atividades obrigatórias não têm mais `test.todo`: os testes de integração exercitam sucesso, validação e conflitos via HTTP; o fluxo completo também é exercitado em `test/e2e/board.e2e.test.ts`.
2. As atividades extras 8 e 9 ainda respondem 501; as extras 10 e 11 exigem mudanças arquiteturais maiores e não foram iniciadas.

## Decisões registradas

- O acoplamento entre `boards/` e `cards/` é aceitável para o tamanho atual e para um único processo, mas os Controllers conhecem os repositórios concretos do outro módulo. Se `cards` virar serviço separado, a dependência de `CardController` em `BoardRepository` será um dos primeiros pontos a quebrar; a validação de coluna precisará virar um contrato remoto/port.
- Fazer `Board` possuir IDs de cartões reduziria a consulta de coluna feita por `CardController`, mas levaria o módulo `boards` a conhecer a identidade e o ciclo de vida de cartões, ampliando a dependência de negócio na direção oposta. Não foi adotado nesta entrega.
- O limite WIP é verificado ao criar e mover cartões para uma coluna limitada. Títulos são comparados sem diferenciar maiúsculas/minúsculas e só precisam ser únicos dentro da mesma coluna.
- Nomes de coluna duplicados são permitidos. Cartões em “Concluído” também podem ser excluídos; não há regra de retenção no enunciado implementado.

## Cobertura: por que 100% e como manter

`vitest.config.ts` define `thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 }`; `npm run test:coverage` verifica essa meta.

Na prática isso significa: **toda linha de código novo que vocês escreverem precisa de pelo menos um teste que passe por ela.** Não é burocracia — é o motivo de existir tanto dublê pronto (repositórios reais, fixtures em `test/helpers/fixtures.ts`) para vocês não perderem tempo montando infraestrutura de teste, só escrevendo o teste da regra que importa.

Dica: implementem casos de uso simples e testáveis (retornam cedo em erro, uma responsabilidade por método) — fica mais fácil cobrir 100% dos branches sem casos artificiais.
