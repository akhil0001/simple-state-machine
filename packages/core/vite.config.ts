import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, 'lib/main.ts'),
            name: 'simple-state-machine',
            fileName: 'simple-state-machine'
        },
        rollupOptions: {

        }
    }
})