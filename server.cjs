/* Optional local backend. No third party packages are needed. */
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const c = require('./dist/crypto.js');

async function transform({text, method, mode, shift, keyword, password}) {
  if (!['encrypt','decrypt'].includes(mode)) throw new Error('Choose encrypt or decrypt.');
  if (!['caesar','vigenere','aes','sha256'].includes(method)) throw new Error('Please select an encryption method.');
  c.requireText(text);
  if (method === 'caesar') return c.caesar(text,shift,mode === 'decrypt');
  if (method === 'vigenere') return c.vigenere(text,keyword || '',mode === 'decrypt');
  if (method === 'aes') return c[mode === 'decrypt' ? 'aesDecrypt' : 'aesEncrypt'](text,password);
  if (mode === 'decrypt') throw new Error('A hash cannot be decrypted.');
  return c.sha256(text);
}
function createServer() {
 return http.createServer(async (req,res) => {
  const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
  if(req.url === '/api/transform' && req.method === 'POST') {
   if(req.headers['content-type']?.split(';')[0] !== 'application/json') return json(415,{error:'Send JSON input.'});
   // Only the page served by this loopback server may make browser API requests.
   const origin=req.headers.origin;
   if(origin && !['http://'+req.headers.host].includes(origin)) return json(403,{error:'Origin not allowed.'});
   try {
    let chunks=[],size=0;
    for await(const chunk of req) {size+=chunk.length;if(size>2*1024*1024) return json(413,{error:'Input is too large.'});chunks.push(chunk);}
    const input=JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if(!input || typeof input !== 'object') throw new Error('Send a valid request.');
    return json(200,{result:await transform(input)});
   } catch(error) {return json(400,{error:error instanceof SyntaxError ? 'Send valid JSON.' : error.message || 'Invalid request.'});}
  }
  if(req.method !== 'GET') return json(405,{error:'Method not allowed.'});
  const files={'/':['index.html','text/html'],'/index.html':['index.html','text/html'],'/styles.css':['styles.css','text/css'],'/crypto.js':['crypto.js','application/javascript'],'/app.js':['app.js','application/javascript']};
  if(req.url === '/favicon.ico') {res.writeHead(204);return res.end();}
  const entry=files[req.url?.split('?')[0]];
  if(!entry) return json(404,{error:'Not found.'});
  try {
   let data=await fs.readFile(path.join(__dirname,'dist',entry[0]));
   if(entry[0] === 'index.html') data=Buffer.from(data.toString('utf8').replace('<html lang="en">','<html lang="en" data-backend="node">'));
   res.writeHead(200,{'Content-Type':entry[1]+'; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(data);
  } catch {json(500,{error:'Could not read the app files.'});}
 });
}
if(require.main === module) {
 const port=Number(process.env.PORT || 8000);
 const server=createServer();
 server.listen(port,'127.0.0.1',()=>console.log(`Text Encryption Lab: http://localhost:${port} (local Node backend)`));
 server.on('error',e=>{console.error('Cannot start server:',e.message);process.exitCode=1;});
}
module.exports={createServer,transform};
