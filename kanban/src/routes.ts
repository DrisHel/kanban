import { Router, type Request, type Response } from 'express';
import type { BoardController } from './boards/BoardController.js';
import type { CardController } from './cards/CardController.js';
import { respond } from './shared/http.js';

/** Rotas HTTP delegam os casos de uso aos Controllers dos módulos. */
export function createRoutes(boardController: BoardController, cardController: CardController): Router {
  const router = Router();

  router.get('/', (_req: Request, res: Response) => {
    respond(res, boardController.showBoard());
  });

  router.post('/columns', (req: Request, res: Response) => {
    respond(res, boardController.createColumn(req.body));
  });

  router.get('/cards/search', (req: Request, res: Response) => {
    respond(res, cardController.search(req.query));
  });

  router.get('/cards/:id', (req: Request, res: Response) => {
    respond(res, cardController.showDetail(req.params.id));
  });

  router.post('/cards', (req: Request, res: Response) => {
    respond(res, cardController.create(req.body));
  });

  router.post('/cards/:id/move', (req: Request, res: Response) => {
    respond(res, cardController.move(req.params.id, req.body));
  });

  router.post('/cards/:id/update', (req: Request, res: Response) => {
    respond(res, cardController.update(req.params.id, req.body));
  });

  router.post('/cards/:id/delete', (req: Request, res: Response) => {
    respond(res, cardController.remove(req.params.id));
  });

  return router;
}
