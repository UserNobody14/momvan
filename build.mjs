import dts from 'bun-plugin-dts'

await Bun.build({
  entrypoints: ['./index.ts', './formula.ts', './wrapperFn.ts', './router.ts'],
  outdir: './dist',
  minify: true,
  plugins: [dts()]
});