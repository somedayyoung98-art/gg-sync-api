import type { CodeGenerator } from './types';

let codeGenerator: CodeGenerator;

export function registerGenerator(generator: CodeGenerator): void {
  codeGenerator = generator;
}

export function generateCode(...args: Parameters<CodeGenerator>): ReturnType<CodeGenerator> {
  return codeGenerator(...args);
}
