export default {
  services: {
    main: {
      input: { path: './fixtures/openapi.json' },
      output: { dir: './src/api/invalid' },
      fallback: true,
    },
  },
};
