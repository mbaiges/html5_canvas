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

class Boid{
    constructor(x, y, midlen, speed, color, highlighted){
        this.position = {
            x: x,
            y: y
        }
        this.headAlpha = Math.PI / 3;
        this.midlen = midlen;
        this.speed = speed;
        this.calculateVelocity();
        this.calculateShape();
        this.color = color;
        this.highlighted = highlighted;
    }
    
    draw(){
        c.beginPath();
        c.globalAlpha = 1;
        c.fillStyle = this.color;
        c.moveTo(this.shape.head.x, this.shape.head.y);
        c.lineTo(this.shape.leftTail.x, this.shape.leftTail.y);
        c.lineTo(this.shape.tailBreak.x, this.shape.tailBreak.y);
        c.lineTo(this.shape.rightTail.x, this.shape.rightTail.y);
        c.closePath();
        c.fill();

        if (this.highlighted) {
            c.beginPath();
            c.fillStyle = 'red';
            c.arc(this.position.x, this.position.y, closeBoidsRange, 0, 2 * Math.PI, false);
            c.globalAlpha = 0.2;
            c.closePath();
            c.fill();
        }
    }
    
    update(boids){

        const closestBoids = this.findBoidsInRange(boids)
        
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
        const higlighted = i==0? 1:0;
        const speed = 2;
        const midlen = 20;
        const color = utils.randomColor(colors);
        const x = utils.randomIntFromRange(midlen, canvas.width - midlen);
        const y = utils.randomIntFromRange(midlen, canvas.height - midlen)
        boids.push(new Boid(x, y, midlen, speed, color, higlighted));
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