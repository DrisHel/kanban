import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createServer } from '../../../src/server.js';
import { BoardController } from '../../../src/boards/BoardController.js';
import { InvalidColumnNameError } from '../../../src/boards/errors.js';
import { buildTestRepositories } from '../../helpers/fixtures.js';

describe('GET /', () => {
  it('renderiza o quadro com suas colunas', async () => {
    const app = createServer(buildTestRepositories());

    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.type).toBe('text/html');
    expect(response.text).toContain('Quadro de Teste');
    expect(response.text).toContain('Coluna 1');
    expect(response.text).toContain('Coluna 2');
  });
});

describe('POST /columns', () => {
  it('cria coluna com nome e limite WIP e redireciona para o quadro', async () => {
    const repositories = buildTestRepositories();
    const app = createServer(repositories);

    const response = await request(app).post('/columns').send({ name: 'Nova Coluna', wipLimit: '4' });

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/');
    expect(repositories.boardRepository.getDefault().columns[2].toSnapshot()).toMatchObject({
      name: 'Nova Coluna',
      order: 3,
      wipLimit: 4,
    });
  });

  it('aceita limite WIP ausente, vazio ou nulo e rejeita corpo sem nome', async () => {
    const repositories = buildTestRepositories();
    const app = createServer(repositories);

    const emptyLimit = await request(app).post('/columns').send({ name: 'Sem limite vazio', wipLimit: '' });
    const nullLimit = await request(app).post('/columns').send({ name: 'Sem limite nulo', wipLimit: null });
    const missingBody = await request(app).post('/columns');

    expect(emptyLimit.status).toBe(302);
    expect(nullLimit.status).toBe(302);
    expect(missingBody.status).toBe(400);
    expect(repositories.boardRepository.getDefault().columns.slice(2).map((column) => column.wipLimit))
      .toEqual([null, null]);
  });

  it('rejeita body null diretamente no controller', () => {
    const repositories = buildTestRepositories();
    const controller = new BoardController(repositories.boardRepository, repositories.cardRepository);

    expect(() => controller.createColumn(null)).toThrow(InvalidColumnNameError);
  });

  it('permite nomes de coluna duplicados e valida nome/limite WIP', async () => {
    const repositories = buildTestRepositories();
    const app = createServer(repositories);
    await request(app).post('/columns').send({ name: 'Nova Coluna' });

    const duplicateName = await request(app).post('/columns').send({ name: 'Nova Coluna' });
    const invalidName = await request(app).post('/columns').send({ name: 'x' });
    const invalidLimit = await request(app).post('/columns').send({ name: 'Sem limite válido', wipLimit: '1.5' });

    expect(duplicateName.status).toBe(302);
    expect(invalidName.status).toBe(400);
    expect(invalidLimit.status).toBe(400);
  });
});
