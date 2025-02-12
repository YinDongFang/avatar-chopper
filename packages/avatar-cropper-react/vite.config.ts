import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";
import dts from "vite-plugin-dts";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    dts({
      root: __dirname,
      include: ["src/AvatarCropper.tsx"],
      afterBuild: () => {
        const currentDirName = path.basename(__dirname);
        const srcPath = path.resolve(
          __dirname,
          `dist/${currentDirName}/src/AvatarCropper.d.ts`
        );
        const destPath = path.resolve(__dirname, "dist/index.d.ts");
        // 检查文件是否存在，然后移动文件
        if (fs.existsSync(srcPath)) fs.renameSync(srcPath, destPath);
        fs.rm(
          path.resolve(__dirname, `dist/${currentDirName}`),
          {
            recursive: true,
            force: true,
          },
          () => {}
        );
      },
    }),
  ],
  server: {
    port: 3001,
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/AvatarCropper.tsx"),
      fileName: "index",
      formats: ["es"], // 仅支持 ESM 格式
    },
    rollupOptions: {
      // 确保外部化处理那些你不想打包进库的依赖
      external: ["react", "react-dom", "react/jsx-runtime"],
    },
  },
});
