// These functions are already given to use

//const e = require("express");

// Removes the contents of the given DOM element (equivalent to elem.innerHTML = '' but faster)
function emptyDOM (elem){
    while (elem.firstChild) elem.removeChild(elem.firstChild);
}

// Creates a DOM element from the given HTML string
function createDOM (htmlString){
    let template = document.createElement('template');
    template.innerHTML = htmlString.trim();
    return template.content.firstChild;
}

// example usage
var messageBox = createDOM(
    `<div>
        <span>Alice</span>
        <span>Hello World</span>
    </div>`
    );


// End of the functions that are given to us

 function * makeConversationLoader(room)
{
  var lastTimestamp = room.timestamp;
  var t = true;
  while(t)
  {
    
   yield new Promise((resolve, reject) => {
  while(true)
  {
    if(room.canLoadConversation === false)
    {
      break;
    }
    room.canLoadConversation = false;
     Service.getLastConversation(room.id, lastTimestamp)
    .then((value) => {
      //(value);
      if(value === null)
      {
        t = false;
        resolve(null);
      }
      else
      {
        lastTimestamp = value.timestamp;
        room.canLoadConversation = true;
        // var arr = [];
        // for(var i = 0; i < value.length; i++)
        //   arr.push(value.pop());
        room.addConversation(value);
        t = true;
        resolve(value);
        
      }
    })
  }
  // t = false;
  // resolve(null);
})
}

  console.log("It went away");
}



window.addEventListener('load', main);

var result; 
var profile = {
    username: "Alice",
    text: ""
};
var Service = [];

Service.origin = window.location.origin;
Service.addRoom = function (data)
{
  // let request = new Request(Service.origin + "/chat", {
  //   method: 'POST',
  //   body: JSON.stringify(data),
  //   headers: new Headers({
  //     'Content-Type': 'application/json'
  //   })
  // })
  
  const myJSON = JSON.stringify(data);
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", Service.origin + "/chat");
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onload = () => {
      if(xhr.status != 200) {
        //console.log(xhr);
        reject(new Error(xhr.responseText));}
      //resolve(xhr.response.json());
      else{
      resolve(JSON.parse(xhr.responseText));
    }

    }
    xhr.onerror = () =>
    {
      reject(new Error(xhr.responseText));
    }

    xhr.send(myJSON);
  })
}

Service.getAllRooms = function ()
{
 return new Promise((resolve, reject) => {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", Service.origin + "/chat");

  xhr.onload = () => {
    if(xhr.status != 200) {reject(new Error(xhr.responseText));}
    //resolve(xhr.response.json());
    else
    {
      //console.log(xhr.responseText);
      try
      {
        JSON.parse(xhr.responseText);
      }
      catch(e)
      {
        reject(new Error("Returened null"));
        return;
        
      }
      resolve(JSON.parse(xhr.responseText));
    }
    

  }
  xhr.onerror = () =>
  {
    reject(new Error(xhr.responseText));
  }

  xhr.send(null);

 })
}

Service.getLastConversation = function (roomId, before)
{
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", Service.origin + "/chat/" + roomId + "/messages" + "?before=" + before);
  
    xhr.onload = () => {
      if(xhr.status != 200) {reject(new Error(xhr.responseText));}
      //resolve(xhr.response.json());
      else{
      resolve(JSON.parse(xhr.responseText));
      }
  
    }
    xhr.onerror = () =>
    {
      reject(new Error(xhr.responseText));
    }
  
    xhr.send(null);
  
   })
}

Service.getProfile = function()
{
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", Service.origin + "/profile");
  
    xhr.onload = () => {
      if(xhr.status != 200) {reject(new Error(xhr.responseText));}
      else{
          resolve(JSON.parse(xhr.responseText));
      }
  
    }
    xhr.onerror = () =>
    {
      reject(new Error(xhr.responseText));
    }
  
    xhr.send(null);
  
   })

}

