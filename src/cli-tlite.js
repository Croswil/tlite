#!/usr/bin/env node

import readline from 'readline';
import path from 'path'
import fs from 'fs';
import os from 'os';

import { spawnSync, execSync } from 'child_process';
import { database, init } from 'liburno_lib';
import { xlsexport } from './xlsdb.js'
const { Reset, Bold, Reverse, Red, Green, Yellow, Blue, Magenta, Cyan, White } = init();



const DATEVERSION = `------------------------------------------------------
${Cyan}${Bold}tlite${Reset}: Utility per sqlite       ${White}(c) Croswil  v. ${Yellow}${Bold}${process.env.VERSION}${Reset}
------------------------------------------------------`;
function dobackup(ff, mode) {
    if (!ff || !fs.existsSync(ff)) {
        process.stdout.write(`manca il nome del database\n`);
    } else {
        var pc = path.parse(ff);

        var outfile = path.join(pc.dir, `db_${pc.name}`);

        pc.outfile = outfile;
        checkcartellabackup(pc.outfile);
        var d1 = new Date().valueOf();
        dbname = ff;
        db = database.db(ff);
        var schema = db.schema()
        fs.writeFileSync(path.join(pc.outfile, `schema.sql`), schema);
        var tabelle = db.tabelle();
        if (mode) {
            for (var rr of tabelle) {
                if (rr != 'sqlite_sequence') {
                    var xx = db.campi(rr);
                    var sql = `select rowid rowid,${xx.join(',')} from ${rr}`;
                    fs.writeFileSync(path.join(pc.outfile, `${rr}.json`), JSON.stringify(db.all(sql), null, 1));
                }
            }
        } else {
            for (var rr of tabelle) {
                if (rr != 'sqlite_sequence') {
                    var xx = db.campi(rr);
                    var out = []
                    var campi = ['rowid rowid', ...xx];
                    const sql0 = `select ${campi.join(',')} from ${rr}`
                    campi[0] = 'rowid';
                    out.push(campi);
                    var all = db.all(sql0)
                    for (var r of all) {
                        var p = campi.reduce((t, e) => { t.push(r[e]); return t; }, []);
                        out.push(p);
                    }
                    fs.writeFileSync(path.join(pc.outfile, `${rr}.json`), JSON.stringify(out, null, 1));
                }
            }
        }

        var d1 = new Date().valueOf() - d1;

        console.log("tempo ms:", d1);
        db.chiudi();
    }
    process.exit(0);

}
function dorestore(ff) {
    var k = path.parse(ff);
    var outfile = path.join(k.dir, 'db_' + k.name);
    if (!fs.existsSync(path.join(outfile, 'schema.sql'))) {
        console.log(`manca la cartella di ripristino:`, outfile);
    } else {
        var d1 = new Date().valueOf();
        dbname = path.join(k.dir, k.name + '.db');
        if (fs.existsSync(dbname)) fs.unlinkSync(dbname);
        db = database.db(dbname);
        db.begin();
        var sql = fs.readFileSync(path.join(outfile, 'schema.sql')).toString();
        db.run(sql);
        var tabelle = db.tabelle();
        for (var t of tabelle) {
            var ff = path.join(outfile, t + '.json')
            if (fs.existsSync(ff)) {
                var dd = JSON.parse(fs.readFileSync(ff));
                if (dd && dd[0]) {
                    if (Array.isArray(dd[0])) {
                        var rx = dd[0];
                        var r2 = [];
                        rx.forEach(r => r2.push('?'));
                        var sql = `insert into ${t} (${rx.join(',')}) values (${r2.join(',')}) `
                        //console.log("IsArray", sql);
                        var ds = db.prepare(sql);
                        for (var i = 1; i < dd.length; i++) {
                            ds.run(...dd[i])
                        }
                    } else {
                        var rx = db.campi(t);
                        var r2 = [];
                        rx.unshift('rowid');
                        rx.forEach(r => r2.push('?'));
                        var sql = `insert into ${t} (${rx.join(',')}) values (${r2.join(',')}) `
                        var ds = db.prepare(sql);
                        for (var d of dd) {
                            var pars = rx.reduce((t, e) => { t.push(d[e]); return t; }, []);
                            ds.run(...pars);
                        }
                    }
                }

            }
        }
        db.commit();
        db.chiudi();
        var d1 = new Date().valueOf() - d1;
        console.log("restore tempo ms:", d1);

    }
    process.exit(0);
}


