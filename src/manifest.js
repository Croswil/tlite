#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import minimist from 'minimist'
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
var R1 = 255, G1 = 255, B1 = 255, EX = 30;
const K = 255

const INFO = `-------------------------------------------------------------
${Cyan}${Bold}tlite-manifest${Reset} : multipourpose utility (c) Croswil 2024 ${Yellow}${process.env.VERSION}${Reset}
-------------------------------------------------------------
${Green}${Bold}Uso:${Reset}
tlite-manifest <appname> -m -i <imagefile> -c R,G,B -e [extend]  ${Green} Create a manifest.XML and folder for app  ${Reset}
tlite-manifest <sitename> -s                                     ${Green} Create sitemap.xml e robot.txt${Reset}
tlite-manifest <foldername> -w [size] [--delete] [--thumb] [-r]  ${Green} convert images in folder to webp (-d) delete original${Reset} 
tlite-manifest --env=[public,test,altro]                         ${Green} modifica il file .env per impostare il modo ${Reset}
tlite-manifest --help
`
var mi = minimist(process.argv);
if (mi.h || mi.help) {
    console.log(INFO);
    process.exit(0);
}
var op = mi;
async function createmanifest() {
    async function createmanifestimages(file) {

        var { data, info } = await sharp(file).ensureAlpha(1).trim()
            .extend({
                top: EX,
                bottom: EX,
                left: EX,
                right: EX,
                background: { r: R1, g: G1, b: B1, alpha: 255 }
            })
            .raw().toBuffer({ resolveWithObject: true });
        const { width, height, channels } = info;
        const pp = new Uint8ClampedArray(data.buffer);
        for (var i = 0; i < pp.length; i += 4) {
            var r = pp[i];
            var g = pp[i + 1];
            var b = pp[i + 2];
            if (i == 0) console.log(r, g, b);

            var k = Math.abs(r - R1) + Math.abs(g - G1) + Math.abs(b - B1);
            if (k < K) {
                pp[i + 3] = Math.floor((k / K) * 255)
            } else {
                pp[i + 3] = 255;
            }
        }
        var w = info.width < info.height ? info.width : info.height;

        var img = await sharp(pp, { raw: { width, height, channels } })
            .extract({
                left: Math.floor((info.width - w) / 2),
                top: Math.floor((info.height - w) / 2),
                width: w,
                height: w
            }).png()
        for (var sz of [512, 192, 180, 152, 120, 76, 60, 32, 16])
            await img.resize(sz).toFile(`icons/${sz}x${sz}.png`);

    }

    var file = mi._[2] || 'programma'

    if (op.c || op.colore) {
        var x1 = (op.c || op.colore).split(',');
        console.log(x1);
        R1 = parseInt(x1[0] || 0);
        G1 = parseInt(x1[1] || 0);
        B1 = parseInt(x1[2] || 0);
    }
    if ((op.estendi || op.e)) {
        EX = parseInt(op.estendi || op.e || 0)
    }
    var image = op.i || op.image || 'image.jpeg';
    if (!/\.jpe*g$/.test(image)) {
        console.log("starting file must be JPEG or JPG", image)
    } else if (!fs.existsSync(image)) {
        console.log(`file immagine mancante (parametro -i)`)
    } else {

        console.log(`Creating files`)

        if (!fs.existsSync("icons")) fs.mkdirSync("icons");
        fs.writeFileSync("manifest.json",
            `
{
  "name": "${file}",
  "short_name": "${file}",
  "theme_color": "#FFC883",
  "icons": [
      {
        "src": "./icons/16x16.png",
        "sizes": "16x16",
        "type": "image/png"
      },
      {
        "src": "./icons/32x32.png",
        "sizes": "32x32",
        "type": "image/png"
      },
      {
        "src": "./icons/60x60.png",
        "sizes": "60x60",
        "type": "image/png"
      },
      {
        "src": "./icons/76x76.png",
        "sizes": "76x76",
        "type": "image/png"
      },
      {
        "src": "./icons/120x120.png",
        "sizes": "120x120",
        "type": "image/png"
      },
      {
        "src": "./icons/152x152.png",
        "sizes": "152x152",
        "type": "image/png"
      },
      {
        "src": "./icons/180x180.png",
        "sizes": "180x180",
        "type": "image/png"
      },
      {
          "src": "./icons/192x192.png",
          "sizes": "192x192",
          "type": "image/png"
      },
      {
          "src": "./icons/512x512.png",
          "sizes": "512x512",
          "type": "image/png"
      },
      {
          "src": "./icons/192x192.png",
          "sizes": "192x192",
          "type": "image/png",
          "purpose": "maskable"
      },
      {
          "src": "./icons/512x512.png",
          "sizes": "512x512",
          "type": "image/png",
          "purpose": "maskable"
      }
  ],
  "start_url": ".",
  "display": "standalone",
  "background_color": "#000000",
  "scope": "/",
  "description": "${file}"
}
`)

        await createmanifestimages(image);
    }
}

