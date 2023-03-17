import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import { defineConfig } from "rollup";
import replace from "@rollup/plugin-replace";

const config = defineConfig([
  {
    input: "src/cli.ts",
    output: {
      dir: "dist",
      format: "es",
      sourcemap: false,
    },
    plugins: [
      nodeResolve({
        exportConditions: ["node"],
        preferBuiltins: true,
      }),
      replace({
        preventAssignment: true,
        values: {
          "process.env.NODE_ENV": JSON.stringify("production"),
        },
      }),
      {
        name: "replace-code",
        transform(code, id) {
          if (!/nbind/.test(id)) return;
          code = code.replace(
            "_a = _typeModule(_typeModule),",
            "var _a = _typeModule(_typeModule);"
          );
          return {
            code,
            map: { mappings: "" },
          };
        },
      },
      json(),
      commonjs(),
      typescript(),
    ],
  },
]);
export default config;
