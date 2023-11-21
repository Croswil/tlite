#! /usr/local/bin/node
import fs from "fs";
import path from "path";
import { init, B } from "liburno_lib";
import argv from 'argv';
import YAML from 'yaml'


const INFO = `parseenv : Utility multiscopo per siti ERP Croswil 2023 v1.1
parseenv -m mode # modifica il file di configurazione per gestione locale e remota  
parseenv --help
`
argv.info(INFO)
argv.option([
    {
        name: 'mode',
        short: 'm',
        type: 'string',
        description: 'modo sul file .env [public,test,altro]',
    },
    {
        name: 'dbapp',
        short: 'd',
        type: 'boolean',
        description: 'Crea il file dbapp',
    },
    {
        name: 'route',
        short: 'r',
        type: 'boolean',
        description: 'Crea routing',
    },
])
function parsetree(dd, callback, padre, liv) {
    var i = 0;
    if (!liv) liv = 0;
    for (var d of dd) {
        if (callback) callback(d, padre, i)
        i++
        if (d.data) parsetree(d.data, callback, d, liv + 1);
    }
}

function allineastr(str, lunghezza) {
    if (str.length > lunghezza) {
        return str.substring(0, lunghezza);
    } else {
        return str.padEnd(lunghezza, ' ');
    }
}

