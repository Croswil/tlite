#! /usr/local/bin/node
import readline from 'readline';
import path from 'path'
import fs from 'fs';
import sharp from 'sharp';
import { init } from 'liburno_lib'
import { exec } from "child_process";
import minimist from 'minimist'
const { Reset, Bold, Reverse, Red, Green, Yellow, Blue, Magenta, Cyan, White } = init();






const INFO = `${Bold}unsplash${Reset} :             Query images from unsplash (c) Croswil 2023 v1.1
${Bold}Uso: ${Green}unsplash <query> <flags> ${Reset}   

${Bold}flags:${Reset}
   ${Green}-h, --help${Reset}              mostra l'help
   ${Green}-o, --output${Reset} <folder>   cartella di outputmodo sul file .env [public,test,altro]   
   ${Green}-n, --numero${Reset} <n>        numero immagini da scaricare: (default = 1)  
   ${Green}-p, --pagina${Reset} <p>        serve per cercare una immagine successiva alle più visualizzate (default = 0)  
   ${Green}-l, --latest${Reset}            ordina la selezione dalle ultime caricate
   ${Green}-c, --colore${Reset} <c>        colori: black_and_white, black, white, yellow, orange, red, purple, magenta, green, teal, and blue  
   ${Green}-x, --orizzontale${Reset}       Orizzontale  
   ${Green}-y, --verticale${Reset}         Verticale  
   ${Green}-q, --quadrato${Reset}          Immagine Quadrata
   ${Green}-s, --size${Reset} <s>          Dimensione X immagine   
`
const mi = minimist(process.argv);

if (mi._.length == 0 || mi.h || mi.help) {
    console.log(INFO);
    process.exit(0);

}


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


async function main() {
    var outdir = mi.o || mi.output || 'out';

    var outfile2 = outdir.split('/').pop();
    if (fs.existsSync(outdir)) {
        console.log("cambia il percorso di output o cancella i dati!")
    } else {
        console.log("QUERY:", mi._[2]);
        var query = encodeURIComponent(mi._[2]);
        if (query) {
            var out = [];
            const pagina = mi.p || mi.pagina || 1;
            const numero = mi.n || mi.numero || 1;
            //if (0) {
            var add = `https://api.unsplash.com/search/photos?query=${query}&page=${pagina}&per_page=${numero}&order_by=${mi.latest || mi.l ? 'latest' : 'relevant'}`

            if (mi.color || mi.c) add = `${add}&color=${mi.c || mi.color}`
            if (mi.orizzontale || mi.x) add = `${add}&orientation=landscape`;
            else if (mi.verticale || mi.y) add = `${add}&orientation=portrait`
            else if (mi.quadrato || mi.q) add = `${add}&orientation=squarish`
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
                if (parseInt(mi.s || mi.size)) {
                    await esegui(`curl -H "Authorization: Client-ID I-u34HEOfOSp5jXxrnMnTQv26NRtxGNB_4MVvHkkmrs" "${x.img}" >out.jpeg`);
                    await sharp('out.jpeg')
                        .resize(parseInt(mi.s || mi.size))
                        .toFile(`${outdir}/img/${file}.jpeg`);
                    fs.unlinkSync(`out.jpeg`);
                } else {
                    await esegui(`curl -H "Authorization: Client-ID I-u34HEOfOSp5jXxrnMnTQv26NRtxGNB_4MVvHkkmrs" "${x.img}" >${outdir}/img/${file}.jpeg`);
                }

            }
        } else {
            console.log(INFO);
            console.log(`\n${Red}${Bold}Manca la query...${Reset}`);
        }
    }

}

main();