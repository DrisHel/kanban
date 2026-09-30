/**
 * Erros de domínio do módulo `cards`. Só existem aqui os erros que o
 * código ATUAL realmente lança (`Card.create`) — de propósito: um erro
 * definido e nunca usado é código morto.
 *
 * Vocês vão precisar criar novos conforme implementam as atividades, por
 * exemplo: `CardNotFoundError` (Atividade 2/3/4), `DuplicateCardTitleError`
 * (Atividade 6), `WipLimitExceededError` (Atividade 5). Ao criar um, não
 * esqueçam de registrar o status HTTP correspondente em
 * `shared/errorHandler.ts`.
 */

export class InvalidCardTitleError extends Error {
  constructor(reason: string) {
    super(`Título de cartão inválido: ${reason}`);
    this.name = 'InvalidCardTitleError';
  }
}

export class InvalidCardColumnError extends Error {
  constructor(reason: string) {
    super(`Coluna do cartão inválida: ${reason}`);
    this.name = 'InvalidCardColumnError';
  }
}

export class InvalidPriorityError extends Error {
  constructor(value: unknown) {
    super(`Prioridade inválida: "${String(value)}". Use "baixa", "média" ou "alta".`);
    this.name = 'InvalidPriorityError';
  }
}

export class CardNotFoundError extends Error {
  constructor(id: string) {
    super(`Cartão não encontrado: "${id}".`);
    this.name = 'CardNotFoundError';
  }
}

export class DuplicateCardTitleError extends Error {
  constructor(title: string, columnId: string) {
    super(`Já existe um cartão com o título "${title}" na coluna "${columnId}".`);
    this.name = 'DuplicateCardTitleError';
  }
}

export class WipLimitExceededError extends Error {
  constructor(columnId: string, limit: number) {
    super(`A coluna "${columnId}" atingiu seu limite de WIP (${limit}).`);
    this.name = 'WipLimitExceededError';
  }
}