function main()
{
  var socket = new WebSocket(" ws://localhost:8000" );
  var lobby = new Lobby();
  var lobbyView = new LobbyView(lobby);
  var chatView = new ChatView(socket);  
  var profileView = new ProfileView();

  Service.getProfile()
  .then((value) =>
  {
    console.log(value);
   if(value === null)
   {

   }
   else
   {
     profile.username = value.username;
   }
  });
  
 
  window.addEventListener("popstate", renderRoute);
  socket.addEventListener("message", (event) => {
    var data = JSON.parse(event.data);
    var room = lobby.getRoom(data.roomId);
    room.addMessage(data.username, data.text);
  });


  cpen322.export(arguments.callee, {
   renderRoute: renderRoute,
    lobbyView: lobbyView,
    profileView: profileView,
    chatView: chatView,
    lobby: lobby,
    refreshLobby: refreshLobby,
    socket: socket,
    profile: profile
    });


    refreshLobby();
    setInterval(refreshLobby, 500000000000000);


    function refreshLobby ()
    {
      Service.getAllRooms()
      
      .then((value) => 
      {
        if(value === undefined) {return;}
        for(var i = 0; i < value.length; i++)
        {
          var room = value[i];
          var arr = lobby.rooms;
          if(arr[room._id] === undefined)
          {
            lobby.addRoom(room._id, room.name, room.image, room.messages);

          }
          else
          {
            arr[room._id].name = room.name;
            arr[room._id].image = room.image;

          }

        }
      })
      // .catch(function(error)
      // {
      //   //return this.reject(new Error(error));
      //   console.log(error);
        
  
      // })

    }

    function renderRoute()
    {
      result = window.location.hash;

      if(result === "#/")
        {
          // We empty the contents of #page-view and add index.html
          let element = document.getElementById("page-view");
          emptyDOM(element);
          element.appendChild(lobbyView.elem);

        }
        else if (result === "#/profile")
        {
          // We empty the contents of #page-view and add chat.html
          let element = document.getElementById("page-view");
          emptyDOM(element);
          element.appendChild(profileView.elem);
        }
      
        var array = lobby.rooms;
        for(var key in array)
        {
          var tmp = array[key];
           var e = "#/chat/" + tmp.id;
           if (result === e)
           {
             // We empty the contents of #page-view and add chat.html
             let element = document.getElementById("page-view");
             emptyDOM(element);
             
             element.appendChild(chatView.elem);
             
             //var i = lobby.getRoom(tmp.id);
             chatView.setRoom(tmp);
             break;
           }
        }




    }

}

class LobbyView
{
    constructor(lobby)
    {
        // We empty the contents of #page-view and add index.html
        
        
        this.elem =  createDOM(
            `
            
            <div class = "content">
                <!-- Unordered list -->
                <ul class = "room-list">
                <li> <a href = "#/chat/room-0">Chat Room - 0</a></li>
                <li> <a href = "#/chat/room-1">Chat Room - 1</a></li>
                <li> <a href = "#/chat/room-2">Chat Room - 2</a></li>
                <li> <a href = "#/chat/room-3">Chat Room - 3</a></li>
                </ul>
                      
                <div class = "page-control"> 
                    <!-- For the text box and Send button -->
                    <input type="text">
                    <button type="button">Create Room</button>
                </div>
            </div>
            
            `
        );

        var self = this;
        
        this.listElem = this.elem.querySelector("ul.room-list");
        this.inputElem = this.elem.querySelector("input");
        this.buttonElem = this.elem.querySelector("button");
        this.lobby = lobby;
        //this.lobby.onNewMessage = this.redrawList();
        
        this.redrawList();
        let ss = function (room)
        {
          self.redrawList();
        }

        Object.defineProperty(self.lobby, "onNewRoom",
        {
          value: ss,
          writable: true
        });
        
        this.buttonElem.addEventListener("click", function()
        {
          //self.redrawList;
         // var self = this;
          var text = self.inputElem.value;
          var obj = {};
          obj.name= text;
          obj.image = "assets/everyone-icon.png";

          var obj1 = Service.addRoom(obj);
          obj1.then(
            (result) => {
            self.lobby.addRoom(result._id, result.name, result.image);
            self.inputElem.value = "";
            self.lobby.onNewRoom();
            },

            (error) => {}
          );



          // self.lobby.addRoom(obj1.id,obj1.name, obj.image);
          self.inputElem.value = "";
          // self.lobby.onNewRoom();
          
          //self.lobby.onNewRoom();
          //self.onNewRoom(room);
        });

        
    }
    redrawList()
    {
      var obj = this.lobby;
      var array = obj.rooms;
      emptyDOM(this.listElem);

      for(var key in array)
      {
        var tmp = array[key];
         var e = `<li> <a href = "#/chat/` + (tmp.id) + `"> <img src= "` + tmp.image + `" alt = "Chat img" width="50" height="50" >` + tmp.name + `</a></li>`;
         var tem = createDOM(e);
         this.listElem.appendChild(tem);
      }

    }
}

