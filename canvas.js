// Referencing objects

const canvas = document.querySelector('canvas');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight - 4;

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
    canvas.height = window.innerHeight - 4;

    if (restart)
        init();
});

const maxSpeed = 6;

// Utilities

function randomIntFromRange(min, max) {
    return Math.random() * (max - min) + min;
}

function distance(pos1, pos2) {
    if (pos1 != undefined && pos1.x != undefined && pos1.y != undefined && pos2 != undefined && pos2.x != undefined && pos2.y != undefined) {
        let xDist = pos1.x - pos2.x;
        let yDist = pos1.y - pos2.y;
        return Math.sqrt(Math.pow(xDist,2) + Math.pow(yDist, 2));
    }
    throw Error('Missing parameters');
}

/**
 * Rotates coordinate system for velocities
 *
 * Takes velocities and alters them as if the coordinate system they're on was rotated
 *
 * @param  Object | velocity | The velocity of an individual particle
 * @param  Float  | angle    | The angle of collision between two objects in radians
 * @return Object | The altered x and y velocities after the coordinate system has been rotated
 */

function rotate(velocity, angle) {
    const rotatedVelocities = {
        x: velocity.x * Math.cos(angle) - velocity.y * Math.sin(angle),
        y: velocity.x * Math.sin(angle) + velocity.y * Math.cos(angle)
    };

    return rotatedVelocities;
}

/**
 * Swaps out two colliding particles' x and y velocities after running through
 * an elastic collision reaction equation
 *
 * @param  Object | particle      | A particle object with x and y coordinates, plus velocity
 * @param  Object | otherParticle | A particle object with x and y coordinates, plus velocity
 * @return Null | Does not return a value
 */

function resolveCollision(particle, otherParticle) {
    const xVelocityDiff = particle.velocity.x - otherParticle.velocity.x;
    const yVelocityDiff = particle.velocity.y - otherParticle.velocity.y;

    const xDist = otherParticle.x - particle.x;
    const yDist = otherParticle.y - particle.y;

    // Prevent accidental overlap of particles
    if (xVelocityDiff * xDist + yVelocityDiff * yDist >= 0) {

        // Grab angle between the two colliding particles
        const angle = -Math.atan2(otherParticle.y - particle.y, otherParticle.x - particle.x);

        // Store mass in var for better readability in collision equation
        const m1 = particle.mass;
        const m2 = otherParticle.mass;

        // Velocity before equation
        const u1 = rotate(particle.velocity, angle);
        const u2 = rotate(otherParticle.velocity, angle);

        // Velocity after 1d collision equation
        const v1 = { x: u1.x * (m1 - m2) / (m1 + m2) + u2.x * 2 * m2 / (m1 + m2), y: u1.y };
        const v2 = { x: u2.x * (m1 - m2) / (m1 + m2) + u1.x * 2 * m2 / (m1 + m2), y: u2.y };

        // Final velocity after rotating axis back to original location
        const vFinal1 = rotate(v1, -angle);
        const vFinal2 = rotate(v2, -angle);

        // Swap particle velocities for realistic bounce effect
        particle.velocity.x = vFinal1.x;
        particle.velocity.y = vFinal1.y;

        otherParticle.velocity.x = vFinal2.x;
        otherParticle.velocity.y = vFinal2.y;
    }
}

function randomColor(colors) {
    return colors[Math.floor(Math.random() * colors.length)];
}

// Implementation

const opacityIncreaseRate = 0.02;
const opacityDecreaseRate = 0.04;
const minOpacity = 0;
const maxOpacity = 0.3;
const friction = 0.995;

const mouseHighlightParticleRadius = 100;

