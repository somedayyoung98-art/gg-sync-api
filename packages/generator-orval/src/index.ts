import { registerGenerator } from '@somedayyoung/core';
import { runOrvalGenerate } from './orval-bridge';

registerGenerator(runOrvalGenerate);

export { runOrvalGenerate } from './orval-bridge';
export { createOrvalGenerationPasses, mapToOrvalConfig } from './map-config';
