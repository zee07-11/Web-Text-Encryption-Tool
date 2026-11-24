const assert=require('node:assert/strict');
const fs=require('node:fs');
const {createServer}=require('./server.cjs');
(async()=>{
 const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}`;
 let tests=[];
 async function test(name,fn){await fn();tests.push({name,result:'PASS'});console.log('PASS',name);}
 async function post(data,headers={}){return fetch(base+'/api/transform',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(data)});}
 try{
  await test('Server serves backend enabled interface',async()=>assert.match(await(await fetch(base)).text(),/data-backend="node"/));
  await test('Backend Caesar result',async()=>assert.equal((await(await post({text:'Attack at dawn!',method:'caesar',mode:'encrypt',shift:3})).json()).result,'Dwwdfn dw gdzq!'));
  await test('Backend Vigenere result',async()=>assert.equal((await(await post({text:'ATTACKATDAWN',method:'vigenere',mode:'encrypt',keyword:'LEMON'})).json()).result,'LXFOPVEFRNHR'));
  await test('Backend hash result',async()=>assert.equal((await(await post({text:'abc',method:'sha256',mode:'encrypt'})).json()).result,'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'));
  await test('Backend AES round trip',async()=>{const args={text:'Hello backend!',method:'aes',mode:'encrypt',password:'Demo password 062!'};const encrypted=(await(await post(args)).json()).result;assert.equal((await(await post({...args,text:encrypted,mode:'decrypt'})).json()).result,args.text);});
  await test('Backend rejects empty text and missing method',async()=>{assert.equal((await post({text:' ',method:'caesar',mode:'encrypt',shift:3})).status,400);assert.equal((await post({text:'Hi',mode:'encrypt'})).status,400);});
  await test('Backend rejects cross origin browser requests',async()=>assert.equal((await post({text:'Hi',method:'caesar',mode:'encrypt',shift:3},{Origin:'https://example.com'})).status,403));
  await test('Backend exposes no arbitrary file routes',async()=>assert.equal((await fetch(base+'/server.cjs')).status,404));
  fs.writeFileSync('backend-test-results.json',JSON.stringify({total:tests.length,tests},null,2));console.log(`${tests.length} backend checks passed.`);
 }finally{await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
