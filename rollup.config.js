import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import dev from 'rollup-plugin-dev';

const OUTPUT_DIR = './demo/dist';

export default {
    output: [
        {
            format: 'esm',
            dir: OUTPUT_DIR,
            externalLiveBindings: false,
        },
    ],
    external: [],
    plugins: [
        typescript({
            tsconfig: './tsconfig.json',
            compilerOptions: {
                outDir: OUTPUT_DIR,
                target: 'es6',
                strict: false,
            },
            allowSyntheticDefaultImports: true,
            exclude: ['**/*.test-d.ts', '**/*.test.js', '**/*.spec.ts', '**/*.spec.js']
        }),
        resolve(),
        commonjs(),
        replace({
            preventAssignment: true,
        }),
        dev({
            dirs: ['demo'],
            host: 'localhost',
            port: 8000,
        }),
    ],
};
