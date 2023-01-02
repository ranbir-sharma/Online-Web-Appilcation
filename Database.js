const { MongoClient, ObjectID, ObjectId } = require('mongodb');	// require the mongodb driver

/**
 * Uses mongodb v4.2+ - [API Documentation](http://mongodb.github.io/node-mongodb-native/4.2/)
 * Database wraps a mongoDB connection to provide a higher-level abstraction layer
 * for manipulating the objects in our cpen322 app.
 */
function Database(mongoUrl, dbName){
	if (!(this instanceof Database)) return new Database(mongoUrl, dbName);
	this.connected = new Promise((resolve, reject) => {
		MongoClient.connect(
			mongoUrl,
			{
				useNewUrlParser: true
			},
			(err, client) => {
				if (err) reject(err);
				else {
					console.log('[MongoClient] Connected to ' + mongoUrl + '/' + dbName);
					resolve(client.db(dbName));
				}
			}
		)
	});
	this.status = () => this.connected.then(
		db => ({ error: null, url: mongoUrl, db: dbName }),
		err => ({ error: err })
	);
}

Database.prototype.getUser = function(username)
{
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			console.log(typeof username);
			const collection = db.collection('users');
			const findResult =  collection.find({
				username: username
			}).toArray()
			.then((value) => {
				if(value.length === 0)
				{
					resolve(null);

				}
				resolve(value[0]);

				
			})

		})
	)


}

Database.prototype.getRooms = function(){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			/* TODO: read the chatrooms from `db`
			 * and resolve an array of chatrooms */
			const collection = db.collection('chatrooms');
			const findResult =  collection.find({}).toArray()
			// resolve(findResult);
			.then((value) => {
				//console.log("Rooms");
				//console.log(value);
				resolve(value);

			})
		})
	)
	
}

Database.prototype.getRoom = function(room_id){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			/* TODO: read the chatroom from `db`
			 * and resolve the result */

			var string = room_id;
			const collection = db.collection('chatrooms');
			//console.log(collection);
			const filteredDocs =  collection.find({ _id: string }).toArray()
			.then((value) => {

				//console.log(value);
				// if(value.length === 0)
				// {
				// 	resolve(null);
				// }
				for(var i = 0; i < value.length; i++)
				{
					var obj = value[i];
					if(typeof obj._id === typeof ObjectId)
					{
						resolve(obj);
					}
				}
				resolve(value[0]);
			})
		})
	)
}

Database.prototype.addRoom = function(room){
	return this.connected.then(db => 
		new Promise((resolve, reject) => {
			/* TODO: insert a room in the "chatrooms" collection in `db`
			 * and resolve the newly added room */
			var index;
			this.getRooms().then((value) => {
				index = value.length + 1;
				var obj = {};
				var id;
				//console.log(index);
				//console.log(room);

				if(room.name === undefined)
				{
					reject("Error: Name not defined");
					return;
				}

				
				if(room._id != undefined)
				{
					obj._id = room._id;
				}
				else if(room.id != undefined)
				{
					obj._id = room.id;
				}
				else
				{
					obj._id = 'room-' + index;
				}

				obj.name = room.name;
				obj.image = room.image;

				//console.log("Hello111");
				//console.log(obj);

				const collection = db.collection('chatrooms');
				const insertResult =  collection.insertMany([{
					_id: obj._id,
					name: obj.name,
					image: obj.image
				}]);
				resolve(obj);
			});

		})
	)
}

Database.prototype.getLastConversation = function(room_id, before){
	return this.connected.then(db =>
		new Promise(async(resolve, reject) => {
			/* TODO: read a conversation from `db` based on the given arguments
			 * and resolve if found */
			// console.log('At last');
			// console.log(room_id);
			// console.log(before);

			if(before === undefined)
			{
				//console.log("Oh no!");
				before = Date.now();
			}

			//console.log(room_id);
			//console.log(before);

			const collection = db.collection('conversations');
			const filteredDocs = await collection.find({ room_id: room_id, timestamp: {$lt:before}}).toArray()
			.then((value) => {

				//console.log(value);
				if(value.length === 0)
				{
					//console.log("Okay no!");
					resolve(null);
					//return;
				}
				var tmp = before;
				for(var i = 0; i < value.length; i++)
				{
					if(tmp > (before - value[i].timestamp))
					{
						tmp = (before - value[i].timestamp);
					}

				}
				for(var i = 0; i < value.length; i++)
				{
					if(tmp === (before - value[i].timestamp))
					{
						resolve(value[i]);
					}

				}
			});

			//console.log(filteredDocs);
		})
	)
}

Database.prototype.addConversation = function(conversation){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			/* TODO: insert a conversation in the "conversations" collection in `db`
			 * and resolve the newly added conversation */

			if(conversation.room_id === undefined)
			{
				reject("Error: room_id not defined!");
			}
			else if(conversation.timestamp === undefined)
			{
				reject("Error: timestamp not defined!");
			}
			else if(conversation.messages === undefined)
			{
				reject("Error: messages not defined!");
			}
			else
			{
				// Coleections
				const collection = db.collection('conversations');
				var index;
				const findResult =  collection.find({}).toArray()
				.then(async(value) =>{
					index = value.length + 1;
					var obj = {};
					obj._id = 'id-' + index;
					obj.room_id = conversation.room_id;
					obj.timestamp = conversation.timestamp;
					obj.messages = conversation.messages;
					const insertResult = await collection.insertMany([{
						_id: obj._id,
						room_id: conversation.room_id,
						timestamp: conversation.timestamp,
						messages: conversation.messages
					}]);
					resolve(obj);
	
				})

			}




			
		})
	)
}

module.exports = Database;