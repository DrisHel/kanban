import { describe, expect, it } from 'vitest';
import { Board } from '../../../src/boards/Board.js';
import { Column } from '../../../src/boards/Column.js';
import { ColumnNotFoundError, InvalidColumnNameError, InvalidWipLimitError } from '../../../src/boards/errors.js';

function buildBoard(): Board {
  const columns = [
    Column.create('col-todo', 'A Fazer', 1),
    Column.create('col-doing', 'Em Andamento', 2, 3),
  ];
  return Board.create('board-1', 'Quadro de Teste', columns);
}

describe('Board — getters básicos', () => {
  it('expõe id e a lista de colunas', () => {
    const board = buildBoard();

    expect(board.id).toBe('board-1');
    expect(board.columns).toHaveLength(2);
  });
});

describe('Board#findColumn', () => {
  it('retorna a coluna quando ela existe', () => {
    const board = buildBoard();

    expect(board.findColumn('col-todo').name).toBe('A Fazer');
  });

  it('lança ColumnNotFoundError quando a coluna não existe', () => {
    const board = buildBoard();

    expect(() => board.findColumn('col-inexistente')).toThrow(ColumnNotFoundError);
  });
});

describe('Board#hasColumn', () => {
  it('retorna true quando a coluna existe', () => {
    expect(buildBoard().hasColumn('col-doing')).toBe(true);
  });

  it('retorna false quando a coluna não existe', () => {
    expect(buildBoard().hasColumn('col-inexistente')).toBe(false);
  });
});

describe('Board#addColumn', () => {
  it('adiciona uma coluna com id único e próxima ordem', () => {
    const board = buildBoard();

    const first = board.addColumn('Em Revisão', 2);
    const second = board.addColumn('Em Revisão');

    expect(first.id).toBeTypeOf('string');
    expect(first.order).toBe(3);
    expect(first.wipLimit).toBe(2);
    expect(second.order).toBe(4);
    expect(board.columns).toHaveLength(4);
  });

  it('rejeita nome inválido e limite WIP não inteiro ou negativo', () => {
    const board = buildBoard();

    expect(() => board.addColumn('x')).toThrow(InvalidColumnNameError);
    expect(() => board.addColumn('Válida', 1.5)).toThrow(InvalidWipLimitError);
    expect(() => board.addColumn('Válida', -1)).toThrow(InvalidWipLimitError);
  });
});

describe('Board#toSnapshot', () => {
  it('devolve as colunas ordenadas por order', () => {
    const columns = [Column.create('col-b', 'Segunda', 2), Column.create('col-a', 'Primeira', 1)];
    const board = Board.create('board-1', 'Quadro', columns);

    const snapshot = board.toSnapshot();

    expect(snapshot.columns.map((c) => c.id)).toEqual(['col-a', 'col-b']);
  });
});