var clippa = (txt) => {
    if (process.platform == 'darwin') {
        spawnSync('pbcopy', { input: txt });
    } else {
        spawnSync('xsel', ['--clipboard', '--input'], { input: txt });
    }
}

var getclip = () => {
    let clipContent;
    if (process.platform == 'darwin') {
        clipContent = spawnSync('pbpaste').stdout.toString();
    } else {
        clipContent = spawnSync('xsel', ['--clipboard', '--output']).stdout.toString();
    }

    return clipContent;
}


function checkcartellabackup(folderPath) {
    // Verifica se la cartella esiste
    if (!fs.existsSync(folderPath)) {
        // Se non esiste, creala
        fs.mkdirSync(folderPath);
    } else {
        // Se esiste, ottieni l'elenco di tutti i file nella cartella
        const files = fs.readdirSync(folderPath);

        // Rimuovi ogni file nella cartella
        for (const file of files) {
            const filePath = path.join(folderPath, file);
            fs.unlinkSync(filePath);
        }
    }
}
function getip() {

    var folder = "/etc/nginx/sites-available"
    if (fs.existsSync(folder)) {
        var vv = fs.readdirSync(folder);
        for (var v of vv) {
            if (v.length > 0 && v != 'default') {
                var data = fs.readFileSync(path.join(folder, v)).toString();
                var r1 = /server_name\s*(.*);/gim.exec(data);
                var pp = []
                if (r1) {
                    for (; ;) {
                        var r2 = /localhost:(\d+)/gim.exec(data);
                        if (r2) {
                            pp.push(r2[1]);
                            data = data.slice(r2.index + 8);
                        } else {
                            break;
                        }
                    }
                }
                stdout.write(`${Bold}${r1[1]}:${Reset} ${Green}${pp.join(' ')}${Reset}\n`);

            }
        }
    } else {
        stdout.write(`Folder: ${Green}"${folder}" ${Reset} not found!\n`);
    }
    process.exit(0);

}

// -------------------------- variabili globali
var db = null, dbname = '';
var modosql = false, mcreate = false, mmenu = false;


var pad = (s, l) => { return !l || s.length >= l ? l : s + new Array(l - s.length).join(' '); }
var getdb = (noerr = false) => {
    if (dbname) {
        try {
            if (!db) {
                db = database.db(dbname);
            }
            return true;
        } catch (e) {

        }
    } else {
        db = null;
        if (!noerr) stdout.write(`${Red}..missing db..${Reset}\n`);
    }
    return false;
}
function getfileout(r0) {
    if (Array.isArray(r0)) r0 = r0.join(' ');
    var tm = path.parse(dbname);
    if (tm && tm.dir) {
        var outdir;
        if (lasts.outdir) {
            outdir = lasts.outdir;
        } else {
            outdir = path.join(tm?.dir, 'out');
        }
        if (outdir.startsWith('~')) {
            outdir = path.resolve(os.homedir(), outdir.slice(2));
        }
        if (!fs.existsSync(outdir)) {
            fs.mkdirSync(outdir, true);
        }
        return r0 ? path.join(outdir, r0) : path.join(outdir, tm.name + '_db');
    }
    return r0 ? r0 : 'out';
}


var stdout = process.stdout;
const rl = readline.createInterface({
    input: process.stdin,
    output: stdout,
    prompt: 'TL> '
});



var lasts = {
    data: [],
    short: true,
    outdir: '',
    history: []
};


