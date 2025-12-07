import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Esto le dice a Vite: "Si ves un .onnx o .data, no los toques, son archivos"
  assetsInclude: ['**/*.onnx', '**/*.data'],
})
