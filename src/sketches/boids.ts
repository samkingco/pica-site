interface BoidsProps {
	topologicalNeighbors?: string;
	interactionMode?: string;
}

export default function (p: any, container: HTMLElement, props: BoidsProps) {
	const topologicalNeighbors = props.topologicalNeighbors
		? Number(props.topologicalNeighbors)
		: null;
	const interactionMode = props.interactionMode || "predator";

	const boids: Boid[] = [];
	const numBoids = 150;
	let prevMouseX = 0;
	let prevMouseY = 0;
	let mouseSpeed = 0;

	class Boid {
		position: any;
		velocity: any;
		acceleration: any;
		maxForce = 0.2;
		maxSpeed = 4;
		perceptionRadius: number | null;

		constructor() {
			this.position = p.createVector(
				p.random(p.width),
				p.random(p.height),
			);
			this.velocity = p.constructor.Vector.random2D();
			this.velocity.setMag(p.random(2, 4));
			this.acceleration = p.createVector();
			this.perceptionRadius = topologicalNeighbors ? null : 50;
		}

		edges() {
			if (this.position.x > p.width) this.position.x = 0;
			else if (this.position.x < 0) this.position.x = p.width;
			if (this.position.y > p.height) this.position.y = 0;
			else if (this.position.y < 0) this.position.y = p.height;
		}

		getNearestNeighbors(boids: Boid[]) {
			const distances: { boid: Boid; distance: number }[] = [];
			for (const other of boids) {
				if (other === this) continue;
				const d = p.dist(
					this.position.x,
					this.position.y,
					other.position.x,
					other.position.y,
				);
				distances.push({ boid: other, distance: d });
			}
			distances.sort((a: any, b: any) => a.distance - b.distance);
			return distances
				.slice(0, topologicalNeighbors!)
				.map((d: any) => d.boid);
		}

		getNeighbors(boids: Boid[]) {
			if (topologicalNeighbors) return this.getNearestNeighbors(boids);
			return boids.filter((other) => {
				if (other === this) return false;
				const d = p.dist(
					this.position.x,
					this.position.y,
					other.position.x,
					other.position.y,
				);
				return d < this.perceptionRadius!;
			});
		}

		align(neighbors: Boid[]) {
			const steering = p.createVector();
			if (neighbors.length === 0) return steering;
			for (const other of neighbors) steering.add(other.velocity);
			steering.div(neighbors.length);
			steering.setMag(this.maxSpeed);
			steering.sub(this.velocity);
			steering.limit(this.maxForce);
			return steering;
		}

		cohesion(neighbors: Boid[]) {
			const steering = p.createVector();
			if (neighbors.length === 0) return steering;
			for (const other of neighbors) steering.add(other.position);
			steering.div(neighbors.length);
			steering.sub(this.position);
			steering.setMag(this.maxSpeed);
			steering.sub(this.velocity);
			steering.limit(this.maxForce);
			return steering;
		}

		separation(neighbors: Boid[]) {
			const steering = p.createVector();
			if (neighbors.length === 0) return steering;
			for (const other of neighbors) {
				const d = p.dist(
					this.position.x,
					this.position.y,
					other.position.x,
					other.position.y,
				);
				const diff = p.constructor.Vector.sub(
					this.position,
					other.position,
				);
				diff.div(d * d);
				steering.add(diff);
			}
			steering.div(neighbors.length);
			steering.setMag(this.maxSpeed);
			steering.sub(this.velocity);
			steering.limit(this.maxForce);
			return steering;
		}

		interact(target: any, speed: number) {
			let steering = p.createVector();
			const d = p.dist(
				this.position.x,
				this.position.y,
				target.x,
				target.y,
			);

			if (interactionMode === "dynamic") {
				const speedThreshold = 10;
				const influenceRadius = 150;
				if (d < influenceRadius && speed > 0.5) {
					if (speed < speedThreshold) {
						const diff = p.constructor.Vector.sub(
							target,
							this.position,
						);
						diff.setMag(this.maxSpeed * 0.5);
						steering = diff.sub(this.velocity);
						steering.limit(this.maxForce * 0.8);
					} else {
						const diff = p.constructor.Vector.sub(
							this.position,
							target,
						);
						diff.div(d * d);
						steering.add(diff);
						steering.setMag(this.maxSpeed * 2);
						steering.sub(this.velocity);
						steering.limit(this.maxForce * 3);
					}
				}
			} else {
				if (d < 100) {
					const diff = p.constructor.Vector.sub(
						this.position,
						target,
					);
					diff.div(d * d);
					steering.add(diff);
					steering.setMag(this.maxSpeed * 2);
					steering.sub(this.velocity);
					steering.limit(this.maxForce * 3);
				}
			}
			return steering;
		}

		flock(boids: Boid[], target: any, speed: number) {
			const neighbors = this.getNeighbors(boids);
			this.acceleration.add(this.align(neighbors));
			this.acceleration.add(this.cohesion(neighbors));
			this.acceleration.add(this.separation(neighbors));
			this.acceleration.add(this.interact(target, speed));
		}

		update() {
			this.position.add(this.velocity);
			this.velocity.add(this.acceleration);
			this.velocity.limit(this.maxSpeed);
			this.acceleration.mult(0);
		}

		show() {
			p.strokeWeight(4);
			p.stroke(255, 255, 255, 180);
			p.point(this.position.x, this.position.y);
		}
	}

	p.setup = () => {
		const canvas = p.createCanvas(
			container.offsetWidth,
			container.offsetHeight,
		);
		canvas.parent(container);
		for (let i = 0; i < numBoids; i++) {
			boids.push(new Boid());
		}
		prevMouseX = p.mouseX;
		prevMouseY = p.mouseY;
	};

	p.windowResized = () => {
		p.resizeCanvas(container.offsetWidth, container.offsetHeight);
	};

	p.draw = () => {
		p.background(20, 20, 20);

		if (interactionMode === "dynamic") {
			const dx = p.mouseX - prevMouseX;
			const dy = p.mouseY - prevMouseY;
			mouseSpeed = p.sqrt(dx * dx + dy * dy);
			prevMouseX = p.mouseX;
			prevMouseY = p.mouseY;
		}

		const target = p.createVector(p.mouseX, p.mouseY);

		for (const boid of boids) {
			boid.edges();
			boid.flock(boids, target, mouseSpeed);
			boid.update();
			boid.show();
		}
	};
}
