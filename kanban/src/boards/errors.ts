/**
 * Erros de domínio do módulo `boards`. Falam a língua do negócio (nome de
 * coluna, quadro), não a língua do HTTP — quem traduz para status code é
 * `shared/errorHandler.ts`.
 *
 * Se vocês criarem novas regras neste módulo (ex.: nome de coluna
 * duplicado), adicionem o erro aqui e registrem o mapeamento em
 * `shared/errorHandler.ts`.
 */

export class InvalidColumnNameError extends Error {
  constructor(reason: string) {
    super(`Nome de coluna inválido: ${reason}`);
    this.name = 'InvalidColumnNameError';
  }
}

export class InvalidWipLimitError extends Error {
  constructor() {
    super('Limite de WIP inválido: informe um inteiro maior ou igual a zero.');
    this.name = 'InvalidWipLimitError';
  }
}

export class ColumnNotFoundError extends Error {
  constructor(columnId: string) {
    super(`Coluna ${columnId} não encontrada`);
    this.name = 'ColumnNotFoundError';
  }
}
