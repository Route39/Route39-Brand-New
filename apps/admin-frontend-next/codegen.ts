import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "../admin-panel/schema.graphql",
  documents: ["src/**/*.{ts,tsx}", "!src/lib/graphql/__generated__/**"],
  ignoreNoDocuments: true,
  generates: {
    "src/lib/graphql/__generated__/": {
      preset: "client",
      config: {
        useTypeImports: true,
        enumsAsTypes: true,
        skipTypename: true,
      },
    },
  },
};

export default config;
