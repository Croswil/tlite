#!/usr/bin/env node
import e from"fs";import a from"sharp";import i from"minimist";import{exec as o}from"child_process";const n="[0m",r="[1m",t="[32m",s="[36m",l=`-------------------------------------------------------------\n${s}${r}tlite-unsplash${n} : getimage from unsplash (c) Croswil 2024 [33m1.2.34${n}\n-------------------------------------------------------------\nFa una query sul sito e ricava n. imagini che passa alla cartella <out>, in formato JPEG e JSON\nes: ${s}tlite-unsplash <query> -s 1000 -o images -n 10${n}  \n${t}Opzioni:${n}\n-o, --output <path>        ${t}Output folder: se non esiste viene creato, se non definito utilizza tmp${n}\n-n, --numero <immagini>    ${t}numero immagini da scaricare: (default = 1)${n}\n-p, --pagina <pagina>      ${t}serve per cercare una immagine successiva alle più visualizzate${n}\n-l, --latest               ${t}ordina la selezione dalle ultime caricate${n}\n-c, --colore               ${t}colori: black_and_white, black, white, yellow, orange, red, purple, magenta, green, teal, and blue${n}\n-x, --orizzontale\n-y, --verticale\n-q, --quadrato\n-s, --size <int>           ${t}dimensione larghezza immagine in pixel ${n}\n`;function c(e){return new Promise(((a,i)=>{o(e,((e,o,n)=>{e?i(e):a(o)}))}))}var u=i(process.argv);(u._.length<2||u.h||u.help)&&(console.log(l),process.exit(0));var m=u;!async function(){var i=m.o||m.output||`${(u._[2]+"").replace(/[\.\\\/\s]/gi,"-")}`||"out",o=i.split("/").pop();if(e.existsSync(i))console.log("cambia il percorso di output o cancella i dati!");else{var t=encodeURIComponent(u._[2]);if(t){var s=[],l=`https://api.unsplash.com/search/photos?query=${t}&page=${m.pagina||m.p||1}&per_page=${m.numero||m.n||1}&order_by=${m.latest?"latest":"relevant"}`;(m.color||m.c)&&(l=`${l}&color=${m.color||m.c}`),m.orizzontale||m.x?l=`${l}&orientation=landscape`:m.verticale||m.y?l=`${l}&orientation=portrait`:(m.quadrato||m.q)&&(l=`${l}&orientation=squarish`),console.log(l);var p=await c(`\n                curl -H "Authorization: Client-ID I-u34HEOfOSp5jXxrnMnTQv26NRtxGNB_4MVvHkkmrs" "${l}"\n            `),$=JSON.parse(p);for(var g of $.results)s.push({id:g.id,datacrea:g.created_at,img:g.urls.full,categories:g.categories,likes:g.likes,username:g.username,nome:g.user.first_name,cognome:g.user.last_name,bio:g.user.bio,location:g.user.location});await c(`rm -rdf ${i}; mkdir ${i};mkdir ${i}/json ;mkdir ${i}/img; `);var d=0;for(var g of s){var f=o+"_"+("00000"+ ++d).slice(-4);console.log(f,g.img),e.writeFileSync(`${i}/json/${f}.json`,JSON.stringify(g,null,2)),m.size||m.s?(await c(`curl -H "Authorization: Client-ID I-u34HEOfOSp5jXxrnMnTQv26NRtxGNB_4MVvHkkmrs" "${g.img}" >out.jpeg`),await a("out.jpeg").resize(parseInt(m.size||m.s)||100).toFile(`${i}/img/${f}.jpeg`),e.unlinkSync("out.jpeg")):await c(`curl -H "Authorization: Client-ID I-u34HEOfOSp5jXxrnMnTQv26NRtxGNB_4MVvHkkmrs" "${g.img}" >${i}/img/${f}.jpeg`)}}else console.log(`[31m${r}Manca la query...${n}`)}}();
