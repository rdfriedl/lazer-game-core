import p2 from "p2";
import { lerp } from "../../utils";
import Bullet from "../Bullet";
import { COLLISION_GROUPS } from "../../const";

export default class DefaultBullet extends Bullet {
	init() {
		super.init();

		// init data
		this.data.speed = 500;
		this.data.pathPosition = 0;
		this.data.position = { x: 0, y: 0 };
		this.data.path = DefaultBullet.calcPath(this.game.world, {
			start: [this.props.start.x, this.props.start.y],
			direction: this.props.direction,
		});
		this.data.pathLength = this.data.path.length ? this.data.path[this.data.path.length - 1][2] : 0;
	}
	update(d) {
		// move along the path
		this.data.pathPosition += this.data.speed * d;

		// set position
		this.data.position = DefaultBullet.pointOnPath(this.data.path, this.data.pathPosition);

		// set the direction
		this.data.direction = DefaultBullet.directionOnPath(this.data.path, this.data.pathPosition);

		// die if the bullet is at the end of the path
		if (this.data.pathPosition > this.data.pathLength && this.game.isMaster) this.die();
	}

	static calcPath(world, opts = {}) {
		if (!world) return [];
		opts = Object.assign(
			{},
			{
				maxDistance: 1000,
				maxBounces: 5,
				start: [0, 0],
				direction: 0,
			},
			opts,
		);

		let path = [],
			currentLength = 0;
		let ray = (this.calcPath.ray =
			this.calcPath.ray ||
			new p2.Ray({
				mode: p2.Ray.CLOSEST,
				collisionGroup: COLLISION_GROUPS.BULLET,
				collisionMask: COLLISION_GROUPS.WALLS,
			}));
		let result = (this.calcPath.result = this.calcPath.result || new p2.RaycastResult());
		let hitPoint = (this.calcPath.hitPoint = this.calcPath.hitPoint || p2.vec2.create());

		// set the rays direction
		ray.from[0] = opts.start[0];
		ray.from[1] = opts.start[1];
		ray.direction[0] = Math.cos(opts.direction);
		ray.direction[1] = Math.sin(opts.direction);

		ray.to[0] = ray.from[0] + ray.direction[0] * (opts.maxDistance - currentLength);
		ray.to[1] = ray.from[1] + ray.direction[1] * (opts.maxDistance - currentLength);

		ray.update();

		// cast
		path = [[opts.start[0], opts.start[1], 0]];
		let hits = 0;
		while (currentLength < opts.maxDistance && hits < opts.maxBounces) {
			if (world.raycast(result, ray)) {
				hits++;
				result.getHitPoint(hitPoint, ray);
				// add the path segment
				path.push([hitPoint[0], hitPoint[1], (currentLength += result.getHitDistance(ray))]);

				// move start to the hit point
				p2.vec2.copy(ray.from, hitPoint);

				// reflect the direction
				p2.vec2.reflect(ray.direction, ray.direction, result.normal);

				// move the ray out a bit
				ray.from[0] += ray.direction[0] * 0.001;
				ray.from[1] += ray.direction[1] * 0.001;
				ray.to[0] = ray.from[0] + ray.direction[0] * (opts.maxDistance - currentLength);
				ray.to[1] = ray.from[1] + ray.direction[1] * (opts.maxDistance - currentLength);
				ray.update();
				result.reset();
			} else {
				let distanceLeft = opts.maxDistance - currentLength;
				path.push([ray.to[0], ray.to[1], (currentLength += distanceLeft)]);
			}
		}

		return path;
	}

	/**
	 * @param path
	 * @param {Number} position - a number between 0 and 1
	 */
	static pointOnPath(path, position = 0) {
		let pos = {};
		let prev,
			next = path.find(point => point[2] > position);
		for (let i = path.length - 1; i >= 0; i--) {
			if (path[i][2] <= position) {
				prev = path[i];
				break;
			}
		}
		if (next) {
			let delta = (position - prev[2]) / (next[2] - prev[2]);
			pos.x = lerp(prev[0], next[0], delta);
			pos.y = lerp(prev[1], next[1], delta);
		} else {
			pos.x = prev[0];
			pos.y = prev[1];
		}

		return pos;
	}

	/**
	 * returns the bullets directions on a point on the path
	 * @param path
	 * @param position
	 * @return {number} - the rotation is in radians
	 */
	static directionOnPath(path, position = 0) {
		let prev,
			next = path.find(point => point[2] > position);
		for (let i = path.length - 1; i >= 0; i--) {
			if (path[i][2] <= position) {
				prev = path[i];
				break;
			}
		}

		if (next) return Math.atan2(next[0] - prev[0], next[1] - prev[1]);

		return 0;
	}
}
