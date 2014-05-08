window.onload = function () {
 var c = document.getElementById("myCanvas");
 var bt = Backtracking(c);
 bt.init();
}

function getRandBinary() {
return Math.floor(Math.random() * 2);
}

function getRandomArbitrary(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

var Node = function (i, j){
  var up = 1;
  var down = 1;
  var left = 1;
  var right = 1;
  var x = i, y = j;
  var visited = 0;
  return {
    getX : function(){
      return x;
    },
    getY: function(){
      return y;
    },
    getUp: function(){
      return up;
    },
    getDown: function(){
      return down;
    },
    getLeft: function(){
      return left;
    },
    getRight: function(){
      return right;
    },
    getVisited : function(){
      return visited;
    },
    setUp : function(u){
      up = u;
    },
    setDown : function(d){
      down = d;
    },
    setRight : function(r){
      right = r;
    },
    setLeft : function(l){
      left = l;
    },
    setVisited : function(v){
      visited = v;
    }
    
  }
};


var Backtracking = function (c){
 var width = 41;
 var height = 21;
 var matrix = [];
 var cW = c.width;
 var cH = c.height;
 var a;
 var initX, initY;
 var visited = [];
 var lineW = cW / width;
 var lineH = cH / height;
 var ctx = c.getContext("2d");
 var cont = 0;
 return {

  generateMaze : function () {
    initX = getRandomArbitrary(1, width-2);
    initY = getRandomArbitrary(1, height-2);
    console.log("starting in x="+initX+", y="+initY);
    matrix[initX][initY].setVisited(1);
    visited.push(matrix[initX][initY]);
    //console.log(matrix[initX][initY]);
    this.tunnel(initX, initY);
    ctx.clearRect(0, 0, cW, cH);
    this.drawLabyrinth();
    //console.log("res x="+res.x+", y="+res.y);
  },

  tunnel : function(i,j){
    cont += 1;
    //console.log("tunel.."+ cont);
    var rand = 0;
    var rand2 = 0;
    var x = i, y = j;

    do{
      rand = getRandomArbitrary(-1, 1.3);
      if (rand === 0)
      {
        rand2 = getRandomArbitrary(-1, 1.3);
      }  
      //console.log("rand="+rand+" rand2="+rand2);
    }while( x+rand < 0 || y+rand2 < 0 || x+rand > width-1 || y+rand2 > height-1);
    
    
    if( x+rand >= 0 && y+rand2 >= 0 && x+rand <= width-1 && y+rand2 <= height-1 )
    { 
      var nX, nY, mX, mY;

      if( x + 1 > width - 1){
        nX = x;
      } 
      else
      {
        nX = x + 1;
      }

      if( x - 1 < 0){
        mX = x;
      } 
      else
      {
        mX = x - 1;
      }

      if( y + 1 > height - 1){
        nY = y;
      } 
      else
      {
        nY = y + 1;
      }

      if( y - 1 < 0){
        mY = y;
      } 
      else
      {
        mY = y - 1;
      }

      if( matrix[nX][y].getVisited() == 1 && matrix[mX][y].getVisited() == 1 && matrix[x][nY].getVisited() == 1 && matrix[x][mY].getVisited() == 1){
        var back = visited.pop();
        if(visited.length !== 0)
        {
          //console.log("going back to..."+back.getX()+" "+back.getY());
          //console.log("visited length "+visited.length);
          if(this.tunnel(back.getX(), back.getY()) === 0) return 0;
        }
        else
        {
          console.log("no hay mas por visitar");
          return 0;
        }
        
      }

      while( matrix[x+rand][y+rand2].getVisited() === 1 )
      {
        rand = 0;
        rand2 = 0;
        //console.log("while "+(x+rand)+" "+(y+rand2)); 
        rand = getRandomArbitrary(-1, 1.3);
        if (rand === 0)
        {
          rand2 = getRandomArbitrary(-1, 1.3);
          //console.log("rand === 0");
        }

       if( x+rand < 0) {
          rand += 1;
          continue;
        }
        if (y+rand2 < 0) {
          rand2 +=1;
          continue;
        }
        if( x+rand > width-1) {
          rand -= 1;
          continue;
        }
        if( y+rand2 > height-1) {
          rand2 -= 1;
          continue;
        }
        
      }
      //console.log((x+rand)+" "+(y+rand2)+" in "+matrix[x+rand][y+rand2].getVisited());
      matrix[x+rand][y+rand2].setVisited(1);
      visited.push(matrix[x+rand][y+rand2]);

      if(rand === 0 && rand2 === 1)
      {
        matrix[x][y].setDown(0);
        matrix[x+rand][y+rand2].setUp(0);
      }
      if(rand === 1 && rand2 === 0)
      {
        matrix[x][y].setRight(0);
        matrix[x+rand][y+rand2].setLeft(0);
      }
      if(rand === 0 && rand2 === -1)
      {
        matrix[x][y].setUp(0);
        matrix[x+rand][y+rand2].setDown(0);
      }
      if(rand === -1 && rand2 === 0)
      {
        matrix[x][y].setLeft(0);
        matrix[x+rand][y+rand2].setRight(0);
      }

      if(this.tunnel(x+rand, y+rand2) === 0) return 0;

    }
    
    
  },

  init : function () {
   
   var i, j;
   
   for( i=0; i < width ; i+=1)
   {
     a=[];
    for( j=0; j < height ; j+=1)
    {
     a[j] = Node(i,j);
    }
     matrix[i] = a;  

   }

   this.generateMaze();
  },

  getWidth: function(){
  	return width;
  },

  getHeight: function(){
  	return height;
  },

  getCanvasWidth: function(){
  	return cW;
  },
  drawNode : function(node){

    if( node.getUp() === 1)
    {
      ctx.moveTo(node.getX()*lineW,node.getY()*lineH);
      ctx.lineTo(node.getX()*lineW + lineW,node.getY()*lineH);
      ctx.stroke();  
    }
    
    if( node.getDown() === 1)
    {
      ctx.moveTo(node.getX()*lineW,node.getY()*lineH + lineH);
      ctx.lineTo(node.getX()*lineW + lineW,node.getY()*lineH + lineH);
      ctx.stroke();  
    }

    if( node.getLeft() === 1)
    {
      ctx.moveTo(node.getX()*lineW,node.getY()*lineH);
      ctx.lineTo(node.getX()*lineW,node.getY()*lineH + lineH);
      ctx.stroke();  
    }

    if( node.getRight() === 1)
    {
      ctx.moveTo(node.getX()*lineW + lineW,node.getY()*lineH);
      ctx.lineTo(node.getX()*lineW + lineW,node.getY()*lineH + lineH);
      ctx.stroke();  
    }

   },
   drawLabyrinth : function(){
       var i, j;
  
       for( i=0; i < width ; i+=1)
       {
        for( j=0; j < height ; j+=1)
        {
         this.drawNode(matrix[i][j]);
        }

       }
   }

 }



};

