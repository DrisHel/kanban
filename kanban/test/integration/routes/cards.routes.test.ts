import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createServer } from '../../../src/server.js';
import { CardController } from '../../../src/cards/CardController.js';
import { Card } from '../../../src/cards/Card.js';
import { ColumnNotFoundError } from '../../../src/boards/errors.js';
import { buildTestRepositories } from '../../helpers/fixtures.js';

describe('Rotas de cartões', () => {
  it('POST /cards cria um cartão válido e redireciona para /', async () => {
    const repositories = buildTestRepositories();
    const app = createServer(repositories);
    const response = await request(app).post('/cards').send({
      title: 'Novo cartão',
      columnId: 'col-1',
      priority: 'alta',
      description: 'Descrição do cartão',
    });
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/');
    expect(repositories.cardRepository.findAll()[0].toSnapshot()).toMatchObject({
      title: 'Novo cartão',
      columnId: 'col-1',
      priority: 'alta',
      description: 'Descrição do cartão',
    });
  });

  it('POST /cards rejeita título com menos de 3 caracteres com 400', async () => {
    const app = createServer(buildTestRepositories());
    const response = await request(app).post('/cards').send({ title: 'x', columnId: 'col-1' });
    expect(response.status).toBe(400);
  });

  it('CardController#create rejeita corpo que não é um objeto', () => {
    const repositories = buildTestRepositories();
    const controller = new CardController(repositories.cardRepository, repositories.boardRepository);
    expect(() => controller.create('corpo inválido')).toThrow('Título de cartão inválido');
  });

  it('move rejeita body null e update preserva campos com body null', () => {
    const repositories = buildTestRepositories();
    const controller = new CardController(repositories.cardRepository, repositories.boardRepository);
    const card = Card.create('Cartão de entrada', 'col-1', 'média', 'Descrição inicial');
    repositories.cardRepository.save(card);

    expect(() => controller.move(card.id, null)).toThrow(ColumnNotFoundError);
    expect(controller.update(card.id, null).status).toBe(302);
    expect(repositories.cardRepository.findById(card.id)?.toSnapshot()).toMatchObject({
      title: 'Cartão de entrada',
      description: 'Descrição inicial',
      priority: 'média',
    });
  });

  it('POST /cards rejeita columnId de uma coluna que não existe com 404', async () => {
    const app = createServer(buildTestRepositories());
    const response = await request(app).post('/cards').send({ title: 'Novo cartão', columnId: 'inexistente' });
    expect(response.status).toBe(404);
  });

  it('POST /cards rejeita títulos duplicados na mesma coluna com 409', async () => {
    const app = createServer(buildTestRepositories());
    const payload = { title: 'Título único', columnId: 'col-1' };
    await request(app).post('/cards').send(payload);

    const response = await request(app).post('/cards').send(payload);

    expect(response.status).toBe(409);
  });

  it('POST /cards permite o mesmo título em colunas diferentes', async () => {
    const app = createServer(buildTestRepositories());
    const title = 'Mesmo título';
    await request(app).post('/cards').send({ title, columnId: 'col-1' });

    const response = await request(app).post('/cards').send({ title, columnId: 'col-2' });

    expect(response.status).toBe(302);
  });

  it('POST /cards/:id/move move o cartão e redireciona para /', async () => {
    const repositories = buildTestRepositories();
    const app = createServer(repositories);
    const createResponse = await request(app).post('/cards').send({ title: 'Cartão móvel', columnId: 'col-1' });
    const createdCard = repositories.cardRepository.findAll()[0];

    const response = await request(app).post(`/cards/${createdCard.id}/move`).send({ columnId: 'col-2' });

    expect(createResponse.status).toBe(302);
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/');
    expect(repositories.cardRepository.findById(createdCard.id)?.columnId).toBe('col-2');
  });

  it('POST /cards/:id/move responde 404 se o cartão não existe', async () => {
    const app = createServer(buildTestRepositories());
    const response = await request(app).post('/cards/nao-existe/move').send({ columnId: 'col-2' });
    expect(response.status).toBe(404);
  });

  it('POST /cards/:id/move responde 404 se a coluna destino não existe', async () => {
    const repositories = buildTestRepositories();
    const app = createServer(repositories);
    await request(app).post('/cards').send({ title: 'Cartão móvel', columnId: 'col-1' });
    const card = repositories.cardRepository.findAll()[0];

    const response = await request(app).post(`/cards/${card.id}/move`).send({ columnId: 'nao-existe' });

    expect(response.status).toBe(404);
    expect(card.columnId).toBe('col-1');
  });

  it('POST /cards/:id/move responde 409 quando a coluna destino atingiu WIP', async () => {
    const repositories = buildTestRepositories();
    const app = createServer(repositories);
    const first = await request(app).post('/cards').send({ title: 'Primeiro cartão', columnId: 'col-2' });
    expect(first.status).toBe(302);
    await request(app).post('/cards').send({ title: 'Outro cartão', columnId: 'col-1' });
    const card = repositories.cardRepository.findAll().find((item) => item.title === 'Outro cartão')!;

    const response = await request(app).post(`/cards/${card.id}/move`).send({ columnId: 'col-2' });

    expect(response.status).toBe(409);
    expect(card.columnId).toBe('col-1');
  });

  it('POST /cards rejeita criação em coluna que atingiu WIP', async () => {
    const app = createServer(buildTestRepositories());
    await request(app).post('/cards').send({ title: 'Primeiro cartão', columnId: 'col-2' });

    const response = await request(app).post('/cards').send({ title: 'Segundo cartão', columnId: 'col-2' });

    expect(response.status).toBe(409);
  });

  it('POST /cards/:id/update edita título, descrição e prioridade', async () => {
    const repositories = buildTestRepositories();
    const app = createServer(repositories);
    await request(app).post('/cards').send({ title: 'Cartão original', columnId: 'col-1' });
    const card = repositories.cardRepository.findAll()[0];

    const response = await request(app).post(`/cards/${card.id}/update`).send({
      title: 'Cartão atualizado',
      description: 'Descrição nova',
      priority: 'alta',
    });

    expect(response.status).toBe(302);
    expect(repositories.cardRepository.findById(card.id)?.toSnapshot()).toMatchObject({
      title: 'Cartão atualizado',
      description: 'Descrição nova',
      priority: 'alta',
    });
  });

  it('POST /cards/:id/update aceita atualização parcial e rejeita título duplicado ou inválido', async () => {
    const repositories = buildTestRepositories();
    const app = createServer(repositories);
    await request(app).post('/cards').send({ title: 'Cartão um', columnId: 'col-1' });
    await request(app).post('/cards').send({ title: 'Cartão dois', columnId: 'col-1' });
    const [first, second] = repositories.cardRepository.findAll();

    const partial = await request(app).post(`/cards/${first.id}/update`).send({ priority: 'média' });
    const invalidDescription = await request(app).post(`/cards/${first.id}/update`).send({ description: 42 });
    const duplicate = await request(app).post(`/cards/${second.id}/update`).send({ title: 'Cartão um' });
    const invalid = await request(app).post(`/cards/${second.id}/update`).send({ title: 'x' });

    expect(partial.status).toBe(302);
    expect(repositories.cardRepository.findById(first.id)?.priority).toBe('média');
    expect(invalidDescription.status).toBe(302);
    expect(repositories.cardRepository.findById(first.id)?.description).toBe('');
    expect(duplicate.status).toBe(409);
    expect(repositories.cardRepository.findById(second.id)?.title).toBe('Cartão dois');
    expect(invalid.status).toBe(400);
  });

  it('POST /cards/:id/update responde 404 se o cartão não existe', async () => {
    const app = createServer(buildTestRepositories());
    const response = await request(app).post('/cards/nao-existe/update').send({ title: 'Editado' });
    expect(response.status).toBe(404);
  });

  it('POST /cards/:id/delete remove cartão de qualquer coluna e redireciona', async () => {
    const repositories = buildTestRepositories();
    const app = createServer(repositories);
    await request(app).post('/cards').send({ title: 'Cartão concluído', columnId: 'col-1' });
    const card = repositories.cardRepository.findAll()[0];

    const response = await request(app).post(`/cards/${card.id}/delete`);

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/');
    expect(repositories.cardRepository.findById(card.id)).toBeUndefined();
  });

  it('POST /cards/:id/delete responde 404 se o cartão não existe', async () => {
    const app = createServer(buildTestRepositories());
    const response = await request(app).post('/cards/nao-existe/delete');
    expect(response.status).toBe(404);
  });
});

describe('Atividades extras ainda não implementadas', () => {
  it('GET /cards/:id responde 501 (Atividade 8, estica)', async () => {
    const app = createServer(buildTestRepositories());
    const response = await request(app).get('/cards/qualquer-id');
    expect(response.status).toBe(501);
  });

  it('GET /cards/search responde 501 (Atividade 9, estica)', async () => {
    const app = createServer(buildTestRepositories());
    const response = await request(app).get('/cards/search').query({ query: 'termo' });
    expect(response.status).toBe(501);
  });
});
