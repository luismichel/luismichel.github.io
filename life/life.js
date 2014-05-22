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
	var width = 100;
	var height = 100;
	var matrix = [];
	var next = [];
	var population = 0;
	var generation = 0;
	var canvas = document.getElementById("myCanvas");
	var ctx = canvas.getContext("2d");
	var lineW = canvas.width / width;
	var lineH = canvas.height / height;
	var isGrid = true;

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


		 $("#myCanvas").mousemove( function(e){
		 	next[Math.floor(e.clientX/lineW)][Math.floor(e.clientY/lineH)] = 1;
		 });

		 //console.log(this);
		 setInterval(function(){
		 	//console.log(that);
		  	that.nextGen();
		  }, 100);
		//this.nextGen();
		},

		drawLife : function(){
			var i, j;
			var stats = document.getElementById("stats");
			population = 0;
			//console.log("drawing generation "+generation);
			ctx.beginPath();
			for( i=0; i < width ; i+=1)
			{
			 for( j=0; j < height ; j+=1)
			 {
			  if( matrix[i][j] === 1)
			  {
			  	ctx.fillStyle = "rgb(0,0,0)";
			  	ctx.fillRect (i*lineW, j*lineH, lineW, lineH);
			  	population += 1;
			  }
			 } 

			}

			ctx.beginPath();
			if(isGrid === true)
			{
				ctx.strokeStyle="#BBBBBB";
				for( i=0; i < width ; i+=1)
				{
					ctx.moveTo(i*lineW,0);
					ctx.lineTo(i*lineW, height*lineH);
					ctx.stroke(); 
					
				}

				for( j=0; j < height ; j+=1)
				{
					ctx.moveTo(0,j*lineH);
					ctx.lineTo(width*lineW,j*lineH);
					ctx.stroke(); 
				}
			}



			stats.innerHTML = "<p>Population : "+population+" | Generation : "+generation+"</p>";
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