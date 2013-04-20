var fs = require('fs');
var dir = '/root/camera/';
fs.readdir(dir, function(err, files) {
	//console.log(dir + '/' + files[files.length-1]);
	var saveDir = files[files.length-1];
	fs.readdir(dir + '/' + saveDir, function(err, files) {
		console.log(files, files[files.length-1]);
	});
});
