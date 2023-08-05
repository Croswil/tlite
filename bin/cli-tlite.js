#!/usr/bin/env node
import readline from 'readline';
import path from 'path'
import fs from 'fs';
import os from 'os';
import XLSX from 'xlsx';
import { spawnSync } from 'child_process';
import { database } from 'liburno_lib';

var clippa = (txt) => {
    if (process.platform == 'darwin') {
        spawnSync('pbcopy', { input: txt });
    } else {
        spawnSync('xsel', ['--clipboard', '--input'], { input: txt });
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
}

// -------------------------- variabili globali
var db = null, dbname = '';
var modosql = false, mcreate = false, mmenu = false;

const Reset = "\x1b[0m", Bold = "\x1b[1m", Red = "\x1b[31m", Green = "\x1b[32m", Yellow = "\x1b[33m";

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
        if (tm.dir.startsWith('~')) {
            tm.dir = path.resolve(os.homedir(), tm.dir.slice(2));
        }
        return r0 ? path.join(tm.dir, r0) : path.join(tm.dir, tm.name + '_db');
    }
    return r0 ? r0 : 'out';
}

var lasts = {
    data: [],
    short: true,
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


var stdout = process.stdout;
const rl = readline.createInterface({
    input: process.stdin,
    output: stdout,
    prompt: 'TL> '
});


var doselect = (db, s) => {
    if (s.indexOf(' limit') < 1) s += ' limit 20' // max 20 righe;
    var rr = db.prepare(s).all();
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

var dosql = (sql, modo) => {
    startast = false;
    if (sql.length > 1 && sql[sql.length - 1] == '!') sql = sql.substr(0, sql.length - 1);
    clippa(sql);
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
                if (/^\s*(select|insert|delete|update)\s+/i.test(sql)) {
                    ss = [sql];
                } else {
                    ss = database.splitsql(sql);
                }
                for (var s of ss) {
                    s = s.trim();
                    if (!s.startsWith('select ')) {
                        if (s.trim()) db.run(s);
                    } else {
                        return doselect(db, s);
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
var processa = (res) => {
    if (mmenu) {
        res = parseInt(res);
        mmenu = false;
        if (res > 0 && res <= lasts.data.length) {
            processa(`use ${lasts.data[res - 1]}`)
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
                if (getdb()) db.close();
                stdout.write('bye1..\n')
                process.exit(0);
            case 'h':
            case 'help':
            case '?':
                stdout.write(`${Reset}Help comandi ${Bold}Tlite${Reset}:
      ${Bold}h,help,?           ${Reset}Documentazione delle funzioni di sistema
      ${Bold}use [file]         ${Reset}Mostra/Imposta il database in uso
      ${Bold}close,chiudi       ${Reset}Chiudi il database corrente
      ${Bold}last,db,lastdb     ${Reset}Mostra l'elenco degli ultimi db utilizzati
      ${Bold}jshort [1,0]       ${Reset}Imposta la visualizzazione record json (1=full, 0 no)
      ${Bold}schema[d] [table]  ${Reset}Mostra sql con la creazione del database / Tabella
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
      ${Bold}u <table>          ${Reset}Genera il comando SQL per l'update sulla tabella 
      ${Bold}v <table> [cerca]  ${Reset}Genera il comando SQL per la ricerca FTS5. se impostato cerca torna anche i dati
      ${Bold}.<table>           ${Reset}Mostra il contenuto della tabella
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
                            var rr = db.tabelle();
                        } else {
                            rr = [r0]
                        }
                        console.log(rr);
                        for (var r of rr) {
                            oo.push(`\n${r}:`);
                            var ff = db.campi(r, true);
                            for (var f in ff) {
                                if (f != 'rowid')
                                    oo.push(`  ${f}: "${ff[f].t}"`);
                            }
                        }
                        var out = oo.join(`\n`);
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
                        const worksheet = XLSX.utils.json_to_sheet(rq);
                        const workbook = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(workbook, worksheet, f2);
                        XLSX.writeFile(workbook, `${file}.xlsx`, { compression: true });
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
                                var workbook = XLSX.readFile(file);
                                var ws = workbook.Sheets[r0]
                                var rq = XLSX.utils.sheet_to_json(ws)
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
            case "select":
            case "insert":
            case "update":
            case "delete":
            case "drop":
            case "alter":
            case "create":
            case "vacuum":
                dosql(r1 + ' ' + r0, false);
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
    //    if (db) {
    //        db.chiudi();
    //        db = null;
    //    }
    if (mmenu) {
        rl.setPrompt("[0..9] >")
    } else if (!modosql) {
        rl.setPrompt("tl> ")
    } else {
        rl.setPrompt("");
    }
    rl.prompt();
}

var xx = process.argv[2];
if (xx && /^\s*(ip|getip)\s*$/gim.test(xx)) {
    getip()
    process.exit(0);
} else {

    stdout.write(`${Reset}Benvenuto a ${Bold}Tlite${Reset} (c) Croswil 2023
${Green}SqlLite+FTS5 CLI tool
Digita ${Bold}help${Reset}${Green} per maggiori informazioni...  ${Reset}
`);

    if (xx && fs.existsSync(xx)) {
        processa(`use ${xx}`);
    } else {
        processa('db');
    }
}


rl.on('line', (res) => {
    processa(res);
});
