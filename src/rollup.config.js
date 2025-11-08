import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import replace from '@rollup/plugin-replace';

const isDev = process.env.NODE_ENV === 'development';

const createPlugins = () => [
  resolve(),
  replace({
    preventAssignment: true,
    'process.env.NODE_ENV': JSON.stringify(isDev ? 'development' : 'production'),
  }),
  ...(isDev ? [] : [terser()]),
];

export default [
  // Bundle 1: Content Script
  {
    input: 'src/content/index.js',
    output: {
      file: 'deploy/content.js',
      format: 'es',
      sourcemap: isDev,
    },
    plugins: createPlugins(),
  },
  // Bundle 2: Popup UI
  {
    input: 'src/popup/index.js',
    output: {
      file: 'deploy/popup.js',
      format: 'es',
      sourcemap: isDev,
    },
    plugins: createPlugins(),
  },
  // Bundle 3: Settings Page
  {
    input: 'src/settings/index.js',
    output: {
      file: 'deploy/settings.js',
      format: 'es',
      sourcemap: isDev,
    },
    plugins: createPlugins(),
  },
  // Bundle 4: Service Worker (Background)
  {
    input: 'src/background/index.js',
    output: {
      file: 'deploy/background.js',
      format: 'es',
      sourcemap: isDev,
    },
    plugins: createPlugins(),
  },
];
