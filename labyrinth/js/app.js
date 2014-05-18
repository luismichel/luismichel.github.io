mainApp = function(){

	var imageSources = {
		root : "images/",
		walkingSprite : "walking.png"
	};

	var version = "0.0.1";
	var canvas = document.getElementById("main-canvas");
	var context = canvas.getContext("2d");

	return {
		imageSources : imageSources,
		version : version,
		context : context,
		canvas : canvas
	};

}();

var rene;
var lab;
var init = function(){
    lab = Backtracking(mainApp.canvas);
    lab.init();
    mainApp.canvas.style.backgroundColor = "black";
	rene = new Character("images/walking.png");
	rene.posX = lab.getInitX() ;
	rene.posY = lab.getInitY() ;
	keyboardController.init();
}();


var dir = 0;
var lastCall = 0;
var fpsNode = document.getElementById("fps");
var frameCount = 0;
var nX;
var nY;
var mainloop = function(timestamp) {
        if(rene.state !== "IDLE")
        {
         mainApp.context.clearRect(0, 0, mainApp.canvas.width, mainApp.canvas.height);    
        }
        
        
        if( rene.posX/lab.getNX() % 1 >= 0.5 ){
          nX = Math.ceil(rene.posX/lab.getNX())  
        } 
        else
        {
          nX = Math.floor(rene.posX/lab.getNX())
        }

        if( rene.posY/lab.getNY() % 1 >= 0.5 ){
          nY = Math.ceil(rene.posY/lab.getNY())  
        } 
        else
        {
          nY = Math.floor(rene.posY/lab.getNY())
        }

        var delta = (timestamp / 1000) - lastCall;
		lastCall = timestamp / 1000;
		
		if(frameCount % 60 == 0) fpsNode.innerHTML = "FPS: " + (1/delta).toFixed(2);
        rene.state = keyboardController.keypressed;

        if(rene.state === "LEFT" && keyboardController.keydown){
        	rene.posX-=physics.getSpeed(rene, lab.getNode(nX, nY));
        }

        if(rene.state === "RIGHT" && keyboardController.keydown){
        	rene.posX+=physics.getSpeed(rene, lab.getNode(nX, nY));;
        }

        if(rene.state === "DOWN" && keyboardController.keydown){
        	rene.posY+=physics.getSpeed(rene, lab.getNode(nX, nY));;
        }

        if(rene.state === "UP" && keyboardController.keydown){
        	rene.posY-=physics.getSpeed(rene, lab.getNode(nX, nY));;
        }

        mainApp.context.save();
        mainApp.context.beginPath();
        mainApp.context.arc(rene.posX+15, rene.posY+15, rene.lightRadius, 0, 2 * Math.PI, false);
        mainApp.context.closePath();
        mainApp.context.clip();
        charRenderer.render(mainApp.context, rene);
        lab.drawLabyrinth();
        mainApp.context.restore();

        if(keyboardController.keydown && frameCount % 10 == 0){
        	
        	//movimiento oscilatorio entre los frames
        	if(charRenderer.frames < charRenderer.frames_total && dir==0)
        	{
        		//dir = 1;
        		charRenderer.frames += 1;
        	}else{
        		dir = 1 ;
        	}

        	if(charRenderer.frames > 0 && dir)
        	{
        		//dir = 0;
        		charRenderer.frames -= 1;
        	}else{
        		dir = 0;
        	}
        }

        frameCount++;
    };

var animFrame = window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        window.oRequestAnimationFrame      ||
        window.msRequestAnimationFrame     ||
        null ;

var recursiveAnim = function(lastCall) {
    mainloop(lastCall);
    animFrame( recursiveAnim );
};

// start the mainloop
rene.image.onload = animFrame( recursiveAnim );
