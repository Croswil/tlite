#!/usr/bin/env node
import e from"readline";import t from"path";import a from"fs";import r from"os";import{execSync as i,spawnSync as s}from"child_process";import{init as n,database as o}from"liburno_lib";const{Reset:l,Bold:c,Reverse:$,Red:p,Green:f,Yellow:u,Blue:d,Magenta:h,Cyan:m,White:b}=n(),v=`------------------------------------------------------\n${m}${c}tlite${l}: Utility per sqlite       ${b}(c) Croswil  v. ${u}${c}1.2.37${l}\n------------------------------------------------------`;var y=e=>{"darwin"==process.platform?s("pbcopy",{input:e}):s("xsel",["--clipboard","--input"],{input:e})};function w(){var e="/etc/nginx/sites-available";if(a.existsSync(e)){var r=a.readdirSync(e);for(var i of r)if(i.length>0&&"default"!=i){var s=a.readFileSync(t.join(e,i)).toString(),n=/server_name\s*(.*);/gim.exec(s),o=[];if(n)for(;;){var $=/localhost:(\d+)/gim.exec(s);if(!$)break;o.push($[1]),s=s.slice($.index+8)}F.write(`${c}${n[1]}:${l} ${f}${o.join(" ")}${l}\n`)}}else F.write(`Folder: ${f}"${e}" ${l} not found!\n`);process.exit(0)}var g=null,S="",x=!1,j=!1,k=!1,q=(e=!1)=>{if(S)try{return g||(g=o.db(S)),!0}catch(e){}else g=null,e||F.write(`${p}..missing db..${l}\n`);return!1};function O(e){Array.isArray(e)&&(e=e.join(" "));var i,s=t.parse(S);return s&&s.dir?((i=N.outdir?N.outdir:t.join(s?.dir,"out")).startsWith("~")&&(i=t.resolve(r.homedir(),i.slice(2))),a.existsSync(i)||a.mkdirSync(i,!0),e?t.join(i,e):t.join(i,s.name+"_db")):e||"out"}var F=process.stdout;const _=e.createInterface({input:process.stdin,output:F,prompt:"TL> "});var N={data:[],short:!0,outdir:"",history:[]},J=".lasts.tlite";if(a.existsSync(J)){var A=JSON.parse(a.readFileSync(J));A&&A.data&&Array.isArray(A.data)&&(N=A)}var L=(e,t,a)=>{var r=[];(i=/(\[[^\]]*\])/gim.exec(t))&&(t=t.substr(0,i.index),r=JSON.parse(i[1])),t.startsWith("e ")&&(t="explain query plan "+t.substr(2)),t.indexOf(" limit")<1&&(t+=" limit 20");var i=e.prepare(t).all(...r);if(a&&i?.length>0){var s=[];for(var n of i){var o=[];for(var c in n)o.push(n[c]);s.push(o.join("\t"))}y(s.join("\n"))}var $=[],u=[];if(!(i&&i.length>0))return!0;for(var n in i[0])$.push(n);let h=N.colonne?"|":",";if(N.colonne){var m=(e,t)=>(e||(e=""),"string"!=typeof e&&(e+=""),e.length>t?e.substr(0,t):e.padEnd(t));let e=[],t=[];for(var b=0;b<$.length;b++)for(var n of(e[b]=$[b].length,i)){let t=n[$[b]]+"";t?.length>e[b]&&(e[b]=t.length)}for(b=0;b<$.length;b++)e[b]>N.colonne&&(e[b]=N.colonne);for(b=0;b<$.length;b++)for(var n of(t[b]=m($[b],e[b]),i))n[$[b]]=m(n[$[b]],e[b]);process.stdout.write(`${d}${t.join(h)}${l}\n`)}else process.stdout.write(`${f}${$.join(h)}${l}\n`);for(var n of i){for(var v of(u=[],$)){var w=n[v];N.short&&"string"==typeof w&&w.length>20&&(w.startsWith("{")||w.startsWith("["))&&(w=`${p}JSON${l}`),u.push(w)}process.stdout.write(`${u.join(h)}\n`)}return!1},z=()=>{var e=g.databases();for(var t of e)F.write(`${u}${t.name}: ${c}${t.file}${l}\n`)},E=(e,t,a)=>{if(I=!1,e.length>1&&"!"==e[e.length-1]&&(e=e.substr(0,e.length-1)),q())try{if(t){var r=o.splitsql(e),i=[];for(var s of r){var n=g.tabledef(s,!0);n&&(process.stdout.write(n+"\n"),i.push(n),g.run(n))}y(i.join("\n"))}else{var c;if((c=/^\s*(select|insert|delete|update|e)\s+/i.test(e)?[e]:o.splitsql(e)).length>1||c[0].includes("\n")){for(var $=0;$<c.length;$++)c[$]=c[$].split("\n").filter((e=>e.trim())).join("\n");y(["!",...c,"!"].join("\n"))}else y(c.join("\n"));for(var f of c){if(f=f.trim(),/^\s*(select|e)\s+/i.test(f))return L(g,f,a);if(f.trim()){var u=[];(r=/(\[[^\]]*\])/gim.exec(f))&&(f=f.substr(0,r.index),u=JSON.parse(r[1])),g.run(f,...u)}}}}catch(e){process.stdout.write(`${p}${e}${l}\n`)}},I=!1,W="",D=async e=>{if(k)e=parseInt(e),k=!1,e>0&&e<=N.data.length&&await D(`use ${N.data[e-1]}`);else if(x)("!"==(W+="\n"+e)[W.length-1]||";"==W[W.length-1]&&0==I)&&(E(W,j),j=!1,W="",x=!1);else{e||(e="");var n=e.split(" "),$=n.splice(0,1);$=$&&$[0]?$[0].toLowerCase():"";var d=n.join(" ");d||(d="");var h=$.split(";")[0];switch(h.startsWith(".")&&($=h.substr(1),h="."),h){case"q":case"quit":G();case"h":case"help":case"?":F.write(`${l}Help comandi ${c}Tlite${l}:\n${c}h, help,?${l}Documentazione delle funzioni di sistema\n${c}use[file]          ${l}Mostra / Imposta il database in uso\n${c}close, chiudi      ${l}Chiudi il database corrente\n${c}last, db, lastdb   ${l}Mostra l'elenco degli ultimi db utilizzati\n${c}colonne <larg>     ${l}Incolonna output select con colonne di max <larg>\n${c}jshort[2, 1, 0]    ${l}Imposta la visualizzazione record json( 1 = full, 0 no)\n${c}outdir <folder>    ${l}Imposta la cartella di output per esportazioni(.per default )\n${c}schema[d][table]   ${l}Mostra sql con la creazione del database / Tabella\n${c}attach <file> <nn> ${l}Collega un database, con il nome <nn>, o  mostra l'elenco dei db. collegati\n${c}detach <nn>        ${l}Scollega il database collegato\n${c}tables/tabelle     ${l}Mostra le tabelle di un DB\n${c}fields <table>     ${l}Mostra i campi di una tabella (usare anche campi <table>)\n${c}yaml <table>       ${l}Mostra struttura database/tabella in formato YAML\n${c}xexp <file> [table]${l}Esporta in formato XLSX una tabella,query o l'intero database (non inserire suffisso)\n${c}exp <file> [table] ${l}Esporta in formato json una tabella,query o l'intero database\n${c}csvexp     [table] ${l}Esporta in formato CSV una tabella,query\n${c}expfull...         ${l}Come exp, solo per le tabelle esporta anche la struttura\n${c}md/md5 <pass>      ${l}Restituisce formato md5 (password o altri testi)\n${c}ximp <file>        ${l}Importa il file dati nel formato XLSX (esportato con xexp)\n${c}imp <file>         ${l}Importa il file dati nel formato JSON (exportato con exp)\nAttenzione: La tabella di import deve esistere e i dati vengono completamente sovrascritti\n${c}! <comando...> ;   ${l}esegue il comando SQL senza risultato (chiudere con ${c}!${l})\n${c}!c <comando...> ;  ${l}esegue il comando SQL per creare una tabella (chiudere con ${c}!${l})\n${c}i <table>          ${l}Genera il comando SQL per l'insert sulla tabella\n${c}d <table>          ${l}Genera il comando SQL per il delete sulla tabella\n${c}s,so <table>       ${l}Genera il comando SQL per il select sulla tabella (so=order)\n${c}e <sql>            ${l}Explain Query\n${c}u <table>          ${l}Genera il comando SQL per l'update sulla tabella\n${c}v <table> [cerca]  ${l}Genera il comando SQL per la ricerca FTS5. se impostato cerca torna anche i dati\n${c}.<table>           ${l}Mostra il contenuto della tabella\n${c}!!                 ${l}Apre nano con la clipboard\n${c}q,quit             ${l}Esci\n`);break;case"getip":w();break;case"use":if(d=d.replaceAll(";","")){q(!0)&&g.close(),g=null;try{g=o.db(d),(e=>{for(var t=0;t<N.data.length;t++)if(N.data[t]==e){if(t>0){var r=N.data.splice(t,1);N.data.unshift(r[0]),N.history=[..._.history],_.history.length>50&&(_.history.length=50),a.writeFileSync(J,JSON.stringify(N,null,2))}return}N.data.unshift(e),N.data.length>9&&N.data.pop(),a.writeFileSync(J,JSON.stringify(N,null,2))})(S=d)}catch(se){F.write(`${p}${se}${l}\n`),g=null}}S?F.write(`Database: ${c}${f}${S}${l}\n`):F.write(`No Database in use...${l}\n`);break;case"!!":let re=t.join(r.tmpdir(),".tlite_tmp");var m=(()=>{let e;return e="darwin"==process.platform?s("pbpaste").stdout.toString():s("xsel",["--clipboard","--output"]).stdout.toString(),e})().replaceAll(/^\s*\!\s*\n?/gim,"").replaceAll(/\!\s*$/gim,"");a.writeFileSync(re,m),i(`nano ${re}`,{stdio:"inherit"});let ie=a.readFileSync(re,"utf-8");a.unlinkSync(re),E(ie,/^\s*c\s+\w/gim.test(ie)),W=!1;break;case"md":case"md5":var b=(d=d.replaceAll(";","").trim()).md5();y(`${b||""}`),F.write(`${b||""}\n`);break;case"close":case"chiudi":q()&&(F.write(`closed: ${c}${g.name}${l}\n`),g.close()),g=null;break;case"last":case"db":case"dbs":case"lastdb":if(N.data.length){F.write(`${u}Last used db:${l}\n`);for(var v=0;v<N.data.length;v++)F.write(`${v+1}. ${c}${N.data[v]}${l}\n`);k=!0}break;case"jshort":N.short=parseInt(d)?1:0,a.writeFileSync(J,JSON.stringify(N,null,2));break;case"colonne":N.colonne=parseInt(d)||0,a.writeFileSync(J,JSON.stringify(N,null,2));break;case"outdir":d&&(N.outdir="."==d?"":d,a.writeFileSync(J,JSON.stringify(N,null,2))),F.write(`${f}OutDir: ${c}${N.outdir}${l}\n`);break;case"attach":if(q())try{if(d=d.replaceAll(";",""))(T=d.split(" "))[0]&&g.attach(T[0],T[1])?z():F.write(`${p}Errore collegamento: file non trovato${l}\n`);else z()}catch(ne){F.write(`${p}${ne}${l}\n`)}break;case"detach":if(q())try{d=d.replaceAll(";",""),g.detach(d),z()}catch(oe){F.write(`${p}${oe}${l}\n`)}break;case"tabelle":case"tables":if(q())try{var A=g.tabelle();for(var b of(F.write(`${u}Tables: ${c}${g.name}${l}\n`),A)){var M=g.get(`select count(rowid) tot from ${b}`).tot;F.write(`${b} => ${M||0} \n`)}}catch(le){F.write(`${p}${le}${l}\n`)}break;case"campi":case"fields":if(q())try{d=d.replaceAll(";","");A=g.campi(d,"fields"==h);d&&F.write(`${u}Table: ${c}${g.name}.${d}${l}\n`),F.write(JSON.stringify(A,null,2)),F.write("\n")}catch(ce){F.write(`${p}${ce}${l}\n`)}break;case"schema":case"schemad":if(q())try{b=g.schema(d,"schemad"===h);y(`${b} \n`),F.write(`${b}\n`)}catch($e){F.write(`${p}${$e}${l}\n`)}break;case"yaml":if(q())try{d=d.replaceAll(";","");if(d)T=[d];else var T=g.tabelle();var Q=["#!db"];for(var C of T){Q.push(`\n${C}:`);var R=g.campi(C,!0),X=[];for(var M in R){var B=R[M];B.pr&&X.push(M),Q.push(`  ${M}: ${B.t||"v"}`)}X.length&&Q.push(`  __pk: ${X.join(",")}`);A=g.all(`select sql from  sqlite_master  where sql>'' and Lower(tbl_name)='${C}' and type='index' order by name`),v=0;for(var b of A){(ae=/\son\s(\w+)\s\((.*?)\)/gim.exec(b.sql))?(Q.push(`  __i${v}: ${ae[2]}`),v++):console.log(b.sql)}}var P=Q.join("\n");y(`${P} \n`),F.write(`${P}\n`)}catch(pe){F.write(`${p}${pe}${l}\n`)}break;case"xexp":if(q())try{var Y=O(Z=n[0]);n.length>1&&(n.splice(0,1),d=n.join(" ")),!async function(e,t,a){const r=await import("xlsx"),i=r.utils.json_to_sheet(e),s=r.utils.book_new();r.utils.book_append_sheet(s,i,t),r.writeFile(s,`${a}.xlsx`,{compression:!0})}(H=g.export(d,!1),Z,Y),F.write(`write: ${c}${Y}.xlsx${l}\n`)}catch(fe){F.write(`${p}${fe}${l}\n`)}break;case"exp":case"expfull":if(q())try{Y=O(n[0])+".json";n.length>1&&(n.splice(0,1),d=n.join(" "));var H=g.export(d,"expfull"===$);if(d)for(var b of H)for(var U in b){"string"==typeof(ee=b[U])&&(ee.startsWith("{")||ee.startsWith("["))&&(ee.endsWith("}")||ee.endsWith("]"))&&(b[U]=JSON.parse(ee))}a.existsSync(Y)&&a.unlinkSync(Y),a.writeFileSync(Y,JSON.stringify(H,null,2)),F.write(`write: ${c}${Y}${l}\n`)}catch(ue){F.write(`${p}${ue}${l}\n`)}break;case"csvexp":if(q())try{function de(e){return"number"==typeof e&&(e=""+e),(e.includes("\t")||e.includes("\n")||e.includes('"'))&&(e=`"${e.replace(/"/g,'""')}"`),e}Y=O(Z=n[0])+".csv";var V=!1;if(n.length>1&&(n.splice(0,1),d=n.join(" "),V=!0),d){Q=[];var K=[];if(V){H=g.export(d);for(var b of H){if(V){for(var U in Q=[],b)Q.push(U);V=!1,K.push(Q.join("\t"))}for(var U in Q=[],b)Q.push(de(b[U]||""));K.push(Q.join("\t"))}}else{var H=g.export(d,!0);for(var U in H.flds)Q.push(U);for(var b of(K.push(Q.join("\t")),H.data)){for(var U in Q=[],H.flds)Q.push(de(b[U]||""));K.push(Q.join("\t"))}}a.existsSync(Y)&&a.unlinkSync(Y),a.writeFileSync(Y,K.join("\n")),F.write(`write: ${c}${Y}${l}\n`)}else F.write("must specify a table\n")}catch(he){F.write(`${p}${he}${l}\n`)}break;case"imp":if(q())try{var Z;Y=O(Z=n[0])+".json";if(a.existsSync(Y)){H=JSON.parse(a.readFileSync(Y));if(d)for(var b of H)for(var U in b){var ee;(ee=b[U])&&"object"==typeof ee&&(b[U]=JSON.stringify(ee))}g.esisteTabella("sqlite_sequence")&&g.run("update sqlite_sequence set seq=0 where name=?",d),console.log("r0",d),g.import(d,H),F.write(`read: ${c}${Y}${l}\n`)}else F.write(`${p}File non Trovato: ${Y}${l}\n`)}catch(me){F.write(`${p}${me}${l}\n`)}break;case"ximp":if(q())try{if(d){Y=O(d)+".xlsx";if(a.existsSync(Y)){H=await xlsimport(Y,d);g.import(d,H)}}}catch(be){F.write(`${p}${be}${l}\n`)}break;case"!":case"!c":d.length>1&&(";"==d[d.length-1]||"!"==d[d.length-1])?E(d,"!c"==$):(j="!c"==$,I=!0,x=!0,W=d);break;case"c":E(d,!0);break;case"select":case"insert":case"update":case"pragma":case"delete":case"drop":case"alter":case"create":case"vacuum":case"e":E($+" "+d,!1);break;case"clip":E("select "+d,!1,!0);break;case"i":case"d":case"s":case"so":case"u":case"v":if(d&&q())try{switch($){case"d":b=g.strdelete(d);break;case"i":b=g.strinsert(d);break;case"u":b=g.strupdate(d);break;case"so":b=g.strselect(d,!0);break;case"v":d=n.splice(0,1)[0];var te=n.join(" ");b=g.strvirtual(d,te),te&&L(g,b);break;default:b=g.strselect(d)}y(`${b||""}`),F.write(`${b||""}\n`)}catch(ve){F.write(`${p}${ve}${l}\n`)}break;case".":if(q())try{if(!g.esisteTabella($))throw new Error(`missing table ${$}`);if(b=g.strselect($,!0),d&&(b=b.split("order by")[0]+" "+d),E(b,!1)){var ae=g.campi($);process.stdout.write(`${f}rowid,${ae}${l}\n`)}}catch(ye){F.write(`${p}${ye}${l}\n`)}break;case"":case void 0:break;default:F.write(`${p}comando sconosciuto: ${c}${e}${l}\n`)}}},M=process.argv[2];if(M&&/^\s*(ip|getip)\s*$/gim.test(M))w();else if(M&&"backup"==M){!function(e,r){if(e&&a.existsSync(e)){var i=t.parse(e),s=t.join(i.dir,`db_${i.name}`);i.outfile=s,function(e){if(a.existsSync(e)){const r=a.readdirSync(e);for(const i of r){const r=t.join(e,i);a.unlinkSync(r)}}else a.mkdirSync(e)}(i.outfile);var n=(new Date).valueOf();S=e;var l=(g=o.db(e)).schema();a.writeFileSync(t.join(i.outfile,"schema.sql"),l);var c=g.tabelle();if(r){for(var $ of c)if("sqlite_sequence"!=$){var p=`select rowid rowid,${(f=g.campi($)).join(",")} from ${$}`;a.writeFileSync(t.join(i.outfile,`${$}.json`),JSON.stringify(g.all(p),null,1))}}else for(var $ of c)if("sqlite_sequence"!=$){var f=g.campi($),u=[],d=["rowid rowid",...f];const e=`select ${d.join(",")} from ${$}`;d[0]="rowid",u.push(d);var h=g.all(e);for(var m of h){var b=d.reduce(((e,t)=>(e.push(m[t]),e)),[]);u.push(b)}a.writeFileSync(t.join(i.outfile,`${$}.json`),JSON.stringify(u,null,1))}n=(new Date).valueOf()-n,console.log("tempo ms:",n),g.chiudi()}else process.stdout.write("manca il nome del database\n");process.exit(0)}(process.argv[3],process.argv[4]?1:0)}else if(M&&"restore"==M){!function(e){var r=t.parse(e),i=t.join(r.dir,"db_"+r.name);if(a.existsSync(t.join(i,"schema.sql"))){var s=(new Date).valueOf();S=t.join(r.dir,r.name+".db"),a.existsSync(S)&&a.unlinkSync(S),(g=o.db(S)).begin();var n=a.readFileSync(t.join(i,"schema.sql")).toString();g.run(n);var l=g.tabelle();for(var c of l)if(e=t.join(i,c+".json"),a.existsSync(e)){var $=JSON.parse(a.readFileSync(e));if($&&$[0])if(Array.isArray($[0])){var p=$[0],f=[];p.forEach((e=>f.push("?"))),n=`insert into ${c} (${p.join(",")}) values (${f.join(",")}) `;for(var u=g.prepare(n),d=1;d<$.length;d++)u.run(...$[d])}else for(var h of(p=g.campi(c),f=[],p.unshift("rowid"),p.forEach((e=>f.push("?"))),n=`insert into ${c} (${p.join(",")}) values (${f.join(",")}) `,u=g.prepare(n),$)){var m=p.reduce(((e,t)=>(e.push(h[t]),e)),[]);u.run(...m)}}g.commit(),g.chiudi(),s=(new Date).valueOf()-s,console.log("restore tempo ms:",s)}else console.log("manca la cartella di ripristino:",i);process.exit(0)}(process.argv[3])}else!M||a.existsSync(M)?(console.log(v),M&&a.existsSync(M)?await D(`use ${M}`):await D("db")):(console.log(`${v}\nuso: \n    ${f}tlite ip  #mostra gli indirizzi ip dei server nginx attivi\n    tlite backup <nomedatabase> [fileout]\n    tlite restore <nomedatabase no path> [filedatabase]${l}\n    `),process.exit(0));let T=[],Q=[];function C(){T=[],Q=[],k?_.setPrompt("[0..9] >"):x?_.setPrompt(""):_.setPrompt("tl> "),_.prompt()}function G(){q()&&g.close(),N.history=[...new Set(_.history.filter((e=>e.trim().length>2)))],_.history.length>50&&(_.history.length=50),a.writeFileSync(J,JSON.stringify(N,null,2)),F.write("bye1..\n"),process.exit(0)}C(),N.history&&(_.history=[...N.history]),_.on("line",(e=>{for(var t of(e=(e||"").split("\n"),_.history.shift(),e)){var a=/\\\s*(\/\/.*|\s*)?$/i.exec(t);a?(Q.push(t),T.push(t.slice(0,a.index))):((t.trim()||T.length)&&(T.push(t.trim()),Q.push(t)),T.length&&(k||_.history.unshift(Q.join("\n")),D(T.join(" ")),C()))}})).on("close",(()=>G()));