class ChatView
{
    constructor(socket)
    {
      this.elem = createDOM(
          `<div class = "content">
              <h4 class = "room-name"> Everyone in CPEN400A  </h4>
              <div class = "message-list">
                  <div class = "message">
                    <span class = "message-user">Bob</span><br>
                    <span class = "message-text">How is everyone doing? </span>
                  </div>
                  <br><br><br>
                
                  <div class = "message my-message">
                      <span class = "message-user">Alice </span> <br>
                      <span class = "message-text">I am doing great! </span>
                  </div>
                </div>
                
            <div class = "page-control">
              <textarea rows="5" cols="50"></textarea>
              <button type="button">Send</button>
            </div>
          </div>`
        );

      this.titleElem = this.elem.querySelector("h4");
      this.chatElem = this.elem.querySelector(".message-list");
      this.inputElem = this.elem.querySelector("textarea");
      this.buttonElem = this.elem.querySelector("button");
      this.room = null;
      this.socket = socket;
      var self = this;
      self.buttonElem.addEventListener("click", function()
      {
        self.sendMessage();
      });
      self.inputElem.addEventListener("keyup", (event) => {
        if(event.key == "Enter" && !event.shiftKey)
          self.sendMessage();;
      });

      self.chatElem.addEventListener("wheel", (event) => {
        var t = document.querySelector(".message-list");
        // console.log(t);
        // console.log("Something Happened");
        // console.log(t.scrollTop);
        // console.log(self.chatElem.scrollTop);
        var tmp = event.deltaY;
        if((self.chatElem.scrollTop === 0 )&& (self.room.canLoadConversation === true) && (tmp < 0))
        {
          console.log("Printed!");
          self.room.getLastConversation.next();
        }

      });
    }

    sendMessage()
    {
      //var text = document.querySelector(".page-control").childNodes[1].value;
      var text = this.inputElem.value;
      this.room.addMessage(profile.username, text);
      this.inputElem.value = "";
      var obj = {};
      obj.roomId = this.room.id;
      obj.username = profile.username;
      obj.text = text;
      this.socket.send(JSON.stringify(obj));
    }

    setRoom(room)
    {
      this.room = room;
      this.titleElem.textContent = room.name;
      //document.querySelector("h4").textContent = room.name;
      
      
      //Clearing chatElem
      emptyDOM(this.chatElem);

      
      var array = this.room.messages;
      for(var i = 0 ; i < array.length; i++)
      {
        var obj = array[i];
        
        if(obj.username === profile.username)
        {
          var e = `<div class = "message my-message">
          <span class = "message-user">`+obj.username+` </span> <br>
          <span class = "message-text">`+obj.text+`</span> <br><br><br>
        </div>`;
        var tmp = createDOM(e);
        this.chatElem.appendChild(tmp);
        }
        else
        {
          var e =  `    
          <div class = "message">
            <span class = "message-user">`+obj.username+ `</span><br>
             <span class = "message-text">`+obj.text+` </span>
         </div>
         <br><br><br>`;
         var tmp = createDOM(e);
         this.chatElem.appendChild(tmp);
        }

      

      }
      var self = this;

      this.room.onNewMessage = function(message)
      {
        // console.log("This is the message send");
        // console.log(message.text);
        // console.log("After santize");
        if(message.value === undefined)
        {
          message.text = sanitize(message.text);
        }
        //console.log(message.text);
        var cond = message.username === profile.username;
        if(cond)
        {
          var e = `<div class = "message my-message">
          <span class = "message-user">`+message.username+` </span> <br>
          <span class = "message-text">`+message.text+`</span> 
        </div><br><br><br>`;
        var tmp = createDOM(e);
        self.chatElem.appendChild(tmp);

        }
        else
        {
          var e =  `    
          <div class = "message">
            <span class = "message-user">`+message.username+ `</span><br>
             <span class = "message-text">`+message.text+` </span>
         </div><br><br><br>`;
         var tmp = createDOM(e);
         self.chatElem.appendChild(tmp);
        }

      }

      self.room.onFetchConversation = function(conversation)
      {
        var arr =  conversation.messages;
        console.log(conversation);
        // console.log('In Fetch');
        // console.log(arr);
        
        let x = self.chatElem.scrollHeight;

        for(var i = 0; i < arr.length; i++)
        {
          var message = arr[arr.length - 1 - i];
          var t = document.querySelector(".message-list");
          
          var cond = message.username === profile.username;
          if(cond)
          {
            var e = `<div class = "message my-message">
            <span class = "message-user">`+message.username+` </span> <br>
            <span class = "message-text">`+message.text+`</span> 
          </div><br><br><br>`;
          var tmp = createDOM(e);
          t.prepend(tmp);
  
          }
          else
          {
            var e =  `    
            <div class = "message">
              <span class = "message-user">`+message.username+ `</span><br>
               <span class = "message-text">`+message.text+` </span>
           </div><br><br><br>`;
           var tmp = createDOM(e);
           t.prepend(tmp);
          }
        }

        let y = self.chatElem.scrollHeight;

        self.chatElem.scrollTop = y - x;

      }
    }
}

