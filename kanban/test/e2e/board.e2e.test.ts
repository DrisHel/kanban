import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createServer } from '../../src/server.js';
import { createSeededRepositories } from '../../src/seed.js';

/**
 * Valida o quadro semeado e a jornada completa de cartões usando os mesmos
 * repositórios em memória injetados no servidor.
 */
describe('Estado inicial: visualização do quadro hard-coded', () => {
  it('GET / mostra o quadro, as três colunas e os cartões semeados', async () => {
    const app = createServer();

    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Quadro do Projeto');
    expect(response.text).toContain('A Fazer');
    expect(response.text).toContain('Em Andamento');
    expect(response.text).toContain('Concluído');
    expect(response.text).toContain('Criar cartão (Atividade 1)');
    expect(response.text).toContain('/cards/');
    expect(response.text).toContain('Criar coluna');
  });

  it('a coluna "Em Andamento" mostra o limite de WIP (1/3) e não está estourada', async () => {
    const app = createServer();

    const response = await request(app).get('/');

    expect(response.text).toContain('1/3');
  });

  it('cartões de prioridade alta, média e baixa aparecem com rótulos diferentes', async () => {
    const app = createServer();

    const response = await request(app).get('/');

    expect(response.text).toContain('alta');
    expect(response.text).toContain('média');
    expect(response.text).toContain('baixa');
  });
});

describe('Jornada completa de cartões', () => {
  it('cria, move, edita e exclui cartão via HTTP', async () => {
    const repositories = createSeededRepositories();
    const app = createServer(repositories);
    const created = await request(app).post('/cards').send({
      title: 'Cartão da jornada',
      columnId: 'col-todo',
      priority: 'baixa',
    });
    expect(created.status).toBe(302);

    const card = repositories.cardRepository.findAll().find((item) => item.title === 'Cartão da jornada')!;
    const moved = await request(app).post(`/cards/${card.id}/move`).send({ columnId: 'col-doing' });
    const updated = await request(app).post(`/cards/${card.id}/update`).send({
      title: 'Cartão da jornada editado',
      description: 'Fluxo completo',
      priority: 'alta',
    });
    const completed = await request(app).post(`/cards/${card.id}/move`).send({ columnId: 'col-done' });
    const deleted = await request(app).post(`/cards/${card.id}/delete`);

    expect(moved.status).toBe(302);
    expect(updated.status).toBe(302);
    expect(completed.status).toBe(302);
    expect(deleted.status).toBe(302);
    expect(repositories.cardRepository.findById(card.id)).toBeUndefined();
  });
});
