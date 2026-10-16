// Local test server only; deployed preview uses static HTTPS hosting.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css'};
createServer(async(req,res)=>{
 const path=new URL(req.url,'http://localhost').pathname;
 const allowed={'/':'index.html','/index.html':'index.html','/app.js':'app.js','/style.css':'style.css'};
 if(!allowed[path]){res.writeHead(404).end();return;}
 try{const f=allowed[path];res.setHeader('Content-Type',types[f.slice(f.lastIndexOf('.'))]);res.end(await readFile('dist/'+f));}catch{res.writeHead(404).end();}
}).listen(Number(process.env.PORT??4173),'127.0.0.1');
