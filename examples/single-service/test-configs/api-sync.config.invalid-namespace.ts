export default {
  services: {
    '1main': {
      input: { path: './fixtures/openapi.json' },
      output: { dir: './src/api/invalid' },
    },
  },
};