{ // ------------------------- gestione degli ultimi files inseriti 
    var filelast = '.lasts.tlite';
    if (fs.existsSync(filelast)) {
        var tm = JSON.parse(fs.readFileSync(filelast));
        if (tm && tm.data && Array.isArray(tm.data)) lasts = tm;
    }
    var pushlast = (file) => {
        for (var i = 0; i < lasts.data.length; i++) {
            var d = lasts.data[i];
            if (d == file) {
                if (i > 0) { // sposta al primo posto
                    var tm = lasts.data.splice(i, 1);
                    lasts.data.unshift(tm[0]);
                    lasts.history = [...rl.history];
                    if (rl.history.length > 50) rl.history.length = 50
                    fs.writeFileSync(filelast, JSON.stringify(lasts, null, 2));
                }
                return;
            }
        }
        lasts.data.unshift(file);
        if (lasts.data.length > 9) lasts.data.pop();
        fs.writeFileSync(filelast, JSON.stringify(lasts, null, 2));
    }
}




var doselect = (db, s, isclip) => {
    var cl = [];
    var rr = /(\[[^\]]*\])/gim.exec(s)
    if (rr) {
        s = s.substr(0, rr.index);
        cl = JSON.parse(rr[1]);
    }
    if (s.startsWith('e ')) {
        s = 'explain query plan ' + s.substr(2);
    }
    if (s.indexOf(' limit') < 1) s += ' limit 20' // max 20 righe;
    var rr = db.prepare(s).all(...cl);
    if (isclip && rr?.length > 0) {
        var tt = [];
        for (var r of rr) {
            var tm = [];
            for (var x in r) {
                tm.push(r[x]);
            }
            tt.push(tm.join('\t'));
        }
        clippa(tt.join('\n'));
    }

    var fld = [], rx = [];
    if (rr && rr.length > 0) {
        for (var r in rr[0]) {
            fld.push(r);
        }
    } else {
        return true;
    }


    process.stdout.write(`${Green}${fld.join(',')}${Reset}\n`);
    for (var r of rr) {
        rx = [];
        for (var f of fld) {
            var a = r[f];
            if (lasts.short && typeof (a) == 'string' && a.length > 20 && (a.startsWith('{') || a.startsWith('['))) {
                a = `${Red}JSON${Reset}`;
            }
            rx.push(a);
        }
        process.stdout.write(`${rx.join(',')}\n`);
    }
    return false;
}
var printdbs = () => {
    var rr = db.databases()
    for (var r of rr) {
        stdout.write(`${Yellow}${r.name}: ${Bold}${r.file}${Reset}\n`);
    }
}

var dosql = (sql, modo, isclip) => {
    startast = false;
    if (sql.length > 1 && sql[sql.length - 1] == '!') sql = sql.substr(0, sql.length - 1);



    if (getdb()) {
        try {
            if (modo) {
                var rr = database.splitsql(sql);
                var r1 = [];
                for (var r of rr) {
                    var tm = db.tabledef(r, true);
                    if (tm) {
                        process.stdout.write(tm + '\n');
                        r1.push(tm);
                        db.run(tm);
                    }
                }

                clippa(r1.join('\n'));
            } else {
                var ss;

                if (/^\s*(select|insert|delete|update|e)\s+/i.test(sql)) {
                    ss = [sql];
                } else {
                    ss = database.splitsql(sql);
                }
                if (ss.length > 1 || ss[0].includes('\n')) {
                    for (var i = 0; i < ss.length; i++) {
                        ss[i] = ss[i].split('\n').filter(e => e.trim()).join('\n');
                    }
                    clippa(['!', ...ss, '!'].join('\n'));
                } else {
                    clippa(ss.join('\n'));
                }


                for (var s of ss) {
                    s = s.trim();
                    if (!/^\s*(select|e)\s+/i.test(s)) {
                        if (s.trim()) {
                            var cl = [];
                            var rr = /(\[[^\]]*\])/gim.exec(s)
                            if (rr) {
                                s = s.substr(0, rr.index);
                                cl = JSON.parse(rr[1]);
                            }
                            db.run(s, ...cl);
                        }
                    } else {

                        return doselect(db, s, isclip);
                    }
                }
            }
        } catch (e) {
            process.stdout.write(`${Red}${e}${Reset}\n`);
        }
    }
}


