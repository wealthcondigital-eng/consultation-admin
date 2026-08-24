import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';

/// Flat config. `eslint-config-next` 16 exports flat arrays directly, so there
/// is no need for the `FlatCompat` shim that older setups reach for.
export default [
  ...coreWebVitals,
  ...typescript,
  {
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'],
  },
];