function createsitemap() {
    var site = args?.targets[0]
    const folder = "build/client/_app/immutable/components/pages"
    if (!site) {
        console.log("** unable to create sitemap: website name is required");
    } else if (!fs.existsSync(folder)) {
        console.log("** unable to create sitemap: missing folder " + folder);
    } else {
        var pat = [];
        function parsefolder(f2, basef) {
            if (basef.indexOf("_") < 0 && !/^login\//.test(basef)) {
                pat.push(basef);
                var aa = fs.readdirSync(f2);
                for (var a of aa) {
                    var f1 = `${f2}/${a}`
                    if (fs.lstatSync(f1).isDirectory()) {
                        parsefolder(f1, `${basef}/${a}`)
                    }
                }
            }

        }
        parsefolder(folder, '');
        pat = pat.sort();
        var dd = new Date();
        var d = dd.getDate();
        var m = dd.getMonth() + 1;
        var y = dd.getFullYear()
        var dx = `${y}-${('0' + m).slice(-2)}-${('0' + d).slice(-2)}`
        var vv = [];
        vv.push(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`);
        for (var p of pat) {
            vv.push(`   <url>
      <loc>${site}${p}</loc>
      <lastmod>${dx}</lastmod>
      <changefreq>monthly</changefreq>
      <priority>${p == '/' ? '1.0' : '0.8'}</priority>
   </url>`)
        }
        vv.push('</urlset>');
        fs.writeFileSync("sitemap.xml", vv.join('\n'));
        console.log("written: sitemap.xml");
        fs.writeFileSync('robots.txt', `User-agent: *
Allow: /

Sitemap: ${site}/sitemap.xml`);

    }
}
async function parseimages() {
    const folders = args?.targets;
    var size = parseInt(op.w || op.webp) || 0;

    async function parseimage(folder, file, ext) {
        var img = sharp(`${folder}/${file}.${ext}`)
        var info = await img.metadata();
        if (size > 0 && (info.width > size || info.height > size)) {
            if (info.width > info.height) {
                await img.resize(size).webp({ quality: 80 }).toFile(`${folder}/${file}${(op.thumb || op.t) ? '_' + size : ''}.webp`)
            } else {
                await img.resize(Math.floor(size * info.width / info.height)).webp({ quality: 80 }).toFile(`${folder}/${file}${(op.thumb || op.t) ? '_' + size : ''}.webp`)
            }

        } else {
            await img.webp({ quality: 80 }).toFile(`${folder}/${file}.webp`)
        }
        if (op.delete || op.d) fs.unlinkSync(`${folder}/${file}.${ext}`);
        console.log(`${folder}/${file}.webp`);
    }
    async function elaborafolder(f) {
        var aa = fs.readdirSync(f);
        for (var a of aa) {
            var f1 = `${f}/${a}`
            if (fs.lstatSync(f1).isDirectory() && (op.r || op.recursive)) {
                await elaborafolder(f1);
            } else {
                // console.log(a);
                var rr = /^(.*?)\.(png|jpeg|jpg)$/im.exec(a);
                if (rr) {
                    await parseimage(f, rr[1], rr[2]);
                }
            }
        }
    }

    if (folders) {
        for (var f of folders) {
            await elaborafolder(f);

        }
    }
}
function modificaenv(mode) {
    var fl = 0;
    mode = (mode || '').trim();
    const modes = ['public', 'test', 'altro'];

    if (modes.includes(mode)) {
        if (fs.existsSync(".env")) {
            var vv = fs.readFileSync(".env").toString().split('\n');
            var mx = modes.filter(e => e != mode).join('|')
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
            console.log("ATTIVATO: ", mode);

        } else {
            console.log("file .env not found");
        }


    } else {
        console.log("modo non valido", mode);
    }


}

if (op.manifest || op.m) createmanifest();
else if (op.env) modificaenv(op.env);
else if (op.sitemap || op.s) createsitemap()
else if (op.w || op.webp) parseimages();
else {
    console.log(INFO);
}