init();
const args = argv.run();
const op = args.options;
var fl = 0;
const modes = ['public', 'test', 'altro'];
// parse env mode 
if (op.mode && modes.includes(op.mode)) {
    if (fs.existsSync(".env")) {
        var vv = fs.readFileSync(".env").toString().split('\n');
        var mx = modes.filter(e => e != op.mode).join('|')
        var rr = new RegExp(`^##\\s*(${mx})\\s*$`, "im");
        var out = [];
        for (var v of vv) {
            if (/^##\s*/.test(v)) {
                fl = 0
            }
            if (rr.test(v)) {
                fl = 1;
            } else if (v && v.indexOf('=') > 0) {
                v = v.replace(/^\s*x_/, "");
                if (fl) {
                    v = "x_" + v.trim();
                }
            }
            out.push(v);
        }
        fs.writeFileSync(".env", out.join('\n'));
        console.log("ATTIVATO: ", op.mode);

    } else {
        console.log("file .env not found");
    }
} else if (op.dbapp) {
    function getfromfolder(folder) {
        var ctl = {};
        var ric = {};
        var dd = fs.readdirSync(folder);
        dd = dd.filter(e => e.slice(-5) == '.yaml');
        var data = [];
        for (var d of dd) {
            var tm = fs.readFileSync(`${folder}/${d}`).toString()
            if (tm.startsWith('#!db')) {
                data.push(tm);
            }
        }
        data = data.join('\n\n');

        var d2 = YAML.parse(data);
        for (var d in d2) {
            var d1 = d2[d];
            var ff = [], fl = false;
            for (var f in d1) {
                if (f && !f.startsWith('__')) {
                    if (f == 'rowid' || f == 'id') {
                        delete (d1[f]);
                    } else if (d1[f]) {
                        var v = d1[f].split(',');
                        var fld = (v[0] || '').toLowerCase().trim();
                        if (v.length > 0 && (v[1] || v[2] || v[3])) {
                            if (!v[1]) v[1] = f;
                            var tx = { cod: (f[0] == '?' ? f.slice(1) : f), des: v[1] }
                            if (v[2]) tx.type = v[2] || ''
                            if (parseInt(v[3])) tx.visible = true;
                            if (parseInt(v[3]) == 1 && f[0] != '?') tx.sort = true;
                            fl = true;
                            ff.push(tx);

                        }
                        if (f[0] != '?') {
                            d1[f] = fld;
                        } else {
                            delete (d1[f]);
                        }
                    }
                }
            }
            if (fl) {
                filtri[d] = ff;
            }
        }
        return d2;
    }
    const folder = 'dbdef';
    if (!fs.existsSync(folder)) {
        console.log("folder dbdef not found");
        process.exit(1);
    }
    var res = {}
    var filtri = {};
    var vv = fs.readdirSync(folder);
    for (var v of vv) {
        var f = `${folder}/${v}`
        if (fs.statSync(f).isDirectory()) {
            console.log(v);
            res[v] = getfromfolder(f, filtri)
        }
    }
    console.log("tables");
    res.tables = getfromfolder(folder, filtri);
    console.log("filtri");
    res.filtri = filtri;
    fs.writeFileSync("dbapp.json", JSON.stringify(res, null, 2));
    console.log("creato: dbapp.json");
} else if (op.route) {
    var sicon = new Set();
    var checkicon = (name) => {
        name = (name || '').trim(); if (name && !sicon.has(name)) sicon.add(name)
    }

    const mappa = "dbdef"
    var file = `${mappa}/mappa.tpl`;
    if (!fs.existsSync(file)) {
        console.log(`file ${file} not found`);
        process.exit(1);
    }
    var ismenu = fs.existsSync('md') && fs.existsSync('md/menu.json') && fs.existsSync('md/menumain.json');
    var menu = [], menumain = [];
    var links = {}
    if (ismenu) {
        menu = JSON.parse(fs.readFileSync("md/menu.json"))
        menumain = JSON.parse(fs.readFileSync('md/menumain.json'))
    }

    var vars = {
        _root: ['']
    }
    var kk = '.'
    if (fs.existsSync(file)) {
        var vv = fs.readFileSync(file).toString().replaceAll('\r', '\n').split('\n');
        for (var v1 of vv) {
            var v = v1.split("//")[0].trim();
            if (v.length > 0) {
                var rr = /^\s*\[(\w+)\]\s*$/gim.exec(v)
                if (rr) {
                    kk = rr[1];
                } else {
                    if (!vars[kk]) vars[kk] = []
                    vars[kk].push(v);

                }
            }
        }
    }

    var pagesv = fs.readFileSync(`${mappa}/+page.svelte.tpl`).toString();
    var pagejs = fs.readFileSync(`${mappa}/+page.js.tpl`).toString();

    const basefolder = 'src/routes';
    var cl = [];
    var cl2 = [];
    var keys = {};
    B.creaCartella(basefolder);
    for (var v1 of vars._root) {
        var vx = v1.split('=');
        var v2 = (vx[1] || '').split([',']);
        var v = vx[0].trim();

        var tm = (v2[2] || '').trim().toLowerCase();
        var v3 = tm.split(';');
        for (var x of v3) if (x && !keys[x]) keys[x] = 1;
        var auth = (v2[1] || '').trim().toLowerCase();;
        if (v) {
            cl.push(`   "${v}" : { level: ${parseInt(v2[0]) || 0}, auth: "${auth}" ${tm ? ', doc: "' + tm + '"' : ''} }`);
        }

        var auth = v2[1];
        //if (links[v]) auth = links[v].auth

        if (ismenu) {
            function setauthmenu(m, v, auth) {
                var { match, auth } = resolve(v, m.link, auth);
                if (match) {
                    m.auth = (auth || '').trim();
                    m.op = 1;
                }
            }
            parsetree(menu, m => setauthmenu(m, v, auth));
            parsetree(menumain, m => setauthmenu(m, v, auth));
        }

        var vy = v.split('/').pop() + '/';

        var ff = path.join(basefolder, v);
        B.creaCartella(ff);
        var fsv = path.join(ff, '+page.svelte');
        var fjs = path.join(ff, '+page.js');
        var isparam = /\[(\w+)\]/gim.test(v);
        var sv = pagesv;
        var js = pagejs;
        if (!fs.existsSync(fsv)) {
            // scrive il file +page.svelte   
            console.log(fsv);
            sv = sv.replaceAll("##pat0##", vy);
            sv = sv.replaceAll("##pat##", v);
            if (isparam) {
                sv = sv.replaceAll("##data##", "export let data");
                sv = sv.replaceAll("##jdata##", `
                <div class="text-sm mt-5">
                    <Json value={data} open />
                </div>`);
            } else {
                sv = sv.replaceAll("##data##", "");
                sv = sv.replaceAll("##jdata##", "");
            }
            fs.writeFileSync(fsv, sv);
        }
        if (isparam) {
            if (!fs.existsSync(fjs)) {
                fs.writeFileSync(fjs, `${js}`);
            }
        }
    }
    for (var v1 of vars._spec) {
        var vx = v1.split('=');
        var v2 = (vx[1] || '').trim();
        var v = vx[0].trim();
        if (v && v2) {
            cl2.push(`{ k: "${v}",doc: "${v2}" } `);
        }
    }
    function geticons(folder) {
        var files = fs.readdirSync(folder);
        for (var f of files) {
            var fp = path.join(folder, f);
            if (fp.endsWith('.svelte')) {
                var vv = fs.readFileSync(path.join(folder, f)).toString().replaceAll('\n', ' ').toString();
                for (; ;) {
                    var rr = /<(Bicon|BtnIcon|Icon)\s.*?img="(\w+)"/gim.exec(vv);
                    if (rr) {
                        checkicon(rr[2]);
                        vv = vv.substr(rr.index + rr[0].length);
                    } else {
                        break
                    }
                }
            } else {
                const stat = fs.statSync(fp);
                if (stat.isDirectory()) {
                    geticons(fp);
                }
            }
        }
    }
    geticons('src');
    var icons = [...sicon];
    icons.sort();
    console.log("menu", ismenu);
    if (ismenu) {
        var links = {};
        function cleantree(m) {
            if (m.auth) {
                var a = m.auth;
                var i = a.indexOf(';');
                if (i >= 0) a = a.slice(i + 1).trim();
                if (!links[a]) links[a] = m.name || m.des || m.link
            }
            if (m.op) {
                delete m.op;
            } else if (m.link) {
                m.auth = ''
            }
        }

        parsetree(menu, m => cleantree(m))
        parsetree(menumain, m => cleantree(m))
        fs.writeFileSync("md/menu.json", JSON.stringify(menu, null, 2))
        fs.writeFileSync("md/menumain.json", JSON.stringify(menumain, null, 2))
        fs.writeFileSync("md/linkmain.json", JSON.stringify(links, null, 2))


    }

    B.creaCartella("src/lib");
    fs.writeFileSync("src/lib/abauto.js", `// **** AUTOGENERATO DA parseenv -r : variabili e autorizzazioni per il routing ****

export const abauto={
   ${cl.join(',\n   ')}
};

export const abextra=[
   ${cl2.join(',\n   ')}
]
    
export const dockeys=[
   "${Object.keys(keys).sort().join('\",\n   \"')}"
]
    
export const sicons=[\n   "${icons.join('",\n   "')}"\n]`);

} else {
    console.log(INFO);
    console.log('wrong options');
}

function resolve(p1, p2, auth) {
    auth = auth || ''
    var match = false;
    if (p1 && p2) {
        var v1 = p1.trim().toLowerCase().split('/');
        var v2 = p2.trim().toLowerCase().split('/');
        if (v1.length == v2.length) {
            match = true
            for (var i = 1; i < v1.length; i++) {
                if (v1[i].startsWith('[') || v1[i] == v2[i]) {
                    auth = auth.replace(`$${i - 1}`, v2[i]);
                } else {
                    match = false;
                    break;
                }
            }
        }
    }
    return { match, auth }
}
