var fs = require('fs');
var dir = '/root/camera/';

var files = fs.readdirSync(dir),
	saveDir = files[files.length-1];
files = fs.readdirSync(dir + '/' + saveDir);

console.log(files[files.length-1]);
