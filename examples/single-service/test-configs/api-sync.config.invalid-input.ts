export default {
  services: {
    main: {
      input: {
        path: './fixtures/openapi.json',
        url: 'https://api.example.test/openapi.json',
      },
      output: { dir: './src/api/invalid' },
    },
  },
};
