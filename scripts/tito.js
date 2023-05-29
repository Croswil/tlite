let args=process.argv;
args.splice(0,2);
args=args.join(' ');
console.log("POSTINSTALL");
console.log("============");

console.log("args:",args)
//console.log("working dir:",__dirname);
console.log("curdir:",process.env.INIT_CWD);

