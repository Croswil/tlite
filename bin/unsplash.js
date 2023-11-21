#! /usr/local/bin/node
import readline from 'readline';
import path from 'path'
import fs from 'fs';
import sharp from 'sharp';
import argv from 'argv';
import { exec } from "child_process";
const Reset = "\x1b[0m", Bold = "\x1b[1m", Red = "\x1b[31m", Green = "\x1b[32m", Yellow = "\x1b[33m";

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


async function converti(basefile) {
    if (fs.existsSync(`${outdir}/${basefile}`)) return 0;
    var file = `${indir}/${basefile}`;
    try {
        await sharp(file)
            .resize(120)
            .toFile(`${outdir}/${basefile}`);
        return 1;

    } catch (error) {
        console.log(error.message, file);
        return 2;
    }

}

async function xmain() {
    esegui(`rm -rdf ${outdir}; mkdir ${outdir}`);
    var vv = fs.readdirSync(indir);
    for (var v of vv) {
        if (v.endsWith(".png")) {
            console.log(v);
            await converti(v);
        }
    }

}

argv.info(`unsplash : get image from unsplash 
Fa una query sul sito e ricava n. imagini che passa alla cartella <out>, in formato JPEG e JSON

unsplash <query> -s 1000 -o images -n 10  
`
)
argv.option([
    {
        name: 'output',
        short: 'o',
        type: 'path',
        description: 'Output folder: se non esiste viene creato, se non definito utilizza tmp',
    },
    {
        name: 'numero',
        short: 'n',
        type: 'int',
        description: `numero immagini da scaricare: (default = 1)`,
    },
    {
        name: 'pagina',
        short: 'p',
        type: 'int',
        description: `serve per cercare una immagine successiva alle più visualizzate`,
    },

    {
        name: 'latest',
        short: 'l',
        type: 'boolean',
        description: `ordina la selezione dalle ultime caricate `,
    },

    {
        name: 'colore',
        short: 'c',
        type: 'string',
        description: `colori: black_and_white, black, white, yellow, orange, red, purple, magenta, green, teal, and blue `,
    },
    {
        name: 'orizzontale',
        short: 'x',
        type: 'boolean',
    },
    {
        name: 'verticale',
        short: 'y',
        type: 'boolean',
    },
    {
        name: 'quadrato',
        short: 'q',
        type: 'boolean',
    },
    {
        name: 'size',
        short: 's',
        type: 'int',
        description: `dimensione larghezza immagine in pixel `,
    },

]);
argv.version('v1.0')

async function main() {
    var args = argv.run();
    var op = args.options;
    var outdir = op.output || `${(args.targets + '').replace(/[\.\\\/\s]/gi, '-')}` || 'out';
    var outfile2 = outdir.split('/').pop();
    if (fs.existsSync(outdir)) {
        console.log("cambia il percorso di output o cancella i dati!")
    } else {

        var query = encodeURIComponent(args.targets);
        if (query) {
            var out = [];

            //if (0) {
            var add = `https://api.unsplash.com/search/photos?query=${query}&page=${op.pagina || 1}&per_page=${op.numero || 1}&order_by=${op.latest ? 'latest' : 'relevant'}`
            if (op.color) add = `${add}&color=${op.color}`
            if (op.orizzontale) add = `${add}&orientation=landscape`;
            else if (op.verticale) add = `${add}&orientation=portrait`
            else if (op.quadrato) add = `${add}&orientation=squarish`
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
                if (op.size) {
                    await esegui(`curl -H "Authorization: Client-ID I-u34HEOfOSp5jXxrnMnTQv26NRtxGNB_4MVvHkkmrs" "${x.img}" >out.jpeg`);
                    await sharp('out.jpeg')
                        .resize(op.size)
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