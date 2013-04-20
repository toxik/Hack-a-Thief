var firmata = require('firmata'),
    express = require('express'),
    board	= new firmata.Board('/dev/ttyUSB0', configBoard),
    app		= express.createServer(),

    // camera vars
    camOX 	= 0,	camOY	= 0,
    camDX	= 90,	camDY	= 90,	incr	= 2,

    // wheels vars
    WH1		= 0,	WHD1	= 0,	WH1PWR	= 0,
    WH2		= 0,	WHD2	= 0,	WH1PWR	= 0,

    // sonar vars
    SON1	= 0,	SON2	= 0,	SON_INT	= 250,
    sampl1	= [],	sampl2	= [],	
    SON1LST	= null,	SON2LST	= null;

function configBoard(err) {
	if (err) {
		console.log(err);
		return;
	}
}

app.configure(function(){
	// we don't want any parsing
	app.set("view options", { layout: false });
	app.use("/static", express.static("static"));
	app.register(".html", {
		compile: function(str) {
			return function() { return str; }
		}
	});
	app.get("/", function(req, res) {
		res.render("views/index.html");
	});
	app.listen(8080);
});