class Particle {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.velocity = {
            x: randomIntFromRange(-2.5, 2.5),
            y: randomIntFromRange(-2.5, 2.5)
        }
        this.acceleration = {
            x: 0,
            y: 0
        }
        this.radius = radius;
        this.color = color;
        this.mass = 1;
        this.opacity = minOpacity;
    }

    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.save();
        c.globalAlpha = this.opacity;
        c.fillStyle = this.color;
        c.fill();
        c.restore();
        c.strokeStyle = this.color;
        c.stroke();
        c.closePath();
    }

    update(particles) {
        this.draw();

        for (let i = 0; i < particles.length; i++) {
            if (this === particles[i]) continue;
            if (distance({x: this.x, y: this.y}, {x: particles[i].x, y: particles[i].y}) - (this.radius + particles[i].radius) < 0) {
                resolveCollision(this, particles[i]);
            }
        }

        if (this.x - this.radius <= 0 || this.x + this.radius >= canvas.width) {
            this.velocity.x = -this.velocity.x;
        }

        if (this.y - this.radius <= 0 || this.y + this.radius >= canvas.height) {
            this.velocity.y = -this.velocity.y;
        }

        // mouse collision detection

        if (mouse.x && mouse.y) {
            if (distance({x: this.x, y: this.y}, {x: mouse.x, y: mouse.y}) < mouseHighlightParticleRadius && (this.opacity + opacityIncreaseRate) <= maxOpacity) {
                this.opacity += opacityIncreaseRate;
            }
            else if ((this.opacity - opacityDecreaseRate) >= minOpacity) {
                this.opacity -= opacityDecreaseRate;
            }
        }

        if (this.acceleration.x != 0 && Math.abs(this.velocity.x + this.acceleration.x) < maxSpeed) {
            this.velocity.x += this.acceleration.x;
            this.acceleration.x = 0;
        }

        if (this.acceleration.y != 0 && Math.abs(this.velocity.y + this.acceleration.y) < maxSpeed) {
            this.velocity.y += this.acceleration.y;
            this.acceleration.y = 0;
        }
    
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        this.velocity.x *= friction;
        this.velocity.y *= friction;
    }
}

const colors = [
    '#2185C5',
    '#7ECEFD',
    '#FF7F66'
];

const total_particles = 400;

let particles = [];
let my_particle;

function init() {
    particles = [];

    for (let i = 0; i < total_particles; i++) {
        const radius = 15;
        let x = randomIntFromRange(radius, canvas.width - radius);
        let y = randomIntFromRange(radius, canvas.height - radius);
        const color = randomColor(colors);

        if (x < radius || x > canvas.width - radius)
            console.log("Error");

        if (i !== 0) {
            for (let j = 0; j < particles.length; j++) {
                if (distance({x, y}, {x: particles[j].x, y: particles[j].y}) - (radius + particles[j].radius) < 0) {
                    x = randomIntFromRange(radius, canvas.width - radius);
                    y = randomIntFromRange(radius, canvas.height - radius);
                    
                    j = -1;
                }
            }
        }

        particles.push(new Particle(x, y, radius, color));
    }

    my_particle = particles[0];
    my_particle.color = 'green';
}

const keys = {};

function animate() {
    requestAnimationFrame(animate);
    c.clearRect(0, 0, canvas.width, canvas.height);

    Object.entries(keys).forEach(entry => {
        if (entry[1]) {
            switch(entry[0]) {
                case 'ArrowUp':
                    if (my_particle.velocity.y - 1 >= - maxSpeed)
                        my_particle.velocity.y += -1;
                    // my_particle.acceleration.y = -1;
                    break;
                case 'ArrowDown':
                    if (my_particle.velocity.y + 1 <= maxSpeed )
                        my_particle.velocity.y += 1;
                    // my_particle.acceleration.y = 1;
                    break;
                case 'ArrowLeft':
                    if (my_particle.velocity.x - 1 >= - maxSpeed)
                        my_particle.velocity.x += -1;
                    // my_particle.acceleration.x = -1;
                    break;
                case 'ArrowRight':
                    if (my_particle.velocity.x + 1 <= maxSpeed)
                        my_particle.velocity.x += 1;
                    // my_particle.acceleration.x = 1;                        
                    break;
                case 'r':
                    init();
                    break;    
            }
        }
    });

    particles.forEach(particle => {
        particle.update(particles);
    })
}



window.addEventListener('keydown', (event) => {
    const key = event.key;
    keys[key] = true;
});

window.addEventListener('keyup', (event) => {
    const key = event.key;
    keys[key] = false;
});

init();
animate();