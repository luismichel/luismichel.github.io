var charRenderer = {
	frames: 0,
	frames_total: 2,
	render : function(context, character){

    	var that = this;
		var radius = 70;
		context.globalAlpha = 1;
		context.beginPath();
		context.arc(character.posX+15, character.posY+15, radius, 0, 2 * Math.PI, false);
		context.fillStyle = 'white';
		context.fill();
		//context.strokeStyle = '#003300';
		context.stroke();
		
		//var character.image = new Image();
		//character.image.src = "character.images/walking.png";
		//console.log("renderer:"+that.frames);
		context.beginPath();
		if(character.state === "IDLE"){
			//that.frames = (that.frames % that.frames_total);
			//character.image.onload = function(){
				context.drawImage(character.image,
					character.width * that.frames ,
					0,
					character.width,
					character.height,
					character.posX,
					character.posY,
					character.width,
					character.height);
			//}
			//that.frames+=1;
		}

		if(character.state === "LEFT"){
			
			//character.image.onload = function(){
				context.drawImage(character.image,
					character.width * that.frames ,
					character.height*1,
					character.width,
					character.height,
					character.posX,
					character.posY,
					character.width,
					character.height);
			//}
			
		}


		if(character.state === "RIGHT"){
			
			//character.image.onload = function(){
				context.drawImage(character.image,
					character.width * that.frames ,
					character.height*2,
					character.width,
					character.height,
					character.posX,
					character.posY,
					character.width,
					character.height);
			//}
			
		}

		if(character.state === "DOWN"){
			
			//character.image.onload = function(){
				context.drawImage(character.image,
					character.width * that.frames ,
					0,
					character.width,
					character.height,
					character.posX,
					character.posY,
					character.width,
					character.height);
			//}
			
		}

		if(character.state === "UP"){
			
			//character.image.onload = function(){
				context.drawImage(character.image,
					character.width * that.frames ,
					character.height*3,
					character.width,
					character.height,
					character.posX,
					character.posY,
					character.width,
					character.height);
			//}
			
		}

	  
		
	}
}