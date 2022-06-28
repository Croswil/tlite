
const path=require("path");
const fs=require("fs");
var folder="/etc/nginx/sites-available"
var vv=fs.readdirSync(folder);
for (var v of vv) {
    if (v.length>0 && v!='default') {
        var data=fs.readFileSync(path.join(folder,v)).toString();
        var r1=/server_name\s*(.*);/gim.exec(data);
        if (r1) {
            var r2=/localhost:(\d+)/gim.exec(data);
            if (r2) {
                console.log(r1[1],r2[1]);
            }
        }
    }
}
