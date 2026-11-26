import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const mimes={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.glb':'model/gltf-binary','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp'};
const server=http.createServer(async(req,res)=>{
 try{
  let u=new URL(req.url,'http://127.0.0.1');
  const decoded=decodeURIComponent(u.pathname);
  const relative=decoded==='/'?'power-garage.html':decoded.replace(/^\/+/, '');
  const resolved=path.resolve(root,relative);
  if(!resolved.startsWith(root+path.sep)) {res.writeHead(403).end('Acesso negado');return;}
  const file=await stat(resolved);
  if(!file.isFile()){res.writeHead(404).end('Arquivo nao encontrado');return;}
  const buf=await readFile(resolved);
  res.writeHead(200,{'Content-Type':mimes[path.extname(resolved)]||'application/octet-stream','Content-Length':buf.length,'Cache-Control':'no-cache'});
  res.end(buf);
 }catch(err){res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'}).end('Arquivo nao encontrado');}
});
server.listen(8787,'127.0.0.1',()=>console.log('Power Garage V1 no navegador: http://127.0.0.1:8787/power-garage.html'));
