// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import replace from '@rollup/plugin-replace';
import pkg from './package.json' assert { type: 'json' }
// Configurazione comune per entrambi i build
const generali = {
    preferBuiltins: false,
    output: {
        dir: 'bin',
        format: 'esm',
        name: 'parseenv',
        exports: 'named',
    },

}
const plugs = [
    replace({
        preventAssignment: true,
        'process.env.VERSION': JSON.stringify(pkg.version),
    }),
    commonjs(),
]
const parseenvBuild = {
    ...generali,
    input: 'src/cli-env.js',
    plugins: [
        ...plugs,
        terser()
    ]

};
const tliteBuild = {
    preferBuiltins: false,
    input: 'src/cli-tlite.js',
    output: {
        dir: 'bin',
        format: 'es',
        name: 'tlite',
        exports: 'named',
    },
    plugins: [
        ...plugs,
        terser({
            //keep_fnames: true,
            //keep_classnames: true,
            output: {
                //beautify: true,
                //braces: true,
            },
            mangle: {
                reserved: []
            }
        })
    ]
};
const unsplashBuild = {
    ...generali,
    input: 'src/unsplash.js',
    plugins: [
        ...plugs,
        terser()
    ]
};
const manifestBuild = {
    ...generali,
    input: 'src/manifest.js',
    plugins: [
        ...plugs,
        terser()
    ]
};


export default [parseenvBuild, tliteBuild, unsplashBuild, manifestBuild];