var startast = false;
var ressql = "";
var processa = async (res) => {
    if (mmenu) {
        res = parseInt(res);
        mmenu = false;
        if (res > 0 && res <= lasts.data.length) {
            await processa(`use ${lasts.data[res - 1]}`)
        }
    }
    else if (modosql) {
        ressql += '\n' + res;
        if (ressql[ressql.length - 1] == '!' || (ressql[ressql.length - 1] == ';') && startast == false) {
            dosql(ressql, mcreate);
            mcreate = false;
            ressql = "";
            modosql = false;
        }
    } else {
        if (!res) res = '';
        var resplit = res.split(' ');
        var r1 = resplit.splice(0, 1)
        r1 = r1 && r1[0] ? r1[0].toLowerCase() : ''
        var r0 = resplit.join(' '); if (!r0) r0 = '';
        var r1s = r1.split(';')[0];
        if (r1s.startsWith('.')) {
            r1 = r1s.substr(1);
            r1s = '.';

        }
        switch (r1s) {
            case "q":
            case "quit":
                doesci();
            case 'h':
            case 'help':
            case '?':
                stdout.write(`${Reset}Help comandi ${Bold}Tlite${Reset}:
${Bold}h, help,?${Reset}Documentazione delle funzioni di sistema
${Bold}use[file]          ${Reset}Mostra / Imposta il database in uso
${Bold}close, chiudi      ${Reset}Chiudi il database corrente
${Bold}last, db, lastdb   ${Reset}Mostra l'elenco degli ultimi db utilizzati
${Bold}jshort[1, 0]       ${Reset}Imposta la visualizzazione record json(1 = full, 0 no)
${Bold}outdir <folder>    ${Reset}Imposta la cartella di output per esportazioni(.per default )
${Bold}schema[d][table]   ${Reset}Mostra sql con la creazione del database / Tabella
${Bold}attach <file> <nn> ${Reset}Collega un database, con il nome <nn>, o  mostra l'elenco dei db. collegati
${Bold}detach <nn>        ${Reset}Scollega il database collegato
${Bold}tables/tabelle     ${Reset}Mostra le tabelle di un DB
${Bold}fields <table>     ${Reset}Mostra i campi di una tabella (usare anche campi <table>)
${Bold}yaml <table>       ${Reset}Mostra struttura database/tabella in formato YAML
${Bold}xexp <file> [table]${Reset}Esporta in formato XLSX una tabella,query o l'intero database (non inserire suffisso)
${Bold}exp <file> [table] ${Reset}Esporta in formato json una tabella,query o l'intero database
${Bold}csvexp     [table] ${Reset}Esporta in formato CSV una tabella,query
${Bold}expfull...         ${Reset}Come exp, solo per le tabelle esporta anche la struttura
${Bold}md/md5 <pass>      ${Reset}Restituisce formato md5 (password o altri testi)
${Bold}ximp <file>        ${Reset}Importa il file dati nel formato XLSX (esportato con xexp)
${Bold}imp <file>         ${Reset}Importa il file dati nel formato JSON (exportato con exp)
Attenzione: La tabella di import deve esistere e i dati vengono completamente sovrascritti
${Bold}! <comando...> ;   ${Reset}esegue il comando SQL senza risultato (chiudere con ${Bold}!${Reset})
${Bold}!c <comando...> ;  ${Reset}esegue il comando SQL per creare una tabella (chiudere con ${Bold}!${Reset})
${Bold}i <table>          ${Reset}Genera il comando SQL per l'insert sulla tabella
${Bold}d <table>          ${Reset}Genera il comando SQL per il delete sulla tabella
${Bold}s,so <table>       ${Reset}Genera il comando SQL per il select sulla tabella (so=order)
${Bold}e <sql>            ${Reset}Explain Query
${Bold}u <table>          ${Reset}Genera il comando SQL per l'update sulla tabella
${Bold}v <table> [cerca]  ${Reset}Genera il comando SQL per la ricerca FTS5. se impostato cerca torna anche i dati
${Bold}.<table>           ${Reset}Mostra il contenuto della tabella
${Bold}!!                 ${Reset}Apre nano con la clipboard
${Bold}q,quit             ${Reset}Esci
`)
                break;
            case 'getip':
                getip();
                break;
            case 'use':
                r0 = r0.replaceAll(';', '');
                if (r0) {
                    if (getdb(true)) db.close();
                    db = null;
                    try {
                        db = database.db(r0);
                        dbname = r0;
                        pushlast(dbname);
                    } catch (e) {
                        stdout.write(`${Red}${e}${Reset}\n`);
                        db = null;
                    }
                }
                if (!dbname) {
                    stdout.write(`No Database in use...${Reset}\n`);
                } else {
                    stdout.write(`Database: ${Bold}${Green}${dbname}${Reset}\n`);
                }
                break;
            case '!!':
                let tempFile = path.join(os.tmpdir(), '.tlite_tmp');
                var clp = getclip().replaceAll(/^\s*\!\s*\n?/gim, '').replaceAll(/\!\s*$/gim, '');
                fs.writeFileSync(tempFile, clp);
                execSync(`nano ${tempFile}`, { stdio: 'inherit' });
                let editedContent = fs.readFileSync(tempFile, 'utf-8');
                fs.unlinkSync(tempFile);
                dosql(editedContent, /^\s*c\s+\w/gim.test(editedContent));
                ressql = false
                break;
            case 'md':
            case 'md5':
                r0 = r0.replaceAll(';', '').trim();
                var r = r0.md5();
                clippa(`${r || ''}`)
                stdout.write(`${r || ''}\n`);
                break;

            case 'close':
            case 'chiudi':
                if (getdb()) {
                    stdout.write(`closed: ${Bold}${db.name}${Reset}\n`);
                    db.close();
                }
                db = null;

                break;
            case 'last':
            case 'db':
            case 'dbs':
            case 'lastdb':
                if (lasts.data.length) {
                    stdout.write(`${Yellow}Last used db:${Reset}\n`);
                    for (var i = 0; i < lasts.data.length; i++) {
                        stdout.write(`${i + 1}. ${Bold}${lasts.data[i]}${Reset}\n`);
                    }
                    mmenu = true;
                }
                break;
            case 'jshort':
                lasts.short = parseInt(r0) ? 1 : 0
                fs.writeFileSync(filelast, JSON.stringify(lasts, null, 2));
                break;
            case 'outdir':
                if (r0) {
                    lasts.outdir = r0 == '.' ? '' : r0
                    fs.writeFileSync(filelast, JSON.stringify(lasts, null, 2));
                }
                stdout.write(`${Green}OutDir: ${Bold}${lasts.outdir}${Reset}\n`);

                break;
            case 'attach':
                if (getdb()) {
                    try {
                        r0 = r0.replaceAll(';', '');
                        if (r0) {
                            var vv = r0.split(' ');
                            if (vv[0] && db.attach(vv[0], vv[1])) {
                                printdbs();

                            } else {
                                stdout.write(`${Red}Errore collegamento: file non trovato${Reset}\n`);
                            }
                        } else {
                            printdbs();
                        }
                    } catch (e) {
                        stdout.write(`${Red}${e}${Reset}\n`);
                    }
                }
                break;
            case 'detach':
                if (getdb()) {
                    try {
                        r0 = r0.replaceAll(';', '');
                        db.detach(r0)
                        printdbs();

                    } catch (e) {
                        stdout.write(`${Red}${e}${Reset}\n`);
                    }
                }
                break;
            case 'tabelle':
            case 'tables':
                if (getdb()) {
                    try {
                        var rr = db.tabelle();
                        stdout.write(`${Yellow}Tables: ${Bold}${db.name}${Reset}\n`);
                        for (var r of rr) {
                            var c = db.get(`select count(rowid) tot from ${r}`).tot
                            stdout.write(`${r} => ${c || 0} \n`);
                        }
                    } catch (e) {
                        stdout.write(`${Red}${e}${Reset}\n`);
                    }
                }
                break;
            case 'campi':
            case 'fields':
                if (getdb()) {
                    try {
                        r0 = r0.replaceAll(';', '');
                        var rr = db.campi(r0, r1s == 'fields');

                        if (r0) stdout.write(`${Yellow}Table: ${Bold}${db.name}.${r0}${Reset}\n`);
                        stdout.write(JSON.stringify(rr, null, 2));
                        stdout.write('\n');

                    } catch (e) {
                        stdout.write(`${Red}${e}${Reset}\n`);
                    }
                }
                break;
            case 'schema':
            case 'schemad':
                if (getdb()) {
                    try {
                        var r = db.schema(r0, r1s === 'schemad');
                        clippa(`${r} \n`);
                        stdout.write(`${r}\n`);
                    } catch (e) {
                        stdout.write(`${Red}${e}${Reset}\n`);
                    }
                }
                break;
            case "yaml":
                if (getdb()) {
                    try {

                        r0 = r0.replaceAll(';', '');
                        var oo = [];
                        if (!r0) {
                            var vv = db.tabelle();
                        } else {
                            vv = [r0]
                        }
                        var cl = [`#!db`]
                        for (var v of vv) {
                            cl.push(`\n${v}:`)
                            var campi = db.campi(v, true);
                            var pr = [];
                            for (var c in campi) {
                                var k = campi[c];
                                if (k.pr) pr.push(c);
                                cl.push(`  ${c}: ${k.t || 'v'}`);
                            }
                            if (pr.length) {
                                cl.push(`  __pk: ${pr.join(',')}`)
                            }
                            var rr = db.all(`select sql from  sqlite_master  where sql>'' and Lower(tbl_name)='${v}' and type='index' order by name`)
                            var i = 0;
                            for (var r of rr) {
                                var tm = /\son\s(\w+)\s\((.*?)\)/gim.exec(r.sql);
                                if (tm) {
                                    cl.push(`  __i${i}: ${tm[2]}`);
                                    i++
                                } else {
                                    console.log(r.sql);
                                }
                            }
                        }


                        var out = cl.join(`\n`);
                        clippa(`${out} \n`);
                        stdout.write(`${out}\n`);

                    } catch (e) {
                        stdout.write(`${Red}${e}${Reset}\n`);
                    }
                }
                break;
            case 'xexp':
                if (getdb()) {
                    try {
                        var f2 = resplit[0];
                        var file = getfileout(f2)
                        if (resplit.length > 1) {
                            resplit.splice(0, 1);
                            r0 = resplit.join(' ');
                        }
                        var rq = db.export(r0, false)
                        xlsexport(rq, f2, file);
                        stdout.write(`write: ${Bold}${file}.xlsx${Reset}\n`);
                    } catch (e) {
                        stdout.write(`${Red}${e}${Reset}\n`);
                    }
                }
                break;


            case 'exp':
            case 'expfull':
                if (getdb()) {
                    try {
                        var file = getfileout(resplit[0]) + '.json'
                        if (resplit.length > 1) {
                            resplit.splice(0, 1);
                            r0 = resplit.join(' ');
                        }
                        var rq = db.export(r0, r1 === 'expfull')
                        if (r0) {
                            for (var r of rq) {
                                for (var x in r) {
                                    var a = r[x];
                                    if (typeof (a) == 'string'
                                        && (a.startsWith('{') || a.startsWith('['))
                                        && (a.endsWith('}') || a.endsWith(']'))) {
                                        r[x] = JSON.parse(a);
                                    }
                                }
                            }
                        }

                        if (fs.existsSync(file)) fs.unlinkSync(file);
                        fs.writeFileSync(file, JSON.stringify(rq, null, 2));
                        stdout.write(`write: ${Bold}${file}${Reset}\n`);
                    } catch (e) {
                        stdout.write(`${Red}${e}${Reset}\n`);
                    }
                }
                break;
            case "csvexp":
                if (getdb()) {
                    try {
                        function csvcampo(t) {
                            if (typeof (t) == 'number') t = '' + t;
                            if (t.includes('\t') || t.includes('\n') || t.includes('"')) {
                                t = `"${t.replace(/"/g, '""')}"`
                            }
                            return t;
                        }
                        var f2 = resplit[0];
                        var file = getfileout(f2) + '.csv'
                        var fl = false;
                        if (resplit.length > 1) {
                            resplit.splice(0, 1);
                            r0 = resplit.join(' ');
                            fl = true;
                        }
                        if (r0) {
                            var cl = [];
                            var c2 = [];
                            if (!fl) {
                                var rq = db.export(r0, true)
                                for (var x in rq.flds) cl.push(x);
                                c2.push(cl.join('\t'));
                                for (var r of rq.data) {
                                    cl = [];
                                    for (var x in rq.flds) {
                                        cl.push(csvcampo(r[x] || ''));
                                    }
                                    c2.push(cl.join('\t'));
                                }
                            } else {
                                var rq = db.export(r0);
                                for (var r of rq) {
                                    if (fl) {
                                        cl = [];
                                        for (var x in r) {
                                            cl.push(x);
                                        }
                                        fl = false;
                                        c2.push(cl.join('\t'));
                                    }
                                    cl = [];
                                    for (var x in r) {
                                        cl.push(csvcampo(r[x] || ''));
                                    }
                                    c2.push(cl.join('\t'));
                                }
                            }
                            if (fs.existsSync(file)) fs.unlinkSync(file);
                            fs.writeFileSync(file, c2.join('\n'));
                            stdout.write(`write: ${Bold}${file}${Reset}\n`);
                        } else {
                            stdout.write(`must specify a table\n`);
                        }
                    } catch (e) {
                        stdout.write(`${Red}${e}${Reset}\n`);
                    }
                }
                break;
            case 'imp':
                if (getdb()) {
                    try {
                        var f2 = resplit[0];
                        var file = getfileout(f2) + '.json'
                        if (fs.existsSync(file)) {
                            var rq = JSON.parse(fs.readFileSync(file));
                            if (r0) {
                                for (var r of rq) {
                                    for (var x in r) {
                                        var a = r[x];
                                        if (a && typeof (a) == 'object') {
                                            r[x] = JSON.stringify(a);
                                        }
                                    }
                                }
                            }
                            db.import(r0, rq);
                            stdout.write(`read: ${Bold}${file}${Reset}\n`);

                        } else {
                            stdout.write(`${Red}File non Trovato: ${file}${Reset}\n`);
                        }
                    } catch (e) {
                        stdout.write(`${Red}${e}${Reset}\n`);
                    }
                }
                break;
            case 'ximp':
                if (getdb()) {
                    try {
                        if (r0) {
                            var file = getfileout(r0) + '.xlsx'
                            if (fs.existsSync(file)) {
                                var rq = await xlsimport(file, r0)
                                db.import(r0, rq);
                            }
                        }
                    } catch (e) {
                        stdout.write(`${Red}${e}${Reset}\n`);
                    }
                }
                break;
            case '!':
            case '!c':
                if (r0.length > 1 && (r0[r0.length - 1] == ';' || r0[r0.length - 1] == '!')) {
                    dosql(r0, r1 == '!c');
                } else {
                    mcreate = r1 == '!c';
                    startast = true;
                    modosql = true;
                    ressql = r0;
                }
                break;
            case "c":
                dosql(r0, true);
                break;
            case "select":
            case "insert":
            case "update":
            case "delete":
            case "drop":
            case "alter":
            case "create":
            case "vacuum":
            case "e":
                dosql(r1 + ' ' + r0, false);
                break;
            case "clip":
                dosql('select ' + r0, false, true);
                break;
            case 'i':
            case 'd':
            case 's':
            case 'so':
            case 'u':
            case 'v':
                if (r0) {
                    if (getdb()) {
                        try {
                            var r;
                            switch (r1) {
                                case 'd': r = db.strdelete(r0); break;
                                case 'i': r = db.strinsert(r0); break;
                                case 'u': r = db.strupdate(r0); break;
                                case 'so': r = db.strselect(r0, true); break;
                                case 'v':
                                    r0 = resplit.splice(0, 1)[0]
                                    var word = resplit.join(' ');
                                    r = db.strvirtual(r0, word);
                                    if (word) {
                                        doselect(db, r);
                                    }
                                    break;
                                default: r = db.strselect(r0); break;
                            }
                            clippa(`${r || ''}`)
                            stdout.write(`${r || ''}\n`);
                        } catch (e) {
                            stdout.write(`${Red}${e}${Reset}\n`);
                        }
                    }
                }

                break;
            case '.':
                if (getdb()) {
                    try {
                        if (!db.esisteTabella(r1)) throw new Error(`missing table ${r1}`)
                        r = db.strselect(r1, true)
                        if (r0) {
                            r = r.split('order by')[0] + ' ' + r0
                        }
                        if (dosql(r, false)) {
                            var tm = db.campi(r1);
                            process.stdout.write(`${Green}rowid,${tm}${Reset}\n`);
                        }
                    } catch (e) {
                        stdout.write(`${Red}${e}${Reset}\n`);
                    }
                }

                break;
            case '':
            case undefined:
                break;
            default:
                stdout.write(`${Red}comando sconosciuto: ${Bold}${res}${Reset}\n`);
                break; 1
        }
    }

}

