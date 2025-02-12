import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/AvatarCropper.tsx"),
      name: "AvatarCropper",
      fileName: "avatar-cropper",
      formats: ["es"], // 仅支持 ESM 格式
    },
    rollupOptions: {
      // 确保外部化处理那些你不想打包进库的依赖
      external: ["react", "react-dom", "react/jsx-runtime"],
    },
  },
});
