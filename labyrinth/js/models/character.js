function Character(src){

	this.width = 32;
	this.height = 32;
	this.posX = 0;
	this.posY = 0;
	this.lightRadius = 70;

	this.state = "IDLE";

	var img = new Image();
	img.src = src;

	this.image = img;
	
	return this;

}