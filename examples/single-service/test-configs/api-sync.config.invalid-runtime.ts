export default {
  services: {
    main: {
      input: { path: './fixtures/openapi.json' },
      output: { dir: './src/api/invalid' },
      runtime: { validationRate: 2 },
    },
  },
};
