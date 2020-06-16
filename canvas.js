import utils from './utils.js';

// Canvas Prep
const canvas = document.querySelector('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const c = canvas.getContext('2d');
const mouse = {};

// Event Listeners
window.addEventListener('mousemove', (event) => {
    mouse.x = event.x;
    mouse.y = event.y;
});

window.addEventListener('resize', () => {
    let restart = false;
    if (window.innerWidth < canvas.width || window.innerHeight < canvas.height) {
        restart = true;
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    if (restart)
        init();
});

let keys = {};

window.addEventListener('keydown', (event) => {
    const key = event.key;
    keys[key] = true;
});

window.addEventListener('keyup', (event) => {
    const key = event.key;
    keys[key] = false;
});

// Models 

const closeBoidsRange = 1000;
const boidTurnSpeed = 0.1;
const factors = {
    separation: 1,
    cohesion: 1,
    alignment: 1
};

class Boid{
    constructor(x, y, midlen, speed, color){
        this.position = {
            x: x,
            y: y
        }
        this.headAlpha = Math.PI / 3;
        this.midlen = midlen;
        this.speed = speed;
        this.angle = utils.randomFloatFromRange(0, 2 * Math.PI);
        this.calculateVelocity();
        this.calculateShape();
        this.color = color;
    }
    
    draw(){
        c.beginPath();
        c.fillStyle = this.color;
        c.moveTo(this.shape.head.x, this.shape.head.y);
        c.lineTo(this.shape.leftTail.x, this.shape.leftTail.y);
        c.lineTo(this.shape.tailBreak.x, this.shape.tailBreak.y);
        c.lineTo(this.shape.rightTail.x, this.shape.rightTail.y);
        c.closePath();
        c.fill();
    }
    
    update(boids){

        const closestBoids = this.findBoidsInRange(boids)

        let variation;

        if(closestBoids.length > 0){
            const sepVector = this.separation(closestBoids);
            const aliVector = this.alignment(closestBoids);
            const coheVector = this.cohesion(closestBoids);
            //console.log(sepVector, aliVector, coheVector);
            variation = this.parseMovement(sepVector, aliVector, coheVector);
        }else{
            variation = 0;
        }

        if ( ((this.angle + variation) % (2 * Math.PI)) < 0 ) {
            this.angle += 2 * Math.PI;
        }
        this.angle = (this.angle + variation) % (2 * Math.PI);
        
        this.calculateVelocity();

        if (this.velocity) {
            if ((this.position.x + this.velocity.x) % canvas.width < 0)
                this.position.x += canvas.width;
            this.position.x = (this.position.x + this.velocity.x) % canvas.width;
            if ((this.position.y + this.velocity.y) % canvas.height < 0)
                this.position.y += canvas.height;
            this.position.y = (this.position.y + this.velocity.y) % canvas.height;
        }
         
        this.calculateShape();
        this.draw();
    }

    findBoidsInRange(boids){
        let closest = [];
        boids.forEach(boid => {
            if (this !== boid && utils.distance({x: this.position.x, y: this.position.y}, {x: boid.position.x, y: boid.position.y}) < closeBoidsRange) {
                closest.push(boid);
            }
        });
        return closest;
    }

    parseMovement(sepVector, aliVector, coheVector) {
        let totalVectorX = factors.separation * sepVector.x + factors.alignment * aliVector.x + factors.cohesion * coheVector.x;
        let totalVectorY = factors.separation * sepVector.y + factors.alignment * aliVector.y + factors.cohesion * coheVector.y;

        let desiredAngle;
        //console.log(totalVectorX, totalVectorY);
        if (totalVectorX !== 0) {
            desiredAngle = Math.atan(totalVectorY / totalVectorX);
        }
        else {
            desiredAngle = (Math.PI / 2) * Math.sign(totalVectorY);
        }
        if (desiredAngle < 0){
            desiredAngle += 2 * Math.PI;
        }
        console.log(desiredAngle, this.angle) 
        let ans;
        if( ( ( (this.angle - desiredAngle) > 0) && ( (this.angle - desiredAngle) < Math.PI) ) || ( ( (desiredAngle - this.angle) > 0 ) && ((desiredAngle - this.angle) > Math.PI) ) ){
            ans = boidTurnSpeed;
        }else {
            ans = -boidTurnSpeed;
        }
        
        console.log(ans);;
        return ans;
    }

    separation(closestBoids) {
        let total = {
            x: 0,
            y: 0
        }

        closestBoids.forEach(boid => {
            total.x += (boid.position.x - this.position.x);
            total.y += (boid.position.y - this.position.y);
        })

        const size = Math.sqrt(Math.pow(total.x, 2) + Math.pow(total.x, 2));

        total.x /= size;
        total.y /= size;

        return total;
    }
    
    alignment(closestBoids){
        let total = {
            x: 0,
            y: 0
        };

        closestBoids.forEach(boid => {
            total.x += boid.velocity.x;
            total.y += boid.velocity.y;
        });

        const size = Math.sqrt(Math.pow(total.x, 2) + Math.pow(total.y, 2));

        total.x /= size;
        total.y /= size;

        return total;
    }
    
    cohesion(closestBoids) {
        let prom = {
            x: 0,
            y: 0
        }

        closestBoids.forEach(boid => {
            prom.x += boid.position.x;
            prom.y += boid.position.y;
        })

        prom.x /= closestBoids.length;
        prom.y /= closestBoids.length;
        
        let vectorToCenter = {
            x: prom.x - this.position.x,
            y: prom.y - this.position.y
        }

        const size = Math.sqrt(Math.pow(vectorToCenter.x, 2) + Math.pow(vectorToCenter.y, 2));

        vectorToCenter.x /= size;
        vectorToCenter.y /= size;

        //console.log('asd');
        //console.log(vectorToCenter);
        
        return vectorToCenter;
    }

    calculateVelocity(){
        if (!this.velocity)
            this.velocity = {};
        this.velocity = {
            x: this.speed * Math.cos(this.angle),
            y: this.speed * Math.sin(this.angle)
        }
    }

    calculateShape(){
        if (!this.shape)
            this.shape = {};

        this.shape.head = {
            x: this.position.x + Math.cos(this.angle) * this.midlen,
            y: this.position.y + Math.sin(this.angle) * this.midlen
        };

        this.shape.tailBreak = {
            x: this.position.x + Math.cos(this.angle) * this.midlen /4,
            y: this.position.y + Math.sin(this.angle) * this.midlen /4
        };

        const rightTailAngle = this.angle + (Math.PI / 2);
        this.shape.rightTail = {
            x: this.position.x + Math.cos(rightTailAngle) * (this.midlen/2),
            y: this.position.y + Math.sin(rightTailAngle) * (this.midlen/2) 
        };

        const leftTailAngle = this.angle - (Math.PI / 2);
        this.shape.leftTail = {
            x: this.position.x + Math.cos(leftTailAngle) * (this.midlen/2),
            y: this.position.y + Math.sin(leftTailAngle) * (this.midlen/2) 
        }

        //console.log(this.shape.head, this.shape.leftTail, this.shape.rightTail);

    }
}

// Implementation

const colors = [
    '#2185C5',
    '#7ECEFD',
    '#FF7F66'
];

var boids = [] 
var total_boids = 100;

function init() {
    boids = [];
    for (let i = 0; i < total_boids; i++) {
        const speed = 2;
        const midlen = 20;
        const color = utils.randomColor(colors);
        const x = utils.randomIntFromRange(midlen, canvas.width - midlen);
        const y = utils.randomIntFromRange(midlen, canvas.height - midlen)
        boids.push(new Boid(x, y, midlen, speed, color));
    }
}

function animate() {
    requestAnimationFrame(animate);
    c.clearRect(0, 0, canvas.width, canvas.height);

    Object.entries(keys).forEach(entry => {
        if (entry[1]) {
            switch(entry[0]) {
                case 'r':
                    init();
                    break;    
            }
        }
    });

    boids.forEach(boid => {
        boid.update(boids);
    })
}

init();
animate();