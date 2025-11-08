import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import replace from '@rollup/plugin-replace';

const isDev = process.env.NODE_ENV === 'development';

const baseConfig = {
  plugins: [
    resolve(),
    replace({
      'process.env.NODE_ENV': JSON.stringify(isDev ? 'development' : 'production'),
    }),
    !isDev && terser(),
  ],
};

export default [
  // Bundle 1: Content Script
  {
    ...baseConfig,
    input: 'src/content/index.js',
    output: {
      file: 'deploy/content.js',
      format: 'es',
      sourcemap: isDev,
    },
  },
  // Bundle 2: Popup UI
  {
    ...baseConfig,
    input: 'src/popup/index.js',
    output: {
      file: 'deploy/popup.js',
      format: 'es',
      sourcemap: isDev,
    },
  },
  // Bundle 3: Settings Page
  {
    ...baseConfig,
    input: 'src/settings/index.js',
    output: {
      file: 'deploy/settings.js',
      format: 'es',
      sourcemap: isDev,
    },
  },
  // Bundle 4: Service Worker (Background)
  {
    ...baseConfig,
    input: 'src/background/index.js',
    output: {
      file: 'deploy/background.js',
      format: 'es',
      sourcemap: isDev,
    },
  },
];