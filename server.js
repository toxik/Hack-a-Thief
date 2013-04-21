var firmata = require('firmata'),
    express = require('express'),
    board	= new firmata.Board('/dev/ttyUSB0', configBoard),
    app		= express.createServer(),
    io		= require('socket.io').listen(app),
    fs 		= require('fs'),
	dir 	= '/root/camera/';

    // camera vars
    camOX 	= 6,	camOY	= 5,
    camDX	= 90,	camDY	= 90,	camINCR	= 2,

    // wheels vars
    WH1		= 3,	WHD1	= 12,	WH1PWR	= 60,  WH1TM = null, buffTime = 150,
    WH2		= 11,	WHD2	= 13,	WH2PWR	= 60,  WH2TM = null,

    // hook vars
    HK 		= 9,	HKMIN	= 90,	HKMAX	= 180, HKCURR = 90, HKINCR = 5, HKDIR = 1,

    // sonar vars
    SON1	= 5,	SON2	= 4,	SONINT	= 250,
    SONSPL1	= [],	SONSPL2	= [],	
    SON1LST	= null,	SON2LST	= null,

	telapi 	= require('telapi').client,
    sms	   	= new telapi(
		        'REMOVED', 
			    'REMOVED'
		    );

function configBoard(err) {
	if (err) {
		console.log(err);
		return;
	}

	try {
		//board.pinMode(camOX,	board.MODES.SERVO);
		board.pinMode(camOY,	board.MODES.SERVO);
		//board.servoWrite(camOX, camDX);
		board.servoWrite(camOY, camDY);
		
		
		//board.pinMode(HK,		board.MODES.SERVO);
		//board.servoWrite(HK,	HKCURR);

		board.pinMode(WHD1, 	board.MODES.OUTPUT);
		board.pinMode(WHD1, 	board.MODES.OUTPUT);
		board.pinMode(WH1, 		board.MODES.PWM);
		board.pinMode(WH2, 		board.MODES.PWM);
		
		board.pinMode(SON1, 	board.MODES.ANALOG);
		board.analogRead(SON1,  function (data) { SONSPL1.push( parseInt(data) ); });
		board.pinMode(SON2,		board.MODES.ANALOG);
		board.analogRead(SON2,  function (data) { SONSPL2.push( parseInt(data) ); });
		
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

function limit() {
	
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
			
			try {
 			      if (data.code === 'w') {
			        camDY += camINCR;
			        if (camDY <= 170) {
			          board.servoWrite(camOY, camDY);
			        }
			        } else if (data.code === 's') {
			        camDY -= camINCR;
			        if (camDY >= 10) {
			          board.servoWrite(camOY, camDY);
			        }
			      } else if (data.code === 'd') {
			       
			          //board.servoWrite(camOX, camDX);
			          WH2PWR += 10;
			          WH1PWR = WH2PWR;
			          console.log(WH1PWR);
			          if (WH1PWR > 240) {
				WH1PWR = 240;
			}
			if (WH2PWR > 240) {
				WH2PWR = 240;
			}
			if (WH1PWR < 0) {
				WH1PWR = 0;
			}
			if (WH2PWR < 0) {
				WH2PWR = 0;
			}
			      } else if (data.code ==='a') {
			          WH2PWR -= 10;
			          WH1PWR = WH2PWR;
			          if (WH1PWR > 240) {
							WH1PWR = 240;
						}
						if (WH2PWR > 240) {
							WH2PWR = 240;
						}
						if (WH1PWR < 0) {
							WH1PWR = 0;
						}
						if (WH2PWR < 0) {
							WH2PWR = 0;
						}
			          console.log(WH1PWR);
			      } else if (data.code === 'i') {
			      	limit();
			      	// mers inainte
			        clearTimeout(WH1TM);
			        board.digitalWrite(WHD1, board.LOW);
			        board.analogWrite(WH1, WH1PWR);
			        WH1TM = setTimeout(function() { board.analogWrite(WH1, 0); }, buffTime);
			        clearTimeout(WH2TM);
			        WH2PWR = WH1PWR;
			        board.digitalWrite(WHD2, board.LOW);
			        board.analogWrite(WH2, WH2PWR);
			        WH2TM = setTimeout(function() { board.analogWrite(WH2, 0); }, buffTime);

			      } else if (data.code === 'j') {
			      	limit();
			        WH1PWR = parseInt(WH2PWR / 2);
			      	clearTimeout(WH1TM);
			        board.digitalWrite(WHD1, board.LOW);
			        board.analogWrite(WH1, WH1PWR);
			        WH1TM = setTimeout(function() { board.analogWrite(WH1, 0); }, buffTime);
			        clearTimeout(WH2TM);
			        board.digitalWrite(WHD2, board.LOW);
			        board.analogWrite(WH2, WH2PWR);
			        WH2TM = setTimeout(function() { board.analogWrite(WH2, 0); }, buffTime);
			      } else if (data.code === 'k') {
			      	limit();
			      	// mers inapoi
			        clearTimeout(WH1TM);
			        board.digitalWrite(WHD1, board.HIGH);
			        board.analogWrite(WH1, WH1PWR);
			        WH1TM = setTimeout(function() { board.analogWrite(WH1, 0); }, buffTime);
			        clearTimeout(WH2TM);
			        WH2PWR = WH1PWR;
			        board.digitalWrite(WHD2, board.HIGH);
			        board.analogWrite(WH2, WH2PWR);
			        WH2TM = setTimeout(function() { board.analogWrite(WH2, 0); }, buffTime);
			        
			      } else if (data.code === 'l') {
			      	limit();
			      	WH2PWR = parseInt(WH1PWR / 2);
			      	clearTimeout(WH1TM);
			        board.digitalWrite(WHD1, board.LOW);
			        board.analogWrite(WH1, WH1PWR);
			        WH1TM = setTimeout(function() { board.analogWrite(WH1, 0); }, buffTime);
			        clearTimeout(WH2TM);
			        board.digitalWrite(WHD2, board.LOW);
			        board.analogWrite(WH2, WH2PWR);
			        WH2TM = setTimeout(function() { board.analogWrite(WH2, 0); }, buffTime);
			      }

			   } catch (e) {
			   	 console.log(e);
			   }
			console.log(data);
		});
	})
});

// do the hacking and slashing
setInterval(function() {
	HKCURR += HKDIR * HKINCR;
	if (HKCURR < HKMIN || HKCURR > HKMAX) {
		HKDIR *= -1;
	}
	if (HKCURR < HKMIN) HKCURR = HKMIN;
	if (HKCURR > HKMAX) HKCURR = HKMAX;

	try {
		//board.servoWrite(HK, HKCURR);
	} catch (e) {

	}

}, 200); 