var xx = process.argv[2];
if (xx && /^\s*(ip|getip)\s*$/gim.test(xx)) {
    getip()
} else if (xx && xx == 'backup') {
    var ff = process.argv[3];
    dobackup(ff, process.argv[4] ? 1 : 0)
} else if (xx && xx == 'restore') {
    var ff = process.argv[3];
    dorestore(ff)
} else if (!xx || fs.existsSync(xx)) {
    console.log(DATEVERSION);

    if (xx && fs.existsSync(xx)) {
        await processa(`use ${xx}`);
    } else {
        await processa('db');
    }
} else {
    console.log(`${DATEVERSION}
uso: 
    ${Green}tlite ip  #mostra gli indirizzi ip dei server nginx attivi
    tlite backup <nomedatabase> [fileout]
    tlite restore <nomedatabase no path> [filedatabase]${Reset}
    `);
    process.exit(0);
}

let cl = [], cl2 = [];
setprompt();
if (lasts.history) rl.history = [...lasts.history];
rl.on('line', (lines) => {
    lines = (lines || '').split('\n');
    rl.history.shift();
    for (var line of lines) {
        var r1 = /\\\s*(\/\/.*|\s*)?$/i.exec(line);
        if (r1) {
            cl2.push(line);
            cl.push(line.slice(0, r1.index));
            continue;
        } else if (line.trim() || cl.length) {
            cl.push(line.trim())
            cl2.push(line);
        }
        if (cl.length) {
            if (!mmenu) rl.history.unshift(cl2.join('\n'));
            processa(cl.join(' '));
            setprompt()
        }
    }
}).on('close', () => doesci());

function setprompt() {
    cl = []
    cl2 = [];
    if (mmenu) {
        rl.setPrompt("[0..9] >")
    } else if (!modosql) {
        rl.setPrompt("tl> ")
    } else {
        rl.setPrompt("");
    }
    rl.prompt();

}

function doesci() {
    if (getdb()) db.close();
    lasts.history = [...new Set(rl.history.filter(e => e.trim().length > 2))];
    if (rl.history.length > 50) rl.history.length = 50
    fs.writeFileSync(filelast, JSON.stringify(lasts, null, 2));
    stdout.write('bye1..\n')
    process.exit(0);
}