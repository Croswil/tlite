#! /usr/local/bin/node
import fetch from "node-fetch";
import minimist from "minimist";
import fs from "fs";
import path from "path"
import os from "os";
const homeDirectory = os.homedir();

const filejson = path.join(homeDirectory, ".ssh", "porkbun.json");



const Reset = "\x1b[0m",
    Bold = "\x1b[1m",
    Reverse = "\x1b[7m",
    Red = "\x1b[31m",
    Green = "\x1b[32m",
    Yellow = "\x1b[33m",
    Blue = "\x1b[34m",
    Magenta = "\x1b[35m",
    Cyan = "\x1b[36m",
    White = "\x1b[37m";

class Post {
    constructor(url) {
        this.baseurl = url;
        this.token = undefined;
    }
    post(url, data) {
        var sc = this;
        return new Promise((resolve, reject) => {
            if (!/http[s]*:\/\//.test(url) && sc.baseurl) {
                url = sc.baseurl + url;
            }
            fetch(url, {
                method: "POST",
                mode: "cors",
                cache: "no-cache",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                },
                redirect: "follow",
                body: JSON.stringify(data),
            })
                .then(response => {
                    return response.json()
                })
                .then(d => {
                    resolve(d);
                })
                .catch(e => {
                    reject(e.message)
                })
        })
    }
}


async function ping() {
    var d = await post.post("ping", { secretapikey, apikey });
    console.log(d);
}
function printdomini(rr) {
    rr.forEach(e => {
        console.log(`${Reset}${e.type} ${Green}${(e.name + '                                     ').slice(0, 40)}${Yellow}${Bold} ${e.content}${Reset}  ${e.ttl}`);
    });
}

async function trova(domain, stampa = true, filtra = true) {
    var dd = await post.post(`dns/retrieve/${domain}`, { secretapikey, apikey });
    if (dd.status == 'ERROR') {
        throw new Error("ERRORE: " + dd.message);
    } else {
        var rr = filtra ? dd.records.filter(e => e.type == 'A' || e.type == 'CNAME') : dd.records
        if (stampa) printdomini(rr);
        return rr;
    }
}
async function cancellasubdomain(domain, subdomain) {
    if (!subdomain || subdomain === true) throw new Error("Posso cancellare solo i sottodomini")
    subdomain = subdomain == '_' ? '' : subdomain


    var dd = await post.post(`dns/deleteByNameType/${domain}/A/${subdomain}`, { secretapikey, apikey });
    console.log(dd);
    await trova(domain);

}

async function creasubdomain(domain, subdomain, ip) {
    subdomain = (subdomain || '').trim().toLowerCase();
    var dx = domain;
    if (subdomain) dx = subdomain + '.' + domain;
    if (!ip) throw new Error("Missing IP")
    var domini = await trova(domain, false)
    var d2 = domini.filter(e => {
        //console.log(`|${e.name}|${subdomain}|`);
        return (e.name || '').trim().toLowerCase() == dx
    });
    if (d2.length == 0) {
        var dd = await post.post(`dns/create/${domain}`,
            {
                secretapikey,
                apikey,
                name: subdomain == '_' ? '' : subdomain,
                type: "A",
                content: ip,
                ttl: "600"

            });
        console.log(dd);
    } else {
        var dd = await post.post(`dns/editByNameType/${domain}/A/${subdomain}`,
            {
                secretapikey,
                apikey,
                content: ip,
                ttl: "600"

            });
        console.log("EDIT", dd);
    }
    domini = await (trova(domain));
}

async function main() {
    try {

        switch (cmd) {
            case 'list':
            case 'lista':
                if (!op.dominio) {
                    console.log("il dominio è obbligatorio (parametro -d)")
                } else {
                    await trova(op.dominio, true, !op.all);
                }
                break;
            case 'crea':
            case 'create':
                if (!op.dominio) {
                    console.log("il dominio è obbligatorio (parametro -d)")
                } else if (!op.indirizzo) {
                    console.log('il campo  ip è obbligatorio');
                } else if (!op.subdominio) {
                    console.log('il sottodominio è obbligatorio');
                } else {
                    await creasubdomain(op.dominio, op.subdominio, op.indirizzo);
                }
                break;
            case 'cancella':
            case 'canc':
            case 'delete':
                if (!op.dominio) {
                    console.log("il dominio è obbligatorio (parametro -d)")
                } else if (!op.subdominio) {
                    console.log('il sottodominio è obbligatorio');
                } else {
                    await cancellasubdomain(op.dominio, op.subdominio);
                }

                break;
            default:
                console.log(INFO);
                console.log("inserisci un comando dopo `porkbun`:  list,create,delete");
                break;

        }
    } catch (error) {
        console.log(error.message);
    }

}


const INFO = `${Bold}${Green}porkbun${Reset} : Manage porkbun DNS 

${Green}porkbun${Red} [list,create,delete] ${Reset}-d ${Blue}<dominio>${Reset} -s ${Blue}<sottodominio>${Reset} -i ${Blue}<indirizzo>${Reset}   

${Bold}Options:${Reset}
   ${Green}-h, --help${Reset}              mostra l'help
   ${Green}-i,--indirizzo <data>${Reset}   indirizzo IP
   ${Green}-d,--dominio <data> ${Reset}    nome del dominio (es. appdelmobile.com)
   ${Green}-s,--subdominio <data> ${Reset} nome del sottodominio (es. www, o _ per vuoto)
   ${Green}-a,--all <data> ${Reset}        mostra tutti i record del DB (da usare con list)
`

const mi = minimist(process.argv);
const cmd = mi._[2];
const op = {
    dominio: mi.d || mi.dominio || '',
    indirizzo: mi.i || mi.indirizzo || '',
    subdominio: mi.s || mi.subdominio || '',
    all: mi.a || mi.all

}
if (!fs.existsSync(filejson)) {
    console.log(INFO)
    console.log(filejson);
    console.log(`${Reset}${Red}${Bold}ERRORE mancano le credenziali: porkbun.json`);
    process.exit(1);

}
var tm = JSON.parse(fs.readFileSync(filejson));
const { url, secretapikey, apikey } = tm;
if (op.h || op.help) {
    console.log(INFO);
    process.exit(0);
}

const post = new Post(url);
main();

