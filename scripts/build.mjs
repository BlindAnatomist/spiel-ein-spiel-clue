import {build} from 'esbuild';
import {mkdir,copyFile} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
await build({entryPoints:['app/main.ts'],outfile:'dist/app.js',bundle:true,format:'esm',target:['safari16','chrome110'],minify:true});
await copyFile('app/index.html','dist/index.html');
await copyFile('app/style.css','dist/style.css');
