window.onload = function () {
 console.log("Game of life");
 var l = life();
 l.init();
}

Array.prototype.clone = function() {
	return this.slice(0);
};

function getRandBinary() {
	return Math.floor(Math.random() * 2);
}

function getRandomArbitrary(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

var life = function(){
	var width = 300;
	var height = 300;
	var matrix = [];
	var next = [];
	var population = 0;
	var generation = 0;
	var canvas = document.getElementById("myCanvas");
	var ctx = canvas.getContext("2d");
	var lineW = canvas.width / width;
	var lineH = canvas.height / height;
	

	return{
		init : function () {
		 
		 var i, j;
		 var that = this;
		 
		 for( i=0; i < width ; i+=1)
		 {
		   a=[];
		  for( j=0; j < height ; j+=1)
		  {

		  		if( getRandBinary() === 1)
		  	    {
		  			a[j] = getRandBinary();
		  		}
		  		else
		  		{
		  			a[j] = 0;	
		  		}	
		  	
		 
		    matrix[i] = a;  
			}

		 }
		 
		 for( i=0; i < width ; i+=1)
		 {
		 	a=[];
		 	for( j=0; j < height ; j+=1)
		 	{
		 		a[j] = 0;
		 	}
		 	next[i] = a;
		 }


		 //console.log(this);
		 setInterval(function(){
		 	//console.log(that);
		  	that.nextGen();
		  }, 6);
		//this.nextGen();
		},

		drawLife : function(){
			var i, j;
			//console.log("drawing generation "+generation);
			for( i=0; i < width ; i+=1)
			{
			 for( j=0; j < height ; j+=1)
			 {
			  if( matrix[i][j] === 1)
			  {
			  	ctx.fillStyle = "rgb(0,0,0)";
			  	ctx.fillRect (i*lineW, j*lineH, lineW, lineH);
			  }
			 } 

			}
			
			return 1;
		},

		nextGen : function(){
			var x, y, i, j;
			var sum = 0;

			ctx.clearRect(0, 0, canvas.width, canvas.height);
			generation += 1;
			//console.log("Generation "+generation);
			for( i=1; i < width-1 ; i+=1)
			{
			 for( j=1; j < height-1 ; j+=1)
			 {
			 	sum = 0;
			 	if( matrix[i][j] === 1)
			 	{
			 		for( x=-1; x < 2 ; x+=1)
			 		{
			 			for( y=-1; y < 2; y+=1 )
			 			{
			 				if(x === 0 && y === 0) continue;
			 				sum += matrix[i+x][j+y];
			 			}
			 		}

			 		if( sum < 2 || sum > 3) next[i][j] = 0;
			 		
			 	}
			 	else if (matrix[i][j] === 0)
			 	{
			 		for( x=-1; x < 2 ; x+=1)
			 		{
			 			for( y=-1; y < 2; y+=1 )
			 			{
			 				if(x === 0 && y === 0) continue;
			 				sum += matrix[i+x][j+y];
			 			}
			 		}

			 		if( sum === 3) next[i][j] = 1;
			 	}
			  	
			  	

			 } 

			}
		
			for(i=0; i < matrix.length ; i+=1)
			{
				matrix[i] = next[i].slice(0);
			}
			
			//console.log(this);
			this.drawLife();
		}

	};
};