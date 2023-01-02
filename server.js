const path = require('path');
const fs = require('fs');
const express = require('express');
const { WebSocketServer } = require('ws');
const WebSocket = require('ws');
const cpen322 = require('./cpen322-tester.js');
const Database = require('./Database.js');
const { ObjectID } = require('bson');
const { rejects } = require('assert');
const SessionManager = require('./SessionManager');
const crypto = require('crypto');
const e = require('express');
const { networkInterfaces } = require('os');

var db = new Database("mongodb://localhost:27017", "cpen322-messenger");
var sessionManager = new SessionManager();

function logRequest(req, res, next){
	console.log(`${new Date()}  ${req.ip} : ${req.method} ${req.path}`);
	next();
}

const host = 'localhost';
const port = 3000;
const clientApp = path.join(__dirname, 'client');

// express app
let app = express();

app.use(express.json()) 						// to parse application/json
app.use(express.urlencoded({ extended: true })) // to parse application/x-www-form-urlencoded
app.use(logRequest);							// logging for debug

// Got this code from https://amitd.co/code/javascript/strip-trailing-slashes-from-express-requests 
app.use(function (req, res, next) {
	console.log("In here");
	if (req.path.substr(-1) == '/' && req.path.length > 1) {
	  let query = req.url.slice(req.path.length)
	  console.log("It changed to " + req.path.slice(0, -1) + query);
	  res.redirect(301, req.path.slice(0, -1) + query)
	} else {
	  next()
	}
  })
// serve static files (client-side)
app.use(/^\/$/, sessionManager.middleware, express.static(clientApp, { extensions: ['html'] }));
app.use(/^\/app\.js$/i, sessionManager.middleware, express.static(clientApp + '/app.js', { extensions: ['html'] }));
app.use(/^\/index\.html$/i, sessionManager.middleware, express.static(clientApp + '/index.html', { extensions: ['html'] }));
app.use(/^\/index$/i, sessionManager.middleware, express.static(clientApp + '/index.html', { extensions: ['html'] }));
//app.use('/app.js', express.static(clientApp+'/login.html', { extensions: ['html'] }));
app.use('/', express.static(clientApp, { extensions: ['html'] }));
app.listen(port, () => {
	console.log(`${new Date()}  App Started. Listening on ${host}:${port}, serving ${clientApp}`);
});



// My implementation starts here
const messageBlockSize = 10;
var messages = {};
db.getRooms()
.then((value) => {
	for(var i = 0; i < value.length; i++)
	{
		var obj = value[i];
		messages[obj._id] = [];
	}
});

var middleware = function(req, res, next)
{
	console.log("In middleware");
	sessionManager.middleware(req,res,next);
}

app.route("/login")
	.post(function(req, res, next)
	{
		console.log("In /login POST");
		var username = req.body.username;
		var password = req.body.password;
		console.log(username);
		console.log(password);

		db.getUser(username)
		.then((value) => {
			if(value === null)
			{
				res.redirect('/login');
				return;

			}
			var bool = isCorrectPassword(password, value.password);
			if(bool)
			{
				sessionManager.createSession(res, value.username);
				res.redirect('/');
				//next();

			}
			else
			{
				res.redirect('/login');
				//next();
			}
			

		});
	});

app.use(middleware);

app.use((err, req, res, next) => {
	console.log("In Error!");
	// console.log(typeof err);
	// console.log(SessionManager.Error);
	//if(err === SessionManager.Error)
	if(err === null || err === undefined)
	{
		next();
	}
	else if(err instanceof SessionManager.Error)
	{
		//console.log("This worked");
		//console.log(typeof req.get("Accept"));
		if(req.get("Accept") === 'application/json')
		{
			console.log("Error: Status added!");
			res.status(401).send(err);
			return;
			//next();

		}
		else
		{
			console.log("Error: redirect added!");
			res.redirect('/login');
			return;
			//next();
		}
		


	}
	else
	{
		console.log("Error: status 500 added!");
		//console.log("This worked21");
		res.status(500).send();
		return;
		//next();
	}
	
})

app.route("/logout")
	.get(function(req,res)
	{
		sessionManager.deleteSession(req);
		res.redirect("/login");
	})

app.route("/profile")
	.get(function(req, res, next)
	{
		console.log("In /profile GET");
		console.log(req.get("Cookie"));
		var cookie = req.get("Cookie");
		if(cookie === undefined)
		{
			res.send(JSON.stringify(null));
			return;
		}
		cookie = (cookie.substring(16, cookie.length));
		console.log(cookie);
		var username = sessionManager.getUsername(cookie);
		var obj = {};
		obj.username = username;
		console.log(username);
		res.send(JSON.stringify(obj));
		//res.send(sessionManager.getUsername(cookie));
		//res.status(200).send();
		//sessionManager.middleware(req, res, next);
	})



app.route("/chat")
	.get(function(req, res, next)
	{
		//sessionManager.middleware(req, res, next);

		console.log("In /chat GET");
		db.getRooms()
		.then((value) => {
			var arr = [];
			for(var i = 0; i < value.length; i++)
			{
				var result = value[i];
				var obj = {};
				obj._id = result._id;
				obj.name = result.name;
				obj.image = result.image;
				obj.messages = messages[result._id];
				arr.push(obj);
			 	// result.messages = messages[result._id];
				// arr.push(result);
			}
			res.send(arr);


		})
	})

	.post(function(req, res, next) {
		//sessionManager.middleware(req, res, next);
		console.log("In /chat POST");

		if(req.body.name === undefined)
		{
			res.status(400).send("Name not defined");
		}
		else
		{
			//console.log(req.body);
			var arr = {};
			arr.name = req.body.name;
			arr.image = req.body.image;
			db.addRoom(arr)
			.then((value) => {

				messages[value._id] = [];
				//console.log(value);
				res.status(200).send(value);

			});
		}
	})

