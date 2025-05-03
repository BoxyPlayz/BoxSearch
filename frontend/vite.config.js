import { resolve } from 'path'

export default {
  root: resolve(__dirname, 'src'),
  build: {
    outDir: '../../dist/web'
  },
  server: {
    port: 8080
  },
  preview: {
    port: 8080
  }
}