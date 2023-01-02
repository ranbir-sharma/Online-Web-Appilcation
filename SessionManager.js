const crypto = require('crypto');

class SessionError extends Error {};

function SessionManager (){
	// default session length - you might want to
	// set this to something small during development
	const CookieMaxAgeMs = 600000;

	var cookieBytes;

	// keeping the session data inside a closure to keep them protected
	const sessions = {};

	// might be worth thinking about why we create these functions
	// as anonymous functions (per each instance) and not as prototype methods
	this.createSession = (response, username, maxAge = CookieMaxAgeMs) => {

		if(maxAge === undefined)
			maxAge = CookieMaxAgeMs;
		var token = crypto.randomBytes(20).toString('base64url');
		var obj = {};
		obj.username = username;
		obj.timestamp = Date.now();
		obj.expire = obj.timestamp + maxAge;
		var self = this;
		sessions[token] = obj;
		console.log("Made a cookie token");
		console.log(token);
		cookieBytes = token.length;
		// console.log(cookieBytes);

		setTimeout(() => {
			delete sessions[token];
		}, maxAge);

		// console.log(maxAge);

		response.cookie("cpen322-session", token, {
			expires: new Date(Date.now() + maxAge),
			maxAge: maxAge
			//encode: String
		});
		


	};

	this.deleteSession = (request) => {
		//console.log(request);
		delete request.username;
		var cookie = request.session;
		delete request.session;
		delete sessions[cookie];
		/* To be implemented */

	};

	this.middleware = (request, response, next) => {
		/* To be implemented */
		
		console.log("in SessionManger");
		
		if(request.get("Cookie") === undefined)
		{
			next(new SessionError("No Cookie found"));
			return;
		}

		console.log("Cookie here: ");
		console.log(request.get("Cookie"));
		var cookie = request.get("Cookie");
		var length = cookie.length;
		var chararray = Array.from(cookie);
		var bytes = 16;
		var array = [];
		var tmp;
		console.log(cookie);
		// if(chararray[15] !== '=')
		// {
		// 	next(new SessionError("No Cookie found"));
		// }
		var tmp = "";
		var i = 16;

		while(true)
		{
			if(chararray[i] === ";")
			{
				array.push(tmp);
				tmp = "";
			}
			else if(chararray[i] === ' ')
			{
				// Do nothing
			}
			else
			{
				tmp = tmp + chararray[i];
			}
			
			i = i + 1;
			if(i === chararray.length)
			{
				array.push(tmp);
				tmp = "";
				break;
			}
			//console.log(chararray[i]);
			 
		}


		console.log(array);
		cookie = array[0];
		
		
		
		//console.log(response.headers['Accept']);
		for(var i = 0; i < array.length; i++)
		{
			var cook = array[i];
			if(sessions[cook] !== undefined)
			{
				request.username = sessions[cook].username;
				request.session = cook;
				console.log("Found a valid cookie");
				next();
				return;
			}
		}
		if(sessions[cookie] === undefined)
		{
			// console.log("Hello");
			// console.log(typeof SessionError);
			console.log("No cookie found");
			next(new SessionError("No Cookie found"));
		}
	};

	// this function is used by the test script.
	// you can use it if you want.
	this.getUsername = (token) => ((token in sessions) ? sessions[token].username : null);
};

// SessionError class is available to other modules as "SessionManager.Error"
SessionManager.Error = SessionError;

module.exports = SessionManager;