app.route("/chat/:room_id")
	.get(function(req, res, next)
	{
		console.log("In /chat/roomid GET");

		//sessionManager.middleware(req, res, next);

		var obj = req.params;
		var room = obj.room_id;
		//console.log(room);
		db.getRoom(room)
		.then((value) =>{
			//console.log('Hello');
			//console.log(value);
			if(value == null)
			{
				res.status(404).send("Room X was not found");

			}
			else
			{
				res.send(value);
			}
		})

	})

	
app.route("/chat/:room_id/messages")
	.get(function(req, res, next)
	{
		console.log("In /chat/roomid/messages GET");
		//sessionManager.middleware(req, res, next);

		var room = req.params.room_id;
		var before = req.query.before;

		before = parseInt(before, 10);
		 var e = db.getLastConversation(room, before)
		.then ((value) => {
			//console.log(value);
			res.send(value);

		});
		//console.log(e);

	})

isCorrectPassword = function (password, saltedHash) {

	var salt = saltedHash.substring(0, 20);
	var tmp = saltedHash.substring(20, 21+44);
	var pass = password + salt;

	var hash = crypto.createHash('sha256');
	hash.update(pass);

	var result = hash.copy().digest('hex');
	var base64String = Buffer.from(result, 'hex').toString('base64')

	if(base64String === tmp)
		return true;

	return false;


}
// Got this code from https://github.com/websockets/ws#simple-server 
const broker = new WebSocketServer({port: 8000});

broker.on('connection', function connection(ws) {
	console.log("Here is the secodn argument");
	var username;

	var cookie = arguments[1].headers.cookie;
	console.log(cookie);
	// Now we try to parse this cookie
	if(cookie === undefined)
	{
		
		//broker.close();
		ws.close();
		return;
	}
	else
	{
		console.log(cookie);
		cookie = (cookie.substring(16, cookie.length));
		username = sessionManager.getUsername(cookie);
		if(username === null)
		{
			ws.close();
			return;


			//username = "hell";
		}

	}
	ws.on('message',  function message(data, isBinary) {
		const messa = JSON.parse(data);
		messa.username = username;
		messa.text = sanitize(messa.text);
		console.log("This is going");
		console.log(messa);
		data = JSON.stringify(messa);
	  broker.clients.forEach(function each(client) {
		if (client !== ws && client.readyState === WebSocket.OPEN) {
		  client.send(data, { binary: isBinary });

		}
	  });
	  const mess = JSON.parse(data);
	  //console.log('Data comes in');
	  //console.log(mess);
	  mess.username = username;
	//   //mess.text = sanitize(mess.text);
	//   console.log("This is the proper one");
	//   console.log(mess);
	  messages[mess.roomId].push(mess);

	if(messages[mess.roomId].length === 10)
	{
		var obj = {};
		obj.room_id = mess.roomId;
		obj.timestamp = Date.now();
		var array = messages[mess.roomId];
		obj.messages = array;
		//console.log(obj.messages);
		messages[mess.roomId] = [];
		//console.log(messages[mess.roomId]);
		var t = true;
		//while(t)
		db.addConversation(obj)
		.then((value) => {
			//console.log("Here!");
			//console.log(value);
			t = false;
		});








		// console.log("Messages array");
		// console.log(messages[mess.roomId]);
		// var arr = [];
		// var ar = messages[mess.roomId];
		// for(var i = 0; i < messageBlockSize; i++)
		// {
		// 	//arr.push(messages[mess.roomId].shift());
		// 	ar[i] = arr[i];
		// 	console.log(ar.pop());
		// }
		//console.log(arr);
		// console.log("arr array");
		// console.log(arr);

	}

	});
  });

  //app.use('/', express.static(clientApp, { extensions: ['html'] }));
// Got this code from https://stackoverflow.com/questions/2794137/sanitizing-user-input-before-adding-it-to-the-dom-in-javascript

// function sanitize(string) {
// 	const map = {
// 		'&': '&amp;',
// 		'<': '&lt;',
// 		'>': '&gt;',
// 		'"': '&quot;',
// 		"'": '&#x27;',
// 		"/": '&#x2F;',
// 	};
// 	const reg = /[&<>"'/]/ig;
// 	return string.replace(reg, (match)=>(map[match]));
//   }

//   function sanitize(string) {
// 	return string;
//   }

function sanitize(string) {
	const map = {
		// '&': '&amp;',
		'<': '&',
		'>': '&',
		'"': '&quot;',
		"'": '&#x27;',
		"/": '&#x2F;',
	};
	//const reg = /[&<>"'/]/ig;
  const reg = /[<>"'/]/ig;
	return string.replace(reg, (match)=>(map[match]));
  }
cpen322.export(__filename, { 
		app: app,
		messages: messages,
		broker: broker,
		db:db,
		messageBlockSize: messageBlockSize,
		sessionManager: sessionManager,
		isCorrectPassword: isCorrectPassword
 });

// at the very end of server.js
cpen322.connect('http://52.43.220.29/cpen322/test-a5-server.js');
cpen322.export(__filename, { app });