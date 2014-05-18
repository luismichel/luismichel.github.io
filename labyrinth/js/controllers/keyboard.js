var keyboardController = {
	keypressed : "IDLE",
	keydown: false,
	init : function(){
		that = this;
		document.addEventListener('keydown', function(event) {

			

			//cambiar por switch
		    if(event.keyCode == 37) {
		        //console.log('Left was pressed');
		        that.keypressed = "LEFT";
		        that.keydown = true;
		    }
		    else if(event.keyCode == 39) {
		        //console.log('Right was pressed');
		        that.keypressed = "RIGHT";
		        that.keydown = true;
		    }
		    else if(event.keyCode == 40) {

		    	//console.log('Down was pressed');
		    	that.keypressed = "DOWN";
		    	that.keydown = true;
		    }
		    else if(event.keyCode == 38) {
		    	//console.log('Up was pressed');
		    	that.keypressed = "UP";
		    	that.keydown = true;
		    }
		});

		document.addEventListener('keyup',function(event){
			that.keydown = false;
		});
	}

};