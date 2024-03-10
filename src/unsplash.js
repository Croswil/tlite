#!/usr/bin/env node

import fs from 'fs';
import sharp from 'sharp';
import minimist from 'minimist';
import { exec } from "child_process";
const Clear = "\x1Bc",
    Reset = "\x1b[0m",
    Bold = "\x1b[1m",
    Reverse = "\x1b[7m",
    Red = "\x1b[31m",
    Green = "\x1b[32m",
    Yellow = "\x1b[33m",
    Blue = "\x1b[34m",
    Magenta = "\x1b[35m",
    Cyan = "\x1b[36m",
    White = "\x1b[37m";

const INFO = `-------------------------------------------------------------
${Cyan}${Bold}tlite-unsplash${Reset} : getimage from unsplash (c) Croswil 2024 ${Yellow}${process.env.VERSION}${Reset}
-------------------------------------------------------------
Fa una query sul sito e ricava n. imagini che passa alla cartella <out>, in formato JPEG e JSON
es: ${Cyan}tlite-unsplash <query> -s 1000 -o images -n 10${Reset}  
${Green}Opzioni:${Reset}
-o, --output <path>        ${Green}Output folder: se non esiste viene creato, se non definito utilizza tmp${Reset}
-n, --numero <immagini>    ${Green}numero immagini da scaricare: (default = 1)${Reset}
-p, --pagina <pagina>      ${Green}serve per cercare una immagine successiva alle più visualizzate${Reset}
-l, --latest               ${Green}ordina la selezione dalle ultime caricate${Reset}
-c, --colore               ${Green}colori: black_and_white, black, white, yellow, orange, red, purple, magenta, green, teal, and blue${Reset}
-x, --orizzontale
-y, --verticale
-q, --quadrato
-s, --size <int>           ${Green}dimensione larghezza immagine in pixel ${Reset}
`


function esegui(comando) {
    return new Promise((resolve, reject) => {
        exec(comando, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else {
                resolve(stdout);
            }
        });
    });
}



var mi = minimist(process.argv);
if (mi._.length < 2 || mi.h || mi.help) {
    console.log(INFO);
    process.exit(0);
}
var op = mi;
async function main() {
    var outdir = (op.o || op.output) || `${(mi._[2] + '').replace(/[\.\\\/\s]/gi, '-')}` || 'out';
    var outfile2 = outdir.split('/').pop();
    if (fs.existsSync(outdir)) {
        console.log("cambia il percorso di output o cancella i dati!")
    } else {

        var query = encodeURIComponent(mi._[2]);
        if (query) {
            var out = [];

            //if (0) {
            var add = `https://api.unsplash.com/search/photos?query=${query}&page=${op.pagina || op.p || 1}&per_page=${op.numero || op.n || 1}&order_by=${op.latest ? 'latest' : 'relevant'}`
            if (op.color || op.c) add = `${add}&color=${op.color || op.c}`
            if (op.orizzontale || op.x) add = `${add}&orientation=landscape`;
            else if (op.verticale || op.y) add = `${add}&orientation=portrait`
            else if (op.quadrato || op.q) add = `${add}&orientation=squarish`
            console.log(add);
            var res = await esegui(`
                curl -H "Authorization: Client-ID I-u34HEOfOSp5jXxrnMnTQv26NRtxGNB_4MVvHkkmrs" "${add}"
            `);
            var json = JSON.parse(res);
            for (var x of json.results) {
                out.push({
                    id: x.id,
                    datacrea: x.created_at,
                    img: x.urls.full,
                    categories: x.categories,
                    likes: x.likes,
                    username: x.username,
                    nome: x.user.first_name,
                    cognome: x.user.last_name,
                    bio: x.user.bio,
                    location: x.user.location
                })
            }
            //          fs.writeFileSync("out.json", JSON.stringify(out, null, 2));
            //     } else {
            //        out = JSON.parse(fs.readFileSync("out.json"));

            //    }
            var xx = await esegui(`rm -rdf ${outdir}; mkdir ${outdir};mkdir ${outdir}/json ;mkdir ${outdir}/img; `);
            var ii = 0;
            for (var x of out) {
                ii++;

                var file = outfile2 + '_' + ('00000' + ii).slice(-4);
                console.log(file, x.img);
                fs.writeFileSync(`${outdir}/json/${file}.json`, JSON.stringify(x, null, 2));
                if (op.size || op.s) {
                    await esegui(`curl -H "Authorization: Client-ID I-u34HEOfOSp5jXxrnMnTQv26NRtxGNB_4MVvHkkmrs" "${x.img}" >out.jpeg`);
                    await sharp('out.jpeg')
                        .resize(parseInt(op.size || op.s) || 100)
                        .toFile(`${outdir}/img/${file}.jpeg`);
                    fs.unlinkSync(`out.jpeg`);
                } else {
                    await esegui(`curl -H "Authorization: Client-ID I-u34HEOfOSp5jXxrnMnTQv26NRtxGNB_4MVvHkkmrs" "${x.img}" >${outdir}/img/${file}.jpeg`);
                }

            }
        } else {
            console.log(`${Red}${Bold}Manca la query...${Reset}`);
        }
    }

}

main();