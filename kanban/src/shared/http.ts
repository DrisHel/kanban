import type { Response } from 'express';

/**
 * Resultado que um Controller devolve para a rota renderizar ou redirecionar.
 */
export interface RenderResult {
  status: number;
  view: string;
  locals: Record<string, unknown>;
}

export interface RedirectResult {
  status: number;
  redirect: string;
}

export type ControllerResult = RenderResult | RedirectResult;

export function respond(res: Response, result: ControllerResult): void {
  if ('redirect' in result) {
    res.redirect(result.status, result.redirect);
    return;
  }

  res.status(result.status).render(result.view, result.locals);
}
