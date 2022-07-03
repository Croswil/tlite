#!/usr/bin/env node
const readline = require('readline');
const path = require('path')
const fs = require('fs');
const { spawnSync } = require('child_process');
var { database } = require('liburno_lib');
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
                if (r1) {
                    var r2 = /localhost:(\d+)/gim.exec(data);
                    if (r2) {
                        stdout.write(`${Bold}${r1[1]}:${Reset} ${Green}${r2[1]}\n`);
                    }
                }
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
            db = database.db(dbname);
            return true;
        } catch (e) {

        }
    } else {
        if (!noerr) stdout.write(`${Red}..missing db..${Reset}\n`);
    }
    return false;
}


{ // ------------------------- gestione degli ultimi files inseriti 
    var filelast = '.lasts.tlite';
    var lasts = {
        data: []
    };
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
    }
    process.stdout.write(`${Green}${fld.join(',')}${Reset}\n`);
    for (var r of rr) {
        rx = [];
        for (var f of fld) rx.push(r[f]);
        process.stdout.write(`${rx.join(',')}\n`);
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
                var ss = database.splitsql(sql);
                for (var s of ss) {
                    s = s.trim();
                    if (!s.startsWith('select ')) {
                        if (s.trim()) db.run(s);
                    } else {
                        doselect(db, s);
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
      ${Bold}schema[d] [table]  ${Reset}Mostra sql con la creazione del database / Tabella
      ${Bold}tables             ${Reset}Mostra le tabelle di un DB
      ${Bold}fields <table>     ${Reset}Mostra i campi di una tabella (usare anche campi <table>)
      ${Bold}exp <file> [table] ${Reset}Esporta in formato json una tabella,query o l'intero database
      ${Bold}expfull...         ${Reset}Come exp, solo per le tabelle esporta anche la struttura
      ${Bold}imp <file>         ${Reset}Importa il file dati nel formato JSON (lo stesso dell'esportazione)
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
            case 'tabelle':
            case 'tables':
                if (getdb()) {
                    try {
                        var rr = db.tabelle();
                        stdout.write(`${Yellow}Tables: ${Bold}${db.name}${Reset}\n`);
                        for (var r of rr) {
                            stdout.write(`${r}\n`);
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
            case 'exp':
            case 'expfull':
                if (getdb()) {
                    try {
                        var file = resplit.splice(0, 1)
                        file = file && file[0] ? file[0].toLowerCase() : ''
                        r0 = resplit.join(' ');
                        if (!r0) {
                            r0 = file;
                            file = file + '.json';
                        }
                        var rq = db.export(r0, r1 === 'expfull')
                        if (fs.existsSync(file)) fs.unlinkSync(file);
                        fs.writeFileSync(file, JSON.stringify(rq, null, 2));
                        stdout.write(`write: ${Bold}${file}${Reset}\n`);
                    } catch (e) {
                        stdout.write(`${Red}${e}${Reset}\n`);
                    }
                }
                break;
            case 'imp':
                if (getdb()) {
                    try {
                        var file = resplit.splice(0, 1);
                        file = file && file[0] ? file[0].toLowerCase() : ''
                        r0 = resplit.join(' ');
                        if (!r0) {
                            r0 = file;
                            file = file + '.json';
                        }
                        if (fs.existsSync(file)) {
                            var rq = JSON.parse(fs.readFileSync(file));
                            db.import(r0, rq);
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
            case "vacuum":
            case "attach":
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
                        dosql(r, false);
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
    if (db) {
        db.chiudi();
        db = null;
    }
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
    stdout.write(`${Reset}Benvenuto a ${Bold}Tlite${Reset} (c) Croswil 2022
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
