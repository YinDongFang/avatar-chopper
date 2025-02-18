import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";

export default {
  input: "src/index.ts",
  output: [
    {
      file: "dist/index.esm.js",
      format: "esm",
    },
    {
      file: "dist/index.cjs.js",
      format: "cjs",
    },
    {
      file: "dist/index.umd.js",
      format: "umd",
      name: "AvatarCropper",
    },
  ],
  plugins: [resolve(), commonjs(), typescript()],
};
