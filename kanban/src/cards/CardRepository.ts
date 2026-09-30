import type { Card } from './Card.js';

/**
 * MODEL (persistência) — "banco em memória" dos cartões. O Controller usa
 * este contrato para criar, consultar, mover, editar e excluir cartões.
 */
export interface CardRepository {
  save(card: Card): void;
  findAll(): Card[];
  findById(id: string): Card | undefined;
  findByColumn(columnId: string): Card[];
  existsWithTitleInColumn(title: string, columnId: string, excludeId?: string): boolean;
  delete(id: string): void;
}

export class InMemoryCardRepository implements CardRepository {
  private readonly cards = new Map<string, Card>();

  save(card: Card): void {
    this.cards.set(card.id, card);
  }

  findAll(): Card[] {
    return Array.from(this.cards.values());
  }

  findById(id: string): Card | undefined {
    return this.cards.get(id);
  }

  findByColumn(columnId: string): Card[] {
    return this.findAll().filter((card) => card.columnId === columnId);
  }

  existsWithTitleInColumn(title: string, columnId: string, excludeId?: string): boolean {
    const normalized = title.trim().toLowerCase();
    return this.findAll().some(
      (card) =>
        card.id !== excludeId && card.columnId === columnId && card.title.toLowerCase() === normalized,
    );
  }

  delete(id: string): void {
    this.cards.delete(id);
  }
}
