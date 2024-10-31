/**
 * Base webpack config used across other specific configs
 */

import webpack from 'webpack';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import webpackPaths from './webpack.paths';
import { dependencies as externals } from '../../release/app/package.json';

const configuration: webpack.Configuration = {
  externals: [...Object.keys(externals || {})],

  stats: 'errors-only',

  module: {
    rules: [
        
      {
        test: /\.bnf$/, // To handle .bnf files (if needed)
        use: 'raw-loader', // or 'file-loader' based on your earlier requirement
      },
      {
        test: /\.js\.map$/, // To handle all .map files
        use: 'ignore-loader',
      },
      {
        test: /\.bnf$/,
        use: 'raw-loader' // or 'file-loader'
      },
      {
        test: /LICENSE$/,
        use: 'ignore-loader',
      },
      {
        test: /README\.md$/,
        use: 'ignore-loader',
      },
      {
        test: /\.d\.ts$/,
        use: 'ignore-loader',
      },
  {
      test: /\.json$/,
      type: 'javascript/auto',
      use: {
        loader: 'json-loader', // Use 'json-loader' if required for older setups
      },
      exclude: /node_modules/, // Exclude node_modules
    },
    {
      test: /\.json5$/,
      exclude: /node_modules/,
      loader: 'json5-loader',
      type: 'javascript/auto',
    },
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            // Disable type checking to speed up compilation
            transpileOnly: true,
            compilerOptions: {
              module: 'esnext',
            },
          },
        },
      },
    ],
  },

  output: {
    path: webpackPaths.srcPath,
    library: {
      type: 'commonjs2',
    },
  },

  resolve: {
    extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
    modules: [webpackPaths.srcPath, 'node_modules'],
    plugins: [new TsconfigPathsPlugin()],
  },

  plugins: [
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'production',
    }),
  ],
};

export default configuration;