class ProfileView
{
    constructor()
    {
        // We empty the contents of #page-view and add chat.html
          this.elem =  createDOM(
                        `
                        <div class = "content">
                          <div class = "profile-form">
                
                            <div class = "form-field">
                              <label for="fname"> Username </label> 
                              &nbsp; &nbsp;  &nbsp; 
                              <input type="text" id="fname" name="fname">
                            </div>
                
                            <div class = "form-field">
                              <label> Password </label>  &nbsp; &nbsp;  &nbsp; 
                              <input type="password">
                            </div>
                
                            <div class = "form-field">
                              <label> Avatar Image </label> &nbsp; 
                                <img src = "assets/profile-icon.png" height="30" width="30"> 
                                &nbsp;  &nbsp; 
                                <input type="file">
                            </div>
                
                            <div class = "form-field">
                              <label> About </label> &nbsp; 
                                &nbsp;  &nbsp; 
                                <input type="text" height="70" width="70">
                            </div>
                
                          </div>
                
                          <div class = "page-control">
                            <button type="button">Save</button>
                          </div>
                        </div>
                        `
            );

    }
}

class Room
{
  constructor(id, name, image, messages)
  {
    this.id = id;
    this.name = name;
    if(arguments.length <= 2 || typeof(image) == undefined)
    {
      this.image = "assets/everyone-icon.png";
    }
    else
    {
      this.image = image;
    }

    if(arguments.length <= 3)
    {
      this.messages = [];
    }
    else
    {
      this.messages = messages;
    }
    this.timestamp = Date.now();

    this.canLoadConversation = true;
    this.getLastConversation = makeConversationLoader(this);
  }

  addMessage(username, text)
  {
    if(text.trim() === "")
    {
      return;
    }
    //console.log("It went through here");
    text = sanitize(text);
   // console.log(text);
    var object1 = {
      username: username,
      text: text,
      value: true
    };

    
    this.messages.push(object1);
    if(this.onNewMessage != undefined)
    this.onNewMessage(object1);
  }

  addConversation(conversation)
  {
    var arr = conversation.messages;
    var len = arr.length - 1;
    // console.log(arr12);
    // console.log(arr12[arr12.length-1]);
    var array = [];
    for(var i = 0; i < arr.length; i++)
    {
      this.messages.unshift(arr[len - i]);
      array[i] = arr[i];

    }
    conversation.messages = array;
    
     this.onFetchConversation(conversation);
    
  }


}

class Lobby
{
  constructor()
  {
    const rooms = [];
    for(var i = 0; i < 4; i++)
    {
      var id = ("room-" + i);
      rooms[id] = new Room(("room-" + i), "Chat Room - " + (i));
    }
    //this.rooms = rooms;
    this.rooms = [];
  }

  getRoom(roomId)
  {
    return this.rooms[roomId];
  }

  addRoom(id, name, image, messages)
  {
    this.rooms[id] = new Room(id, name, image, messages);
    var i = this.rooms[id];
    this.onNewRoom(this.rooms[id]);
  }
  
  onNewRoom(room, ss)
  {
    if(room != undefined) {
    var e = `<li> <a href = "#/chat/` + (room.id) + `"> <img src= "` + room.image + `" alt = "Chat img" width="50" height="50" >` + room.name + `</a></li>`;
    var tmp = createDOM(e)
    }
    //document.querySelector("ul.room-list").appendChild(tmp);
    if(ss != undefined)
    {
      console.log(ss);
      ss();
    }

  }
}

// Got this code from https://stackoverflow.com/questions/2794137/sanitizing-user-input-before-adding-it-to-the-dom-in-javascript

// function sanitize(string) {
//   const map = {
//       '&': '&amp;',
//       '<': '&lt;',
//       '>': '&gt;',
//       '"': '&quot;',
//       "'": '&#x27;',
//       "/": '&#x2F;',
//   };
//   const reg = /[&<>"'/]/ig;
//   return string.replace(reg, (match)=>(map[match]));
// }

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


