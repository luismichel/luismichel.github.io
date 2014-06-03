window.onload = function () {
	var container = document.getElementById("container");
	var p = document.createElement("p");
	var input = document.createElement("input");
	input.id = "cursor";
	input.type = "text";
	p.innerHTML = "Type 'help' to see a list of available commands"
	container.appendChild(p);
	container.appendChild(input);
	input.focus();
	var i = 1;
	input.onkeydown = function (event) {
		var inText = input.value;
		var params = input.value.split(" ");
		var elToInsert = document.createElement("p");
		var oldText = document.createElement("p");	

		if ( event.keyCode === 13) {
			oldText.innerHTML = inText;
			History.push(inText);
			container.appendChild(oldText);

			if( Commands[params[0]] ) {
				//elToInsert.innerHTML = Commands[inText].description;
				//container.appendChild(elToInsert);
				Commands[params[0]].execute(params);
			}
			else {
				elToInsert.innerHTML = "Command not found";
				container.appendChild(elToInsert);
			}

			container.removeChild(input);
			container.insertBefore(input);
			input.value = "";
			input.focus();
			i = 1;
		}

		if( event.keyCode === 38) {
			if ( i < 1 ) i = 1;
			
			if( i <= History.length ) {
				input.value = History[History.length - i];
				i++;
			}
		}

		if( event.keyCode === 40) {
			if( i > History.length ) i = History.length;
			
			if( i > 0 ) {
				input.value = History[History.length - i];	
				i--;
			}
		}

	}
}

History = [];

Commands = {
		"help" : {
			description : "Display a list of available commands",
			execute : function (params) {
				var list = document.createElement("ul");
				list.innerHTML = "";

				for( command in Commands ) {
					list.innerHTML += "<li>"+command+ " : "+ Commands[command].description +"</li>";
				}

				document.getElementById("container").appendChild(list);
			}
		}, 
		"demo" : {
			description : "Show one of my demos <br>\
			USAGE demo + [demoName] <br>\
			- Lab<br>\
			- Game<br>\
			- LoL",
			execute : function (params) {
				var logText = document.createElement("p");
				switch(params[1]) {
					case 'Lab' : 
						logText.innerHTML = "Opening the labyrinth demo...";
						document.getElementById("container").appendChild(logText);
						window.open("labyrinth/index.html");
						break;
					case 'Game' :
						logText.innerHTML = "Opening the Conway's Game of Life demo...";
						document.getElementById("container").appendChild(logText);
						window.open("life/index.html");
						break;
					case 'LoL' :
						logText.innerHTML = "Opening the League of Legends lookup demo...";
						document.getElementById("container").appendChild(logText);
						window.open("Duoranked/index.html");
						break;
					default : 
						logText.innerHTML = "Invalid parameter '"+params[1]+"'";
						document.getElementById("container").appendChild(logText);
				}
			}

		},
		"clear" : {
			description : "Clean the screen",
			execute : function (params) {
				var parent = document.getElementById("container");
				var i;

				for ( i = 0; i < parent.childNodes.length ; i++) {
					if( parent.childNodes[i] !== document.getElementById("cursor") ) {
						parent.removeChild(parent.childNodes[i]);	
						i--;
					} 
				}
			}
		}
		
	};

