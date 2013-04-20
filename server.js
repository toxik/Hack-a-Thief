var firmata = require('firmata'),
    express = require('express'),
    board	= new firmata.Board('/dev/ttyUSB0', configBoard),
    app		= express.createServer(),
    io		= require('socket.io').listen(app);

    // camera vars
    camOX 	= 0,	camOY	= 0,
    camDX	= 90,	camDY	= 90,	incr	= 2,

    // wheels vars
    WH1		= 0,	WHD1	= 0,	WH1PWR	= 0,
    WH2		= 0,	WHD2	= 0,	WH1PWR	= 0,

    // hook vars
    HK 		= 0,	HKMIN	= 90,	HKMAX	= 180, HKCURR = 90, HKINCR = 5, HKDIR = 1,

    // sonar vars
    SON1	= 0,	SON2	= 0,	SONINT	= 250,
    SONSPL1	= [],	SONSPL2	= [],	
    SON1LST	= null,	SON2LST	= null;

function configBoard(err) {
	if (err) {
		console.log(err);
		return;
	}

	try {
		board.pinMode(camOX,	board.MODES.SERVO);
		board.pinMode(camOY,	board.MODES.SERVO);
		board.servoWrite(camOX, camDX);
		board.servoWrite(camOY, camDY);

		board.pinMode(HK,		board.MODES.SERVO);
		board.servoWrite(HK,	HKCURR);

		board.pinMode(WHD1, 	board.MODES.OUTPUT);
		board.pinMode(WHD1, 	board.MODES.OUTPUT);
		board.pinMode(WH1, 		board.MODES.PWM);
		board.pinMode(WH2, 		board.MODES.PWM);

		board.pinMode(SON1, 	board.MODES.ANALOG);
		board.analogRead(SON1,  function (data) { SONSPL1.push( parseInt(data) ); });
		board.pinMode(SON2,		board.MODES.ANALOG);
		board.analogRead(SON1,  function (data) { SONSPL2.push( parseInt(data) ); });

		console.log('Arduino board configured and ready for action.');
	} catch (e) {
		console.log('Eroare la configurarea arduino AKA ai bagat bine pinii, mah ?!', e);
	}
}

// throttle sonars
setInterval(function() {
  if ( SONSPL1.length === 0 && SONSPL2.length === 0 ) {
    // nothing to do here
    return;
}
var medie1 = 0, medie2 = 0, i = 0;
  for (i = 0; i < SONSPL1.length; i++) { medie1 += SONSPL1[i] }
  for (i = 0; i < SONSPL2.length; i++) { medie2 += SONSPL2[i] }
  medie1 = parseInt( medie1 / SONSPL1.length );
  medie2 = parseInt( medie2 / SONSPL2.length );
  if (SON1LST !== medie1 || SON2LST !== medie2) {
    SON1LST = medie1;
    SON2LST = medie2;
    onSonarChange({ left: medie1, right: medie2 });
  }

  SONSPL1.length = 0;
  SONSPL2.length = 0;

}, SONINT);

function onSonarChange(son) {
	console.log(son);
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
		res.render("index.html");
	});
	app.listen(80);
	io.set('log level', 1);
	io.sockets.on('connection', function(socket){
		socket.on('key', function(data){
			console.log(data);
		});
	})
});

// do the hacking and slashing
setInterval(function(){
	HKCURR += HKDIR * HKINCR;
	if (HKCURR < HKMIN || HKCURR > HKMAX) {
		HKDIR *= -1;
	}
	if (HKCURR < HKMIN) HKCURR = HKMIN;
	if (HKCURR > HKMAX) HKCURR = HKMAX;

	try {
		board.servoWrite(HK, HKCURR);
	} catch (e) {

	}

}, 200); 