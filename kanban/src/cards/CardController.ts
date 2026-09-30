import type { CardRepository } from './CardRepository.js';
import type { BoardRepository } from '../boards/BoardRepository.js';
import type { ControllerResult } from '../shared/http.js';
import { Card, type CardPriority } from './Card.js';
import { CardNotFoundError, DuplicateCardTitleError, WipLimitExceededError } from './errors.js';
import { NotImplementedError } from '../shared/errors.js';

/** Coordena as operações de cartão e valida dependências com o módulo boards. */
export class CardController {
  constructor(
    private readonly cardRepository: CardRepository,
    private readonly boardRepository: BoardRepository,
  ) {}

  create(body: unknown): ControllerResult {
    const input = typeof body === 'object' && body !== null ? body as Record<string, unknown> : {};
    const card = Card.create(
      input.title as string,
      input.columnId as string,
      input.priority as CardPriority | undefined,
      typeof input.description === 'string' ? input.description : '',
    );

    const board = this.boardRepository.getDefault();
    if (!board.hasColumn(card.columnId)) {
      board.findColumn(card.columnId);
    }

    this.ensureUniqueTitle(card.title, card.columnId);
    this.ensureWipAvailable(card.columnId);
    this.cardRepository.save(card);
    return { status: 302, redirect: '/' };
  }

  move(id: string, body: unknown): ControllerResult {
    const card = this.cardRepository.findById(id);
    if (!card) {
      throw new CardNotFoundError(id);
    }

    const input = typeof body === 'object' && body !== null ? body as Record<string, unknown> : {};
    const columnId = input.columnId as string;
    const board = this.boardRepository.getDefault();
    const targetColumn = board.findColumn(columnId);

    if (card.columnId !== columnId) {
      this.ensureUniqueTitle(card.title, columnId, card.id);
      this.ensureWipAvailable(columnId, targetColumn.wipLimit);
    }

    card.changeColumn(columnId);
    this.cardRepository.save(card);
    return { status: 302, redirect: '/' };
  }

  update(id: string, body: unknown): ControllerResult {
    const card = this.cardRepository.findById(id);
    if (!card) {
      throw new CardNotFoundError(id);
    }

    const input = typeof body === 'object' && body !== null ? body as Record<string, unknown> : {};
    const title = input.title === undefined ? card.title : input.title as string;
    const description = input.description === undefined
      ? card.description
      : typeof input.description === 'string' ? input.description : card.description;
    const priority = input.priority === undefined ? card.priority : input.priority as CardPriority;

    const updatedCard = Card.restore(card.toSnapshot());
    updatedCard.rename(title, description);
    updatedCard.changePriority(priority);
    this.ensureUniqueTitle(updatedCard.title, updatedCard.columnId, updatedCard.id);
    this.cardRepository.save(updatedCard);
    return { status: 302, redirect: '/' };
  }

  remove(id: string): ControllerResult {
    if (!this.cardRepository.findById(id)) {
      throw new CardNotFoundError(id);
    }
    this.cardRepository.delete(id);
    return { status: 302, redirect: '/' };
  }

  /** TODO (Atividade 8, estica): página de detalhe de um cartão. */
  showDetail(_id: string): ControllerResult {
    throw new NotImplementedError('CardController#showDetail');
  }

  /** TODO (Atividade 9, estica): buscar cartões por título (`?query=`). */
  search(_query: unknown): ControllerResult {
    throw new NotImplementedError('CardController#search');
  }

  private ensureUniqueTitle(title: string, columnId: string, excludeId?: string): void {
    if (this.cardRepository.existsWithTitleInColumn(title, columnId, excludeId)) {
      throw new DuplicateCardTitleError(title, columnId);
    }
  }

  private ensureWipAvailable(columnId: string, wipLimit?: number | null): void {
    const limit = wipLimit ?? this.boardRepository.getDefault().findColumn(columnId).wipLimit;
    if (limit !== null && limit !== undefined && this.cardRepository.findByColumn(columnId).length >= limit) {
      throw new WipLimitExceededError(columnId, limit);
    }
  }
}
