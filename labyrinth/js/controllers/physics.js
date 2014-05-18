var physics = {
	speed : 5,
	getSpeed : function(rene, node){
		if(rene.state === "LEFT"){
			if( node.getLeft() === 1 && rene.posX < node.getX()*(800/21) + 5)
			{
				return 0;
			}
			else
			{
				return this.speed;
			}
        	
        }

        if(rene.state === "RIGHT"){
        	if(node.getRight() === 1 && rene.posX > node.getX()*(800/21) + 5)
        	{
        		return 0;
        	}
        	else
        	{
        		return this.speed;
        	}
        }

        if(rene.state === "DOWN"){
        	if(node.getDown() === 1 && rene.posY > node.getY()*(800/21) + 2)
        	{
        		return 0;
        	}
        	else
        	{
        		return this.speed;
        	}
        }

        if(rene.state === "UP"){
        	if(node.getUp() === 1 && rene.posY < node.getY()*(800/21) + 5)
        	{
        		return 0;
        	}
        	else
        	{
        		return this.speed;
        	}
        }
	}
} 