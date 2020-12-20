




function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}
String.prototype.replaceAll = function (find, replace) {
    var str = this || '';
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
};

if (!String.prototype.splitComma) {
    String.prototype.splitComma = function () {
        var str = this || ''
        return str.split(/[;,]+/)
    }
}
if (!String.prototype.lines)
    String.prototype.lines = function () {
        return (this || '').split(/[\r\n]+/);
    }

if (!String.prototype.vsplit)
    String.prototype.vsplit = function (sep) {
        var str = (this || '').split('');
        var fl = 0;
        var fl1 = 0;
        flh = null;
        var res = [];
        var r = []
        for (var c of str) {
            if (c == '\\') {
                fl1 = true
                r.push(c);
            } else {
                if (flh == null && /[\{\(\]]/.test(c)) {
                    fl++;
                    r.push(c);
                } else if (flh == null && /[\}\)\}]/.test(c)) {
                    fl--
                    r.push(c);
                } else if (flh == null && fl == 0 && /["'`]/.test(c)) {
                    flh = c;
                    r.push(c);
                } else if (c == flh) {
                    r.push(c);
                    flh = null;
                } else if (c == sep && flh == null && fl1 == 0 && fl == 0) {
                    res.push(r.join(''))
                    r = []
                } else {
                    r.push(c);
                }
                fl1 = false;
            }
        }
        if (r.length) res.push(r.join(''));
        return res;
    }





if (!Math.rnd) {
    Math.rnd = function (min, max) {
        if (!min) min = 0;
        if (!max) max = 1000;
        return Math.floor((Math.random() * (max - min + 1)) + min);
    }
}

// string base prototype
if (!String.prototype.var) {
    String.prototype.var = function (name, sep) {
        if (!sep) sep = ';';
        if (name) {
            name = name.toLowerCase();
            var v = this.split(sep);

            for (var i = 0; i < v.length; i++) {
                var q = v[i].indexOf('=');
                if (q > 0) {
                    var n = v[i].substr(0, q).toLowerCase();
                    if (n == name) {
                        return v[i].substr(q + 1, 9999);
                    }
                }
            }
        }
        return '';
    };
}


if (!String.prototype.setvar) {
    String.prototype.setvar = function (name, value, sep) {
        if (!sep) sep = ';';
        if (name) {
            name = name.toUpperCase();
            var v = this.split(sep);
            for (var i = 0; i < v.length; i++) {
                var q = v[i].indexOf('=');
                if (q > 0) {
                    var n = v[i].substr(0, q).toUpperCase();
                    if (n == name) {
                        if (value) {
                            v[i] = name + '=' + value;
                        } else {
                            v.splice(i, 1);
                        }
                        return v.join(sep);

                    }
                }
            }
        }
        if (value)
            return this + sep + name + "=" + value;
        return this;
    };
}
if (!String.prototype.ex) {
    String.prototype.ex = function (sep, id, mode) {
        if (id > 0) {
            if (!mode) {
                return this.split(sep)[id - 1] || '';
            } else {
                var v = this.split(sep).splice(id - 1, 9999)
                if (v) return v.join(sep);
            }
        }
        return '';
    }
}
if (!String.prototype.insert) {
    String.prototype.insert = function (insert, sep, pos) {
        if (insert == 0) insert = '0';
        else insert = insert || '';
        pos--;
        if (pos < 0) return this;
        v = this.split(sep);
        for (i = v.length; i <= pos; i++) v.push('');
        v[pos] = insert;
        return v.join(sep);
    }
}

if (!String.prototype.trim) {
    String.prototype.trim = function () {
        return this.replace(/^\s+|\s+$/g, '');
    };
};
if (!String.prototype.toTitleCase)
    String.prototype.toTitleCase = function (str) {
        var str = this || '';
        return str.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
    };

if (!String.prototype.leggiFileTesto)
    String.prototype.leggiFileTesto = function () {
        var ff = this + '';
        if (fs.existsSync(ff)) {
            var aa = fs.readFileSync(ff, { encoding: 'utf8' })
            // unicode read by windows
            if (aa.length > 0 && aa.charCodeAt(0) > 60000) {
                aa = aa.substr(1);
            }
            return aa;

        }
        return "";
    }
