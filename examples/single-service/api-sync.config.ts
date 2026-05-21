export default {
  services: {
    main: {
      input: { path: './fixtures/openapi.json' },
      output: { dir: './src/api/generated' },
      generators: ['typescript', 'sdk'],
      compliance: { strict: false },
    },
  },
};
