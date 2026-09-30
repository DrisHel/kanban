/**
 * Erro reservado para os casos de uso opcionais ainda não implementados.
 * Mapeado para HTTP 501 em `shared/errorHandler.ts`.
 */
export class NotImplementedError extends Error {
  constructor(where: string) {
    super(`${where} ainda não foi implementado — veja a lista de atividades em aula03.md.`);
    this.name = 'NotImplementedError';
  }
}
