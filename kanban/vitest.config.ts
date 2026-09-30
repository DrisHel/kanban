import { defineConfig } from 'vitest/config';

/**
 * Meta do projeto: manter 100% de cobertura (linhas, funções, branches e
 * statements) para todo o código incluído.
 *
 * `src/index.ts` fica de fora: é só o bootstrap que sobe o servidor
 * (`app.listen`), sem lógica própria — testar isso exigiria abrir uma porta
 * de rede de verdade, o que não agrega cobertura de comportamento.
 */
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts'],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
});
