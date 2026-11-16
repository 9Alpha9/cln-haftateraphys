import nextConfig from 'eslint-config-next';

const config = [
  ...nextConfig,
  {
    ignores: ['node_modules/**', '.next/**', 'out/**', 'build/**', 'artifacts/**'],
  },
];

export default config;
