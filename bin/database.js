const Database = require('better-sqlite3');
const homedir=require("os").homedir();
require("./proto");


const mappe = new Map();

var cleansql = (tm) => {
    return tm.replace(/(?:--|\/\/).*/g, '').replace(/^ +/gm, '').replace(/ +$/gm, '').replace(/[\n\r\s]+/gm, ' ');
}

var splitsql = (tm) => {
    tm = cleansql(tm)
    var vv = tm.split(';');
    var fl = false;
    var tq = "";
    var res = [];
    for (var v of vv) {
        if (/^ *CREATE +.*?BEGIN/i.test(v)) {
            tq = v;
            fl = true;
        } else if (fl) {
            if (/^ *END *$/gim.test(v)) {
                res.push(tq + '; ' + v)
                fl = false;

            } else {
                tq = tq + '; ' + v;
            }
        } else {
            res.push(v);
        }
    }
    return res;
}

module.exports = {
    splitsql(sql) { return splitsql(sql) },
    cleansql(sql) { return cleansql(sql) },
    db(name) {
        if (name.startsWith('~')) {
            name=homedir+name.substr(1);
        }
        var d = new Database(name)
        mappe.set(name, d);
        d._regx={};
        d.function("compare", (first, second) => {
            first = first.replace(/\s+/g, '')
            second = second.replace(/\s+/g, '')

            if (first === second) return 1; // identical or empty
            if (first.length < 2 || second.length < 2) return 0; // if either is a 0-letter or 1-letter string

            let firstBigrams = new Map();
            for (let i = 0; i < first.length - 1; i++) {
                const bigram = first.substring(i, i + 2);
                const count = firstBigrams.has(bigram)
                    ? firstBigrams.get(bigram) + 1
                    : 1;

                firstBigrams.set(bigram, count);
            };

            let intersectionSize = 0;
            for (let i = 0; i < second.length - 1; i++) {
                const bigram = second.substring(i, i + 2);
                const count = firstBigrams.has(bigram)
                    ? firstBigrams.get(bigram)
                    : 0;

                if (count > 0) {
                    firstBigrams.set(bigram, count - 1);
                    intersectionSize++;
                }
            }

            return (2.0 * intersectionSize) / (first.length + second.length - 2);
        })
        d.function("regex",(a,b,id=0)=> {
            if (!d._regx[b]) d._regx[b]=new RegExp(b,"gim");
            var rr=d._regx[b];
            if (id==0) {
                return rr.test(a)?1:0
            } else {
                var r2=rr.exec(a)
                if (r2 && r2[id]) return r2[id];
                return ""
            }
        });
        d.function("mix", (a,b)=> {
            return a?a:b;
        })
        d.function("anno",(d)=> {
            var a=0
            d=parseInt(d) || 0;
            a=Math.floor(d/10000);
            if (a<1800 || a>2200) a=0;
            return a;
        })
        d.function("mese",(d)=> {
            d=parseInt(d) || 0;
            m=Math.floor(d/100)-Math.floor(d/10000)*100;
            if (m<1 || m>12) m=0;
            return m;
        })
        d.function("giorno",(d)=> {
            d=parseInt(d) || 0;
            g=Math.floor(d)-Math.floor(d/100)*100;
            if (g<1 || g>12) m=0;
            return g;
        })
    
        d.function("floor",(a)=> {
                if (Number.isNaN(a)) return 0;
                return Math.floor(a);
            });
        d.function("frac",(a)=> {
            if (Number.isNaN(a)) return 0;
            return a-Math.floor(a);
        });
        d.function("mymatch",(a, b)=> {
                if (!a || !b) return 0;
                var v = a.toLowerCase().split(';');
                b = b.toLowerCase();
                for (let i = 0; i < v.length; i++) {
                    if (v[i].startsWith(b)) return 1;
                }
                return 0;
        });
        
        d._cds={};
        d.prepara=(a)=>{
            if (!d._cds[a]) d._cds[a]=d.prepare(a);
            return d._cds[a];
        }
        d.get = function(sql,...args) {
            return d.prepara(sql).get(args) || {};
        };
        d.all = function(sql,...args) {
            return d.prepara(sql).all(args) || [];
        }
        
        d.run = function (sql, ...args) {
            var res
            if (sql.indexOf(';') > 0) {
                var v = splitsql(sql);
                v.forEach(e => {
                    if (e.trim())
                        res = d.prepare(e).run(args);
                })
            } else {
                res = d.prepare(sql).run(args);
            }
            if (res) {
                if (res.lastInsertRowid) return res.lastInsertRowid; else return res.changes;
            }
        }
        d.fields = null;
        d.run('PRAGMA journal_mode = WAL');
        d._idtran = 0;
        d.name = name.startsWith(homedir)?"~"+name.substr(homedir.length):name;
        d.begin = function () {
            if (this._idtran == 0) this.run('begin transaction');
            this._idtran++;
        }

        d.commit = function (all) {
            if (all) {
                d._idtran = 0;
            } else {
                d._idtran--;
            }
            if (d._idtran <= 0) {
                d.run('commit');
                d._idtran = 0;
            }

        }
        d.chiudi = function () {
            if (d._idtran) d.run('commit');

            d._idtran = 0;
            d.close();
            if (mappe.has(d.name)) mappe.delete(d.name);

        }

        d.checkFields = (force) => {
            if (!d.fields || force) {
                d.fields = {};
                var rows = d.prepare("select name,sql from sqlite_master where type='table' order by name").all();
                rows.forEach(r => {
                    var table = r.name.toLowerCase();
                    d.fields[table] = "1";
                    var a = r.sql;
                    var rr=/create table (?:if not exists )*([\w]*) *\((.*?)\)\s*;*\s*$/gi.exec(a);
                    if (rr) {
                        a=rr[2];    
                        var v = a.replaceAll('\n', ' ').replaceAll('\r', '').replaceAll('\t', ' ').replaceAll('  ', ' ').split(',');
                        v.forEach(e => {
                            if (e.indexOf('(') < 0) {
                                var f = e.trim().split(' ');
                                d.fields[table + '.' + f[0].toLowerCase()] = (f[1] || 'NVARCHAR').toUpperCase();
                            }
                        });
                    }
                });
            }
        }
        d.esisteTabella = (name) => {
            d.checkFields();
            return d.fields[name.toLowerCase()] ? 1 : 0;
        }
        d.esisteCampo = (name, campo) => {
            d.checkFields();
            return d.fields[name.toLowerCase() + '.' + campo.toLowerCase()] ? 1 : 0;
        }
        d.TBuilder = (sql, title, pos, des, ...pars) => {
            var rx = d.prepare(sql).all(pars);
            if (rx && rx.length > 0) {
                var r1 = Object.keys(rx[0]);
                var r2 = des.split(',');
                var r3 = pos.split(',');
                var head = [];
                var i = 0;
                var tt = 0;
                r1.forEach(r => {
                    var h1 = "L"
                    var h2 = 1;
                    if (r3[i]) {
                        h1 = r3[i].ex('|', 1);
                        h2 = Number(r3[i].ex('|', 2));
                        if (h2 < 1) h2 = 1;
                    }
                    tt += h2;
                    head.push({
                        id: i, field: r,
                        caption: r2[i] ? r2[i] : r,
                        sortable: true,
                        type: h1,
                        width: h2
                    });
                    i++;
                });
                head.forEach(e => { e.width = Math.round(e.width * 100 / tt) + '%'; })
                return {
                    info: { title: title },
                    full: false,
                    head: {
                        total: i,
                        levels: false,
                        hasWidth: true,
                        columns: head
                    },
                    data: {
                        total: rx.length,
                        records: rx
                    }
                }
            } else {
                return {
                    info: { title: title },
                    head: { total: 0, columns: [] },
                    data: { total: 0, records: [] }
                }
            }
        }
        // --------------------------------------------------------------------------------------------
        // nuove funzioni per gli schemi
        //---------------------------------------------------------------------------------------------
        {

            d.schema = (table, xdel) => {

                if (table) table = table.toLowerCase();
                var t = table ? ` and Lower(tbl_name)='${table}'` : '';
                var rr = d.prepare(`SELECT sql from  sqlite_master  where sql>'' ${t} order by name,rootpage`).all();
                var r0 = [], r1 = [], r2 = [], r3 = [], r4 = [], r1a = [], r0a = [], r2a = [], r3a = [];
                var res = null;
                for (var rx of rr) {
                    var r = cleansql(rx.sql);
                    var fl = false;
                    if (/create +table ['\w]*(?:_config|_data|_docsize|_idx)['\s\(]/gim.test(r)) {
                        fl = true;// esclude le tabelle speciali di configurazione;

                    }
                    res = /create table (?:if not exists )*([\w]*) *\((.*?)\)\s*;*\s*$/gi.exec(r);
                    if (res && !fl) {
                        r0a.push(`DROP TABLE if exists ${res[1]};`);
                        r0.push(d._gettabledef(res[1], res[2]));
                        fl = true;
                    }
                    res = /create +virtual +table +(\w*) +using +fts5 *\((.*?)\)/gim.exec(r);
                    if (res) {
                        fl = true;
                        r1a.push(`DROP TABLE if exists '${res[1]}_config';`);
                        r1a.push(`DROP TABLE if exists '${res[1]}_data';`);
                        r1a.push(`DROP TABLE if exists '${res[1]}_docsize';`);
                        r1a.push(`DROP TABLE if exists '${res[1]}_idx';`);
                        r1a.push(`DROP TABLE if exists ${res[1]};`);
                        r1.push(`CREATE VIRTUAL TABLE ${res[1]} USING fts5(`);
                        var vv = res[2].split(',');
                        var v2 = [];
                        for (var v of vv) {
                            v2.push(`   ${v.trim()}`)
                        }
                        r1.push(v2.join(',\n'))
                        r1.push(');');
                    }
                    res = /create +trigger +([\w]*) *after *(delete|insert|update) *on *(\w*) *begin(.*?)end/gim.exec(r);
                    if (res) {
                        fl = true;
                        r2a.push(`DROP TRIGGER if exists ${res[1]};`)
                        r2.push(`CREATE TRIGGER ${res[1]} AFTER ${res[2]} ON ${res[3]} BEGIN`);
                        var vv = res[4].split(';');
                        for (var v of vv) {
                            if (v.trim()) r2.push(`   ${v.trim()};`)
                        }
                        r2.push('END;');
                    }
                    res = /create index (?:if not exists )*([\w]*) +ON +(.*)/gim.exec(r);
                    if (res) {
                        fl = true;
                        r3a.push(`DROP INDEX if exists ${res[1]};`)
                        r3.push(`CREATE INDEX if not exists ${res[1]} ON ${res[2]};`);
                    }
                    if (!fl && r &&  r.replace(/[\n\s]/gm,"")=="") {
                        r4.push(r);
                    }
                }
                var rt = [];
                if (xdel) {
                    rt.push('--  Cancellazioni');
                    for (var r of r3a) rt.push(r);
                    for (var r of r2a) rt.push(r);
                    for (var r of r1a) rt.push(r);
                    for (var r of r0a) rt.push(r);
                }
                rt.push('-- creazione')
                for (var r of r0) rt.push(r);
                for (var r of r1) rt.push(r);
                for (var r of r2) rt.push(r);
                for (var r of r3) rt.push(r);
                
                /*if (r4.length) {
                    rt.push('-- comandi sconosciuti');
                    for (var r of r4) rt.push(r);
                }
                */
                return rt.join('\n');


            }
            d.tabledef = (r) => {
                var res = /create table (?:if not exists )*([\w]*) *\((.*?)\)\s*;*\s*$/gi.exec(r)
                if (res) {
                    return d._gettabledef(res[1], res[2])
                } else {
                    res = / *([\w]*) *\((.*?)\)\s*;*\s*$/gi.exec(r);
                    if (res) {
                        return d._gettabledef(res[1], res[2]);
                    }
                }

            }
            d._gettabledef = (tb, campi) => {
                var fx = [];
                var tot = []
                var virt = [];
                tot.push(`CREATE TABLE if not exists ${tb} (`);
                var vv = campi.vsplit(',');
                for (var v of vv) {
                    v = v.trim();
                    if (v) {
                        if (v.indexOf('=') > 0) {
                            var vx = v.toLowerCase().split('=');
                            if (vx[0] == 'pk') {
                                fx.push(`   PRIMARY KEY (${vx[1].trim().replaceAll('+', ',').replaceAll(' ', ',')})`)
                            } else {
                                switch (vx[1][0]) {
                                    case 'i':
                                        fx.push(`   ${vx[0]} INTEGER DEFAULT 0`)
                                        break;
                                    case 'r':
                                    case 'f':
                                    case 'd':
                                        fx.push(`   ${vx[0]} REAL DEFAULT 0`)
                                        break;
                                    case 'b':
                                        fx.push(`   ${vx[0]} BLOB`)
                                        break;
                                    case 'v':
                                        // virtual tables !
                                        fx.push(`   ${vx[0]}`)
                                        virt.push(vx[0]);
                                        break;
                                    default:
                                        fx.push(`   ${vx[0]} NVARCHAR COLLATE NOCASE DEFAULT ''`)
                                        break;
                                }
                            }
                        } else {
                            var vx = v.toUpperCase().replaceAll('KEY(', 'KEY (').split(' ');
                            if (vx[0] == "PRIMARY" && vx[1] == "KEY") {
                                vx.splice(0, 2);
                                fx.push(`   PRIMARY KEY ${vx.join(' ')}`)
                            } else {
                                var fld = vx[0].replaceAll('"', '').toLowerCase();
                                vx.splice(0, 1);
                                fx.push(`   ${fld} ${vx.join(' ')}`);
                            }
                        }
                    }
                }
                tot.push(fx.join(',\n'));
                tot.push(');')
                if (virt.length) {
                    tot.push(`CREATE VIRTUAL TABLE ${tb}_v USING fts5 (`);
                    for (var v of virt) {
                        tot.push(`   ${v},`);
                    }
                    var getvals = (pref) => {
                        var v = [];
                        v.push(` ${pref}rowid`);
                        for (var a of virt) v.push(` ${pref}${a}`)
                        return v.join(',');
                    }
                    tot.push(`   content='${tb}',`)
                    tot.push(`   content_rowid='rowid'`);
                    tot.push(');')
                    tot.push(`CREATE TRIGGER ${tb}_ad AFTER DELETE ON ${tb} BEGIN`);
                    tot.push(`   INSERT INTO ${tb}_v(${tb}_v,${getvals('')}) VALUES('delete',${getvals('old.')} );`)
                    tot.push(`END;`)
                    tot.push(`CREATE TRIGGER ${tb}_ai AFTER INSERT ON ${tb} BEGIN`);
                    tot.push(`   INSERT INTO ${tb}_v(${getvals('')}) VALUES(${getvals('new.')} );`)
                    tot.push(`END;`)
                    tot.push(`CREATE TRIGGER ${tb}_au AFTER UPDATE ON ${tb} BEGIN`);
                    tot.push(`   INSERT INTO ${tb}_v(${tb}_v,${getvals('')}) VALUES('delete',${getvals('old.')} );`)
                    tot.push(`   INSERT INTO ${tb}_v(${getvals('')}) VALUES(${getvals('new.')} );`)
                    tot.push(`END;`)
                }
                return tot.join('\n');

            }
            d.tabelle = () => {
                var rr = [];
                var r1 = d.prepare("SELECT tbl_name from  sqlite_master   where type='table' order by tbl_name").all();
                var rx = {};

                for (var r of r1) {
                    var a = r.tbl_name.toLowerCase().replaceAll('"', '');
                    if (/_(?:v|config|data|docsize|idx|)$/gim.test(a)) { }
                    else {
                        rr.push(a);
                    }
                }
                return rr;
            }
            d.campi = (table, complete) => {
                if (!table) {
                    var rt = {};
                    var rr = d.tabelle();
                    for (var r of rr) {
                        rt[r] = d.campi(r, complete);
                    }

                    return rt;
                } else {
                    var r = d.prepare("SELECT sql from  sqlite_master  where Lower(tbl_name)=? and type='table'").get(table.toLowerCase());
                    var res = complete ? {} : [];
                    if (r) {
                        var a = r.sql.replaceAll('\n', ' ').replaceAll('\t', ' ').replaceAll('\r', ' ').replaceAll('"', '').trim();
                        var vv = a.split('(');
                        vv.splice(0, 1);
                        var a2 = vv.join('(').trim();
                        if (a2[a2.length - 1] == ')') a2 = a2.substr(0, a2.length - 2);
                        vv = a2.toLowerCase().replaceAll('key(', 'key (').vsplit(',');
                        if (complete) res.rowid = { t: 'i', pr: true }
                        for (var v of vv) {
                            if (v.indexOf('=') < 0) { // esclude i campi virtuali fts5
                                var v1 = v.trim().split(' ');
                                if (v1[0] != 'primary' && v1[1] != 'key') {
                                    if (complete) {
                                        var a = 's';
                                        if (v.indexOf(' integer') > 1) a = 'i';
                                        if (v.indexOf(' blob') > 1) a = 'b';
                                        if (v.indexOf(' real') > 1) a = 'r';
                                        v1[0] = v1[0].replaceAll('"', '')
                                        res[v1[0]] = { t: a };
                                    } else {
                                        res.push(v1[0].replaceAll('"', '').toLowerCase());
                                    }
                                } else {
                                    var vx = v1[2].replaceAll('(', '').replaceAll(')', '').split(',')
                                    delete res.rowid;
                                    for (var x of vx) {
                                        x = x.split(' ')[0].trim();
                                        if (res[x]) res[x].pr = true;
                                    }


                                }
                            }
                        }
                    }
                    return res;
                }
            }
            d.strinsert = (table) => {
                var ss = d.campi(table);
                var qs = [];
                for (var s of ss) qs.push('?');
                return `insert or replace into ${table} (${ss.join(', ')}) values (${qs.join(',')}) `
            }
            d.strjson = (table) => {
                var _default = (t) => {
                    switch (t) {
                        case 'i': return 0;
                        case 'r': return 0.0;
                        default: return '';
                    }
                }
                var xx = d.campi(table, true);
                var res = {
                    keys: {},
                    campi: {}
                }
                for (var x in xx) {
                    if (xx[x].pr)
                        res.keys[x] = _default(xx[x].t);
                    else
                        res.campi[x] = _default(xx[x].t);
                }
                return res;
            }
            d.strdelete = (table) => {
                var xx = d.campi(table, true);
                var vv = [];
                for (var x in xx) {
                    if (xx[x].pr) vv.push(x + ' = ?');
                }
                return `delete from ${table} where ${vv.join(' and ')}`;
            }
            d.strvirtual = (tb,word) => { // select su virtual table
                var tb1 = tb + '_v';
                var x1 = d.campi(tb1, false);
                if (x1.length == 0) return d.strselect(tb);
                var x2 = d.campi(tb, false);
                var x3 = {}
                var i = 1;
                for (var x of x1) {
                    x3[x] = i++;
                }
                var vv = [];
                var v2 = []
                vv.push("SELECT");
                v2.push("a.rowid")
                for (var x of x2) {
                    if (!x3[x]) {
                        v2.push(`a.${x}`)
                    } else {
                        v2.push(`highlight(${tb1}, ${x3[x] - 1}, '<b>', '</b>') ${x}`)
                    }
                }
                vv.push(v2.join(','));
                word=word?`'${word}'`:'?'
                vv.push(`FROM ${tb1} b JOIN ${tb} a ON a.rowid=b.rowid WHERE ${tb1}=${word} ORDER BY rank,b.rowid`)
                return vv.join(' ');
            }
            d.strselect = (table, ordered) => {
                
                var xx = d.campi(table, true);
                var vv = [];
                var vv2 = [];
                var v1 = [];
                if (!xx.rowid) v1.push('rowid');
                for (var x in xx) {
                    if (xx[x].pr) {
                        vv.push(x + ' = ?');
                        vv2.push(x);
                    }
                    v1.push(x);
                }
                var ord = ordered ? ` order by ${vv2.join(',')}` : '';
                var wh = ordered ? '' : ` where ${vv.join(' and ')}`
                return `select ${v1.join(',')} from ${table}${wh}${ord}`;
            }
            d.strupdate = (table) => {
                var xx = d.campi(table, true);
                var vv = [];
                var v1 = [];
                for (var x in xx) {
                    if (xx[x].pr)
                        vv.push(x + ' = ?')
                    else
                        v1.push(`${x}=?`);
                }
                return `update ${table} set ${v1.join(',')} where ${vv.join(' and ')}`;
            }
            d.export = (table, mode) => {
                if (!table) {
                    var rt = {};
                    var rr = d.tabelle();
                    for (var r of rr) {
                        rt[r] = d.export(r, true);
                    }
                    return rt;
                } else {
                    if (table.toLowerCase().startsWith('select ')) {
                        return d.prepare(table).all();
                    } else {
                        var xx = d.campi(table);
                        var x1 = d.campi(table, true);
                        delete x1.rowid;
                        var sql = `select ${xx.join(',')} from ${table}`;


                        return mode ? {
                            flds: x1,
                            data: d.prepare(sql).all()
                        } : d.prepare(sql).all()
                    }
                }
            }
        }
        d.import = (table, xdata) => {
            if (!table) {
                for (var r in rr) {
                    d.import(r, rr[r]);
                }
            } else {
                var data, flds;
                if (Array.isArray(xdata)) {
                    data = xdata;
                    flds = null;
                } else {
                    data = xdata.data;
                    flds = xdata.flds;
                }
                if (!Array.isArray(data)) {
                    console.warn('invalid format!')
                    return;
                }
                var _default = (t) => {
                    switch (t) {
                        case 'i': return 0;
                        case 'r': return 0.0;
                        default: return '';
                    }
                }
                d.begin();
                d.run(`delete from ${table}`);
                var xx = d.campi(table, true);
                delete xx.rowid;
                var rr = [];
                var r1 = [];
                var r2 = {};
                for (var v in xx) {
                    if (!flds || flds[v]) {
                        rr.push(v);
                        r1.push('?');
                        r2[v] = _default(xx[v].t);
                    }
                }
                var sql = `insert into ${table} (${rr.join(',')}) values (${r1.join(',')})`;
                var sq = d.prepare(sql);
                for (var dx of data) {
                    r1 = [];
                    for (var r of rr) {
                        r1.push(dx[r] ? dx[r] : r2[r]);
                    }
                    sq.run(...r1);
                }
                d.commit();
            }
        }
        return d;
    },
    get mappe() {
        return mappe;
    },
    closeall() {
        mappe.forEach((d, name, map) => {
            if (d._idtran) d.run('commit');
            d._idtran = 0;
            d.close();
            mappe.delete(name);
        })

    }

}