if (!String.prototype.scriviFileTesto)
    String.prototype.scriviFileTesto = function (content) {
        var ff = this + '';
        fs.writeFileSync(ff, content);
        return this;
    }

if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (searchString, position) {
        position = position || 0;
        return this.indexOf(searchString, position) === position;
    };
}

if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (item) {
        var i = this.length;
        while (i--) {
            if (this[i] === item) return i;
        }
        return -1;
    };
}


if (!Date.prototype.toInt) {
    Date.prototype.toInt = function () {
        var xx = this;
        return xx.getDate() + (xx.getMonth() + 1) * 100 + xx.getFullYear() * 10000;
    }
}
if (!Date.prototype.toFloat) {
    Date.prototype.toFloat = function () {
        return this.getDate() + (this.getMonth() + 1) * 100 + this.getFullYear() * 10000 + this.getHours() * 0.01 + this.getMinutes() * 0.0001 + Math.floor(this.getSeconds()) * 0.000001;
    }
}
if (!Date.prototype.toStringa)
    Date.prototype.toStringa = function (data = true, ora = false, secondi = true) {
        function pad(s) { return (s < 10) ? '0' + s : s; }
        var d = this;
        var ret = ""
        if (data) {
            ret = [pad(d.getDate()), pad(d.getMonth() + 1), d.getFullYear()].join('/')
        }
        if (ora) {
            if (ret) ret += ' ';
            if (secondi) {
                ret = ret + [pad(d.getHours()), pad(d.getMinutes()), pad(d.getSeconds())].join(':');
            } else {
                ret = ret + [pad(d.getHours()), pad(d.getMinutes())].join(':');
            }
        }
        return ret;

    }

Date.prototype.toString = Date.prototype.toStringa // porcata, ma non mi piace la funzione std
// ---------------------------------------------------------------------------------------------------------------------------------------------
//                          news for backend compatibility 
// ---------------------------------------------------------------------------------------------------------------------------------------------

if (!String.prototype.dformat)
    String.prototype.dformat = function (...pars) {
        return this.replace(/\{[0-9]+\}/g, x => {
            let q = Number(x.match(/[0-9]+/));
            if (q >= 0 && q < pars.length) {
                return (pars[q] + '');
            }
            return ""

        })
    }
if (!String.prototype.toNum)
    String.prototype.toNum = function () {
        if (this) {
            let x = this.match(/-?[0-9.]+/g);
            if (x && x.length > 0) {
                let n = Number(x[0]);
                return isNaN(n) ? 0 : n;
            }
        }
        return 0;
    }
if (!Number.prototype.toDate)
    Number.prototype.toDate = function () {
        var xx = this.valueOf() + 0;
        var x1 = Math.floor(xx);
        var x2 = Math.floor((xx - x1) * 1000000);
        d = x1 % 100; if (d < 1) d = 1;
        x1 = Math.floor(x1 / 100);
        m = x1 % 100; if (m < 1) m = 1;
        y = Math.floor(x1 / 100); if (y < 2000) y = 2000
        ss = x2 % 100;
        x2 = Math.floor(x2 / 100);
        mm = x2 % 100;
        hh = Math.floor(x2 / 100);
        return new Date(y, m - 1, d, hh + 1, mm, ss);
    }
if (!Number.prototype.toNum)
    Number.prototype.toNum = () => {
        return Number(this) || 0
    };
if (!String.prototype.md5)
    String.prototype.md5 = function () {
        return crypto.createHash('md5').update(this + '').digest("hex");
    }

if (!String.prototype.encrypt)
    String.prototype.encrypt = function (password) {
        let ENCRYPTION_KEY = Buffer.from((password + __pad).substr(0, 32))
        let cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, IV);
        let encrypted = cipher.update(this + '');
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return encrypted.toString('hex');
    }
if (!String.prototype.decrypt)
    String.prototype.decrypt = function (password) {
        let ENCRYPTION_KEY = Buffer.from((password + __pad).substr(0, 32))
        let encryptedText = Buffer.from(this + '', 'hex');
        let decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, IV);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    }

String.prototype.in = function (dd) {
    var str = (this || '')
    if (typeof (dd) == 'string') dd = dd.splitComma();
    if (dd instanceof Array) {
        for (var d of dd) {
            if (str == d) return true;
        }
    }
    return false;
}
