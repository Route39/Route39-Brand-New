const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');
const webpack = require('webpack');

module.exports = {
  output: {
    path: join(__dirname, 'dist'),
  },

  resolve: {
    alias: {
      '@ridy/database': join(__dirname, '../../libs/database/src/index.ts'),
    }
  },

  plugins: [
    new webpack.IgnorePlugin({
      resourceRegExp: /\.node$/,
    }),
    
    // Nx App Plugin
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'swc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      optimization: false,
      skipTypeChecking: true,
      outputHashing: 'none',
      generatePackageJson: true,
      sourceMap: true,
      watch: false,
      externalDependencies: 'none', // Set to none so Nx empties the externals array
    }),

    // Custom Plugin to inject our bulletproof externals AFTER NxAppWebpackPlugin
    // NxAppWebpackPlugin modifies compiler.options.externals during its apply() phase,
    // destroying anything we define in the top-level config.
    // By putting this plugin after Nx, we can safely overwrite compiler.options.externals.
    {
      apply(compiler) {
        compiler.options.externals = [
          function ({ request, context }, callback) {
            // 1. FORCE BUNDLE local workspace libraries
            if (
              request === '@ridy/database' || 
              request.startsWith('@ridy/database/') ||
              request.includes('/libs/database/') ||
              request.includes('\\libs\\database\\')
            ) {
              return callback(); // Bundle it
            }

            // 2. Intercept absolute paths pointing inside node_modules
            if (request.includes('/node_modules/') || request.includes('\\node_modules\\')) {
              const parts = request.split(/node_modules[\\/]/);
              let packagePath = parts[parts.length - 1]; 
              packagePath = packagePath.replace(/\\/g, '/');
              return callback(null, 'commonjs ' + packagePath);
            }

            // 3. Standard bare modules
            if (!request.startsWith('.') && !request.startsWith('/') && !/^[A-Za-z]:[\\/]/.test(request)) {
              return callback(null, 'commonjs ' + request);
            }

            // 4. Otherwise, it's local source code
            callback();
          }
        ];
      }
    }
  ],
};
