class Box{
  
  constructor(quad, startingX, startingY, size, lifeSpan, isForLeftHand){
    this.quad = quad;
    this.x = startingX;
    this.y = startingY;
    this.size = size;
    this.lifeSpan = lifeSpan;
    this.isForLeftHand = isForLeftHand;
    this.isDead = false;
  }
  
  decay(){
    this.lifeSpan = this.lifeSpan - 1;
    if(this.lifeSpan <= 0){
      //console.log('naturally died');
      this.isDead = true;
    }
  }
  
  drawBox(){
    let handColor = this.isForLeftHand ? 'red' : 'blue';
    strokeWeight(0);
    fill(handColor)
    rect(this.x, this.y, this.size, this.size);
  }
  
  
  
  
}

