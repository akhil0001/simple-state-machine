  import { resolve } from 'path'
  import { defineConfig } from 'vite'
  import dts from 'vite-plugin-dts'

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, 'lib/index.ts'),
            name: 'simpleStateMachineReact',
            fileName: 'simple-state-machine-react',
        },
        rollupOptions: {
            external: ['react'],
            output: {
                globals: {
                    react: 'React'
                }
            }
        }
    },
    // https://stackoverflow.com/questions/71982849/how-do-i-add-types-to-a-vite-library-build
    plugins: [dts({ rollupTypes: true })]
})