import Hashids from 'hashids';
import { Emitter } from 'regexp-events';
import p2 from 'p2';

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var get = function get(object, property, receiver) {
  if (object === null) object = Function.prototype;
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent === null) {
      return undefined;
    } else {
      return get(parent, property, receiver);
    }
  } else if ("value" in desc) {
    return desc.value;
  } else {
    var getter = desc.get;

    if (getter === undefined) {
      return undefined;
    }

    return getter.call(receiver);
  }
};

var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};

var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};

var Bullet = function (_Emitter) {
	inherits(Bullet, _Emitter);

	function Bullet(manager) {
		var info = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
		var props = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
		classCallCheck(this, Bullet);

		var _this = possibleConstructorReturn(this, (Bullet.__proto__ || Object.getPrototypeOf(Bullet)).call(this));

		_this.manager = manager;

		_this.id = Bullet.ids.encode(Date.now());

		// this is basic info about the bullet
		// like: who shot it, how long its supposed to last
		// NOTE: this is set once when the bullet is created and then never changes
		_this.info = Object.assign({
			owner: undefined
		}, info);

		// important info about the bullet
		// like: current speed, its path, who its locked onto, and so on
		// NOTE: everything a prop changes its sent to the clients
		_this.props = Object.assign({}, props);

		// this is anything that is used in the bullets update function
		// NOTE: this is not send to the client
		_this.data = {};

		// set the bullet up
		_this.init();
		return _this;
	}

	createClass(Bullet, [{
		key: "init",
		value: function init() {}
	}, {
		key: "setProp",
		value: function setProp(key, value) {
			if (key instanceof Object) {
				for (var i in key) {
					this.props[i] = key[i];
				}this.emit("props-changed", this.props);
			} else {
				this.props[key] = value;
				this.emit("props-changed", this.props);
			}

			return this;
		}
	}, {
		key: "getProp",
		value: function getProp(key) {
			return this.props[key];
		}
	}, {
		key: "update",
		value: function update(d) {}
	}, {
		key: "destroy",
		value: function destroy() {
			this.manager.removeBullet(this);
			return this;
		}
	}, {
		key: "die",
		value: function die() {
			return this.destroy();
		}
	}, {
		key: "toJSON",
		value: function toJSON() {
			var json = {
				id: this.id,
				info: this.info,
				props: this.props,
				type: this.type
			};

			this.emit("to-json", json);
			return json;
		}
	}, {
		key: "fromJSON",
		value: function fromJSON(json) {
			this.id = json.id || this.id;
			if (json.info) Object.assign(this.info, json.info);
			if (json.props) Object.assign(this.props, json.props);
			this.init();
			return this;
		}

		// overwrite emit so we can fire events on the manager

	}, {
		key: "emit",
		value: function emit(event) {
			var _Emitter$prototype$em, _manager, _manager2;

			for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
				args[_key - 1] = arguments[_key];
			}

			var v = (_Emitter$prototype$em = Emitter.prototype.emit).call.apply(_Emitter$prototype$em, [this, event].concat(args));
			(_manager = this.manager).emit.apply(_manager, ["bullet-" + event, this].concat(args));
			(_manager2 = this.manager).emit.apply(_manager2, ["bullet-" + this.id + "-" + event, this].concat(args));
			return v;
		}
	}, {
		key: "game",
		get: function get$$1() {
			return this.manager.game;
		}
	}, {
		key: "player",
		get: function get$$1() {
			return this.game.players.getPlayer(this.info.owner);
		}
	}, {
		key: "type",
		get: function get$$1() {
			return this.manager.getBulletType(this);
		}
	}]);
	return Bullet;
}(Emitter);

Bullet.ids = new Hashids("bullets");

function lerp(v0, v1, t) {
	return v0 * (1 - t) + v1 * t;
}

function clipDecimals(v) {
	var n = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 3;

	return Math.round(v * Math.pow(10, n)) / Math.pow(10, n);
}

var COLLISION_GROUPS = {
	PLAYER: Math.pow(2, 0),
	WALLS: Math.pow(2, 1),
	BULLET: Math.pow(2, 2)
};

COLLISION_GROUPS.ALL = Object.keys(COLLISION_GROUPS).map(function (key) {
	return COLLISION_GROUPS[key];
}).reduce(function (a, b) {
	return a | b;
});

var DefaultBullet = function (_Bullet) {
	inherits(DefaultBullet, _Bullet);

	function DefaultBullet() {
		classCallCheck(this, DefaultBullet);
		return possibleConstructorReturn(this, (DefaultBullet.__proto__ || Object.getPrototypeOf(DefaultBullet)).apply(this, arguments));
	}

	createClass(DefaultBullet, [{
		key: "init",
		value: function init() {
			get(DefaultBullet.prototype.__proto__ || Object.getPrototypeOf(DefaultBullet.prototype), "init", this).call(this);

			// init data
			this.data.speed = 500;
			this.data.pathPosition = 0;
			this.data.position = { x: 0, y: 0 };
			this.data.path = DefaultBullet.calcPath(this.game.world, {
				start: [this.props.start.x, this.props.start.y],
				direction: this.props.direction
			});
			this.data.pathLength = this.data.path.length ? this.data.path[this.data.path.length - 1][2] : 0;
		}
	}, {
		key: "update",
		value: function update(d) {
			// move along the path
			this.data.pathPosition += this.data.speed * d;

			// set position
			this.data.position = DefaultBullet.pointOnPath(this.data.path, this.data.pathPosition);

			// set the direction
			this.data.direction = DefaultBullet.directionOnPath(this.data.path, this.data.pathPosition);

			// die if the bullet is at the end of the path
			if (this.data.pathPosition > this.data.pathLength && this.game.isMaster) this.die();
		}
	}], [{
		key: "calcPath",
		value: function calcPath(world) {
			var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

			if (!world) return [];
			opts = Object.assign({}, {
				maxDistance: 1000,
				maxBounces: 5,
				start: [0, 0],
				direction: 0
			}, opts);

			var path = [],
			    currentLength = 0;
			var ray = this.calcPath.ray = this.calcPath.ray || new p2.Ray({
				mode: p2.Ray.CLOSEST,
				collisionGroup: COLLISION_GROUPS.BULLET,
				collisionMask: COLLISION_GROUPS.WALLS
			});
			var result = this.calcPath.result = this.calcPath.result || new p2.RaycastResult();
			var hitPoint = this.calcPath.hitPoint = this.calcPath.hitPoint || p2.vec2.create();

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
			var hits = 0;
			while (currentLength < opts.maxDistance && hits < opts.maxBounces) {
				if (world.raycast(result, ray)) {
					hits++;
					result.getHitPoint(hitPoint, ray);
					// add the path segment
					path.push([hitPoint[0], hitPoint[1], currentLength += result.getHitDistance(ray)]);

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
					var distanceLeft = opts.maxDistance - currentLength;
					path.push([ray.to[0], ray.to[1], currentLength += distanceLeft]);
				}
			}

			return path;
		}

		/**
   * @param path
   * @param {Number} position - a number between 0 and 1
   */

	}, {
		key: "pointOnPath",
		value: function pointOnPath(path) {
			var position = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

			var pos = {};
			var prev = void 0,
			    next = path.find(function (point) {
				return point[2] > position;
			});
			for (var i = path.length - 1; i >= 0; i--) {
				if (path[i][2] <= position) {
					prev = path[i];
					break;
				}
			}
			if (next) {
				var delta = (position - prev[2]) / (next[2] - prev[2]);
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

	}, {
		key: "directionOnPath",
		value: function directionOnPath(path) {
			var position = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

			var prev = void 0,
			    next = path.find(function (point) {
				return point[2] > position;
			});
			for (var i = path.length - 1; i >= 0; i--) {
				if (path[i][2] <= position) {
					prev = path[i];
					break;
				}
			}

			if (next) return Math.atan2(next[0] - prev[0], next[1] - prev[1]);

			return 0;
		}
	}]);
	return DefaultBullet;
}(Bullet);

var BulletManager = function (_Emitter) {
	inherits(BulletManager, _Emitter);

	function BulletManager(game) {
		classCallCheck(this, BulletManager);

		var _this = possibleConstructorReturn(this, (BulletManager.__proto__ || Object.getPrototypeOf(BulletManager)).call(this));

		_this.game = game;
		_this.bullets = [];
		return _this;
	}

	createClass(BulletManager, [{
		key: "createBullet",
		value: function createBullet(type, info, props) {
			var BulletType = BulletManager.BulletTypes[type];
			if (!BulletType) return;
			var bullet = new BulletType(this, info, props);
			this.bullets.push(bullet);
			this.emit("bullet-created", bullet);
			return bullet;
		}
	}, {
		key: "createFromJSON",
		value: function createFromJSON(json) {
			var BulletType = BulletManager.BulletTypes[json.type];
			if (!BulletType) return;
			var bullet = new BulletType(this, json.info, json.props);
			bullet.fromJSON(json);
			this.bullets.push(bullet);
			this.emit("bullet-created", bullet);
			return bullet;
		}
	}, {
		key: "getBullet",
		value: function getBullet(id) {
			if (id instanceof Bullet) return this.bullets.includes(id) ? id : undefined;else return this.bullets.find(function (bullet) {
				return bullet.id == id;
			});
		}
	}, {
		key: "removeBullet",
		value: function removeBullet(id) {
			var bullet = this.getBullet(id);
			if (this.bullets.includes(bullet)) {
				this.bullets.splice(this.bullets.indexOf(bullet), 1);
				this.emit("bullet-removed", bullet);
			}
			return this;
		}
	}, {
		key: "clearBullets",
		value: function clearBullets() {
			var _this2 = this;

			this.bullets.forEach(function (bullet) {
				return _this2.removeBullet(bullet);
			});
			this.bullets = [];
			return this;
		}
	}, {
		key: "update",
		value: function update(d) {
			// update the bullets
			this.bullets.forEach(function (bullet) {
				return bullet.update(d);
			});
		}
	}, {
		key: "toJSON",
		value: function toJSON() {
			var json = this.bullets.map(function (bullet) {
				return bullet.toJSON();
			});

			this.emit("to-json", json);
			return json;
		}
	}, {
		key: "fromJSON",
		value: function fromJSON(json) {
			var _this3 = this;

			this.clearBullets();

			json.forEach(function (data) {
				var bullet = _this3.createBullet(data.type);
				bullet.fromJSON(data.data);
			});

			this.emit("from-json", json);
			return this;
		}
	}, {
		key: "getBulletType",
		value: function getBulletType(bullet) {
			for (var id in BulletManager.BulletTypes) {
				if (bullet instanceof BulletManager.BulletTypes[id]) return id;
			}
		}
	}]);
	return BulletManager;
}(Emitter);


BulletManager.BulletTypes = {
	default: DefaultBullet
};
BulletManager.BULLET_TYPE = {
	DEFAULT: "default"
};

var Player = function (_Emitter) {
	inherits(Player, _Emitter);

	function Player(manager, info, props) {
		classCallCheck(this, Player);

		var _this = possibleConstructorReturn(this, (Player.__proto__ || Object.getPrototypeOf(Player)).call(this));

		_this.manager = manager;
		_this.id = Player.ids.encode(Date.now());

		// this is basic info about the player
		// NOTE: this is set once when the bullet is created and then never changes
		_this.info = {
			name: undefined,
			color: 0x000000
		};
		_this.props = {
			health: 100,
			spawned: false
		};
		_this.position = {
			x: 0,
			y: 0,
			vx: 0,
			vy: 0,
			direction: 0
		};
		_this.controls = {
			moveX: 0,
			moveY: 0,
			shoot: false,
			direction: 0
		};

		_this.body = new p2.Body({
			mass: 10,
			damping: 0,
			fixedRotation: true
		});
		_this.body.addShape(new p2.Circle({
			radius: 10
		}));

		_this.body.shapes.forEach(function (shape) {
			shape.collisionGroup = COLLISION_GROUPS.PLAYER;
			shape.collisionMask = COLLISION_GROUPS.WALLS | COLLISION_GROUPS.BULLET | COLLISION_GROUPS.PLAYER;
		});

		// tmp gun var
		_this.cooldown = 0.15;
		_this.tmp = 0;

		if (info) _this.setInfo(info);

		if (props) _this.setProp(props);
		return _this;
	}

	createClass(Player, [{
		key: "setProp",
		value: function setProp(key, value) {
			if (key instanceof Object) {
				for (var i in key) {
					this.props[i] = key[i];
				}this.emit("props-changed", this.props);
			} else {
				this.props[key] = value;
				this.emit("props-changed", this.props);
			}

			return this;
		}
	}, {
		key: "setInfo",
		value: function setInfo(key, value) {
			if (key instanceof Object) {
				for (var i in key) {
					this.info[i] = key[i];
				}this.emit("info-changed", this.info);
			} else {
				this.info[key] = value;
				this.emit("info-changed", this.info);
			}

			return this;
		}
	}, {
		key: "setControl",
		value: function setControl(key, value) {
			if (key instanceof Object) {
				for (var i in key) {
					this.controls[i] = key[i];
				}this.emit("controls-changed", this.controls);
			} else {
				this.controls[key] = value;
				this.emit("controls-changed", this.controls);
			}

			return this;
		}
	}, {
		key: "getProp",
		value: function getProp(key, value) {
			return this.props[key];
		}
	}, {
		key: "getInfo",
		value: function getInfo(key, value) {
			return this.info[key];
		}
	}, {
		key: "getControl",
		value: function getControl(key, value) {
			return this.controls[key];
		}
	}, {
		key: "setPosition",
		value: function setPosition() {
			var x = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.body.position[0];
			var y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.body.position[1];
			var vx = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
			var vy = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
			var direction = arguments[4];

			this.body.position[0] = x;
			this.body.position[1] = y;
			this.body.velocity[0] = vx;
			this.body.velocity[1] = vy;

			// TODO: set the rotation on the p2 body instead
			this.position.direction = direction;

			// update position
			this._updatePosition();
		}
	}, {
		key: "update",
		value: function update(d) {
			var _game$config$player$m = this.game.config.player.movement,
			    speed = _game$config$player$m.speed,
			    excelerate = _game$config$player$m.excelerate,
			    decelerate = _game$config$player$m.decelerate;

			// apply controls

			if (this.controls.moveX !== 0) this.body.velocity[0] = lerp(this.body.velocity[0], speed * Math.sign(this.controls.moveX), excelerate);else this.body.velocity[0] *= decelerate;

			if (this.controls.moveY !== 0) this.body.velocity[1] = lerp(this.body.velocity[1], speed * Math.sign(this.controls.moveY), excelerate);else this.body.velocity[1] *= decelerate;

			this.tmp += d;
			if (this.controls.shoot && this.game.isMaster) {
				if (this.tmp > this.cooldown) {
					this.tmp = 0;
					this.game.bullets.createBullet(BulletManager.BULLET_TYPE.DEFAULT, { owner: this.id }, {
						start: { x: this.position.x, y: this.position.y },
						direction: this.controls.direction + (Math.random() - 0.5) * (Math.PI / 32)
					});
				}
			}

			// update position
			this._updatePosition();

			this.emit("update", d);
		}
	}, {
		key: "_updatePosition",
		value: function _updatePosition() {
			this.position.x = clipDecimals(this.body.position[0]);
			this.position.y = clipDecimals(this.body.position[1]);
			this.position.vx = clipDecimals(this.body.velocity[0]);
			this.position.vy = clipDecimals(this.body.velocity[1]);
		}
	}, {
		key: "toJSON",
		value: function toJSON() {
			var json = {
				id: this.id,
				info: this.info,
				props: this.props,
				position: this.position,
				controls: this.controls
			};

			this.emit("to-json", json);

			return json;
		}
	}, {
		key: "fromJSON",
		value: function fromJSON(json) {
			this.id = json.id;
			this.setInfo(json.info);
			this.setProp(json.props);
			this.setControl(json.controls);
			Object.assign(this.position, json.position);

			this.emit("from-json", json);

			return this;
		}

		// overwrite emit so we can fire events on the manager

	}, {
		key: "emit",
		value: function emit(event) {
			var _Emitter$prototype$em, _manager, _manager2;

			for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
				args[_key - 1] = arguments[_key];
			}

			var v = (_Emitter$prototype$em = Emitter.prototype.emit).call.apply(_Emitter$prototype$em, [this, event].concat(args));
			(_manager = this.manager).emit.apply(_manager, ["player-" + event, this].concat(args));
			(_manager2 = this.manager).emit.apply(_manager2, ["player-" + this.id + "-" + event, this].concat(args));
			return v;
		}
	}, {
		key: "game",
		get: function get$$1() {
			return this.manager.game;
		}
	}]);
	return Player;
}(Emitter);

Player.ids = new Hashids("players");

var PlayerManager = function (_Emitter) {
	inherits(PlayerManager, _Emitter);

	function PlayerManager(game) {
		classCallCheck(this, PlayerManager);

		var _this = possibleConstructorReturn(this, (PlayerManager.__proto__ || Object.getPrototypeOf(PlayerManager)).call(this));

		_this.game = game;
		_this.players = [];
		return _this;
	}

	createClass(PlayerManager, [{
		key: "getPlayer",
		value: function getPlayer(id) {
			if (id instanceof Player) return this.players.includes(id) ? id : undefined;else return this.players.find(function (player) {
				return player.id === id;
			});
		}
	}, {
		key: "createPlayer",
		value: function createPlayer(info, props) {
			var player = new Player(this, info, props);

			// add the player to the list of players
			this.players.push(player);
			// add the player to the world
			this.game.world.addBody(player.body);

			this.emit("player-created", player);
			return player;
		}
	}, {
		key: "createFromJSON",
		value: function createFromJSON(json) {
			var player = new Player(this, json.info, json.props);
			player.fromJSON(json);

			// add the player to the list of players
			this.players.push(player);
			// add the player to the world
			this.game.world.addBody(player.body);

			this.emit("player-created", player);
			return player;
		}
	}, {
		key: "removePlayer",
		value: function removePlayer(id) {
			var player = this.getPlayer(id);
			if (this.players.includes(player)) {
				// remove player from the list
				this.players.splice(this.players.indexOf(player), 1);
				// remove the player from the world
				this.game.world.removeBody(player.body);

				this.emit("player-removed", player);
			}
			return this;
		}
	}, {
		key: "clearPlayers",
		value: function clearPlayers() {
			var players = Array.from(this.players);
			this.players.forEach(this.removePlayer.bind(this));
			this.emit("players-cleared", players);
			return this;
		}
	}, {
		key: "update",
		value: function update(d) {
			this.players.forEach(function (player) {
				return player.update(d);
			});
		}
	}, {
		key: "toJSON",
		value: function toJSON() {
			var json = this.players.map(function (player) {
				return player.toJSON();
			});
			this.emit("to-json", json);
			return json;
		}
	}, {
		key: "fromJSON",
		value: function fromJSON(json) {
			var _this2 = this;

			this.clearPlayers();
			json.forEach(function (data) {
				var player = _this2.createPlayer();
				player.fromJSON(data);
			});
			this.emit("from-json", json);
			return this;
		}
	}]);
	return PlayerManager;
}(Emitter);

/**
 * Removes all key-value entries from the list cache.
 *
 * @private
 * @name clear
 * @memberOf ListCache
 */
function listCacheClear() {
  this.__data__ = [];
  this.size = 0;
}

var _listCacheClear = listCacheClear;

/**
 * Performs a
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * comparison between two values to determine if they are equivalent.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.eq(object, object);
 * // => true
 *
 * _.eq(object, other);
 * // => false
 *
 * _.eq('a', 'a');
 * // => true
 *
 * _.eq('a', Object('a'));
 * // => false
 *
 * _.eq(NaN, NaN);
 * // => true
 */
function eq(value, other) {
  return value === other || (value !== value && other !== other);
}

var eq_1 = eq;

/**
 * Gets the index at which the `key` is found in `array` of key-value pairs.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} key The key to search for.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function assocIndexOf(array, key) {
  var length = array.length;
  while (length--) {
    if (eq_1(array[length][0], key)) {
      return length;
    }
  }
  return -1;
}

var _assocIndexOf = assocIndexOf;

/** Used for built-in method references. */
var arrayProto = Array.prototype;

/** Built-in value references. */
var splice = arrayProto.splice;

/**
 * Removes `key` and its value from the list cache.
 *
 * @private
 * @name delete
 * @memberOf ListCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function listCacheDelete(key) {
  var data = this.__data__,
      index = _assocIndexOf(data, key);

  if (index < 0) {
    return false;
  }
  var lastIndex = data.length - 1;
  if (index == lastIndex) {
    data.pop();
  } else {
    splice.call(data, index, 1);
  }
  --this.size;
  return true;
}

var _listCacheDelete = listCacheDelete;

/**
 * Gets the list cache value for `key`.
 *
 * @private
 * @name get
 * @memberOf ListCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function listCacheGet(key) {
  var data = this.__data__,
      index = _assocIndexOf(data, key);

  return index < 0 ? undefined : data[index][1];
}

var _listCacheGet = listCacheGet;

/**
 * Checks if a list cache value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf ListCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function listCacheHas(key) {
  return _assocIndexOf(this.__data__, key) > -1;
}

var _listCacheHas = listCacheHas;

/**
 * Sets the list cache `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf ListCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the list cache instance.
 */
function listCacheSet(key, value) {
  var data = this.__data__,
      index = _assocIndexOf(data, key);

  if (index < 0) {
    ++this.size;
    data.push([key, value]);
  } else {
    data[index][1] = value;
  }
  return this;
}

var _listCacheSet = listCacheSet;

/**
 * Creates an list cache object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function ListCache(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `ListCache`.
ListCache.prototype.clear = _listCacheClear;
ListCache.prototype['delete'] = _listCacheDelete;
ListCache.prototype.get = _listCacheGet;
ListCache.prototype.has = _listCacheHas;
ListCache.prototype.set = _listCacheSet;

var _ListCache = ListCache;

/**
 * Removes all key-value entries from the stack.
 *
 * @private
 * @name clear
 * @memberOf Stack
 */
function stackClear() {
  this.__data__ = new _ListCache;
  this.size = 0;
}

var _stackClear = stackClear;

/**
 * Removes `key` and its value from the stack.
 *
 * @private
 * @name delete
 * @memberOf Stack
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function stackDelete(key) {
  var data = this.__data__,
      result = data['delete'](key);

  this.size = data.size;
  return result;
}

var _stackDelete = stackDelete;

/**
 * Gets the stack value for `key`.
 *
 * @private
 * @name get
 * @memberOf Stack
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function stackGet(key) {
  return this.__data__.get(key);
}

var _stackGet = stackGet;

/**
 * Checks if a stack value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Stack
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function stackHas(key) {
  return this.__data__.has(key);
}

var _stackHas = stackHas;

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;

var _freeGlobal = freeGlobal;

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = _freeGlobal || freeSelf || Function('return this')();

var _root = root;

/** Built-in value references. */
var Symbol$1 = _root.Symbol;

var _Symbol = Symbol$1;

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/** Built-in value references. */
var symToStringTag = _Symbol ? _Symbol.toStringTag : undefined;

/**
 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the raw `toStringTag`.
 */
function getRawTag(value) {
  var isOwn = hasOwnProperty.call(value, symToStringTag),
      tag = value[symToStringTag];

  try {
    value[symToStringTag] = undefined;
    var unmasked = true;
  } catch (e) {}

  var result = nativeObjectToString.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag] = tag;
    } else {
      delete value[symToStringTag];
    }
  }
  return result;
}

var _getRawTag = getRawTag;

/** Used for built-in method references. */
var objectProto$1 = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString$1 = objectProto$1.toString;

/**
 * Converts `value` to a string using `Object.prototype.toString`.
 *
 * @private
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 */
function objectToString(value) {
  return nativeObjectToString$1.call(value);
}

var _objectToString = objectToString;

/** `Object#toString` result references. */
var nullTag = '[object Null]',
    undefinedTag = '[object Undefined]';

/** Built-in value references. */
var symToStringTag$1 = _Symbol ? _Symbol.toStringTag : undefined;

/**
 * The base implementation of `getTag` without fallbacks for buggy environments.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag(value) {
  if (value == null) {
    return value === undefined ? undefinedTag : nullTag;
  }
  return (symToStringTag$1 && symToStringTag$1 in Object(value))
    ? _getRawTag(value)
    : _objectToString(value);
}

var _baseGetTag = baseGetTag;

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return value != null && (type == 'object' || type == 'function');
}

var isObject_1 = isObject;

/** `Object#toString` result references. */
var asyncTag = '[object AsyncFunction]',
    funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]',
    proxyTag = '[object Proxy]';

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  if (!isObject_1(value)) {
    return false;
  }
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 9 which returns 'object' for typed arrays and other constructors.
  var tag = _baseGetTag(value);
  return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
}

var isFunction_1 = isFunction;

/** Used to detect overreaching core-js shims. */
var coreJsData = _root['__core-js_shared__'];

var _coreJsData = coreJsData;

/** Used to detect methods masquerading as native. */
var maskSrcKey = (function() {
  var uid = /[^.]+$/.exec(_coreJsData && _coreJsData.keys && _coreJsData.keys.IE_PROTO || '');
  return uid ? ('Symbol(src)_1.' + uid) : '';
}());

/**
 * Checks if `func` has its source masked.
 *
 * @private
 * @param {Function} func The function to check.
 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
 */
function isMasked(func) {
  return !!maskSrcKey && (maskSrcKey in func);
}

var _isMasked = isMasked;

/** Used for built-in method references. */
var funcProto = Function.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/**
 * Converts `func` to its source code.
 *
 * @private
 * @param {Function} func The function to convert.
 * @returns {string} Returns the source code.
 */
function toSource(func) {
  if (func != null) {
    try {
      return funcToString.call(func);
    } catch (e) {}
    try {
      return (func + '');
    } catch (e) {}
  }
  return '';
}

var _toSource = toSource;

/**
 * Used to match `RegExp`
 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
 */
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

/** Used to detect host constructors (Safari). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Used for built-in method references. */
var funcProto$1 = Function.prototype,
    objectProto$2 = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString$1 = funcProto$1.toString;

/** Used to check objects for own properties. */
var hasOwnProperty$1 = objectProto$2.hasOwnProperty;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' +
  funcToString$1.call(hasOwnProperty$1).replace(reRegExpChar, '\\$&')
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/**
 * The base implementation of `_.isNative` without bad shim checks.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function,
 *  else `false`.
 */
function baseIsNative(value) {
  if (!isObject_1(value) || _isMasked(value)) {
    return false;
  }
  var pattern = isFunction_1(value) ? reIsNative : reIsHostCtor;
  return pattern.test(_toSource(value));
}

var _baseIsNative = baseIsNative;

/**
 * Gets the value at `key` of `object`.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */
function getValue(object, key) {
  return object == null ? undefined : object[key];
}

var _getValue = getValue;

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = _getValue(object, key);
  return _baseIsNative(value) ? value : undefined;
}

var _getNative = getNative;

/* Built-in method references that are verified to be native. */
var Map = _getNative(_root, 'Map');

var _Map = Map;

/* Built-in method references that are verified to be native. */
var nativeCreate = _getNative(Object, 'create');

var _nativeCreate = nativeCreate;

/**
 * Removes all key-value entries from the hash.
 *
 * @private
 * @name clear
 * @memberOf Hash
 */
function hashClear() {
  this.__data__ = _nativeCreate ? _nativeCreate(null) : {};
  this.size = 0;
}

var _hashClear = hashClear;

/**
 * Removes `key` and its value from the hash.
 *
 * @private
 * @name delete
 * @memberOf Hash
 * @param {Object} hash The hash to modify.
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function hashDelete(key) {
  var result = this.has(key) && delete this.__data__[key];
  this.size -= result ? 1 : 0;
  return result;
}

var _hashDelete = hashDelete;

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/** Used for built-in method references. */
var objectProto$3 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$2 = objectProto$3.hasOwnProperty;

/**
 * Gets the hash value for `key`.
 *
 * @private
 * @name get
 * @memberOf Hash
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function hashGet(key) {
  var data = this.__data__;
  if (_nativeCreate) {
    var result = data[key];
    return result === HASH_UNDEFINED ? undefined : result;
  }
  return hasOwnProperty$2.call(data, key) ? data[key] : undefined;
}

var _hashGet = hashGet;

/** Used for built-in method references. */
var objectProto$4 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$3 = objectProto$4.hasOwnProperty;

/**
 * Checks if a hash value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Hash
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function hashHas(key) {
  var data = this.__data__;
  return _nativeCreate ? (data[key] !== undefined) : hasOwnProperty$3.call(data, key);
}

var _hashHas = hashHas;

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED$1 = '__lodash_hash_undefined__';

/**
 * Sets the hash `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Hash
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the hash instance.
 */
function hashSet(key, value) {
  var data = this.__data__;
  this.size += this.has(key) ? 0 : 1;
  data[key] = (_nativeCreate && value === undefined) ? HASH_UNDEFINED$1 : value;
  return this;
}

var _hashSet = hashSet;

/**
 * Creates a hash object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Hash(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `Hash`.
Hash.prototype.clear = _hashClear;
Hash.prototype['delete'] = _hashDelete;
Hash.prototype.get = _hashGet;
Hash.prototype.has = _hashHas;
Hash.prototype.set = _hashSet;

var _Hash = Hash;

/**
 * Removes all key-value entries from the map.
 *
 * @private
 * @name clear
 * @memberOf MapCache
 */
function mapCacheClear() {
  this.size = 0;
  this.__data__ = {
    'hash': new _Hash,
    'map': new (_Map || _ListCache),
    'string': new _Hash
  };
}

var _mapCacheClear = mapCacheClear;

/**
 * Checks if `value` is suitable for use as unique object key.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
 */
function isKeyable(value) {
  var type = typeof value;
  return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
    ? (value !== '__proto__')
    : (value === null);
}

var _isKeyable = isKeyable;

/**
 * Gets the data for `map`.
 *
 * @private
 * @param {Object} map The map to query.
 * @param {string} key The reference key.
 * @returns {*} Returns the map data.
 */
function getMapData(map, key) {
  var data = map.__data__;
  return _isKeyable(key)
    ? data[typeof key == 'string' ? 'string' : 'hash']
    : data.map;
}

var _getMapData = getMapData;

/**
 * Removes `key` and its value from the map.
 *
 * @private
 * @name delete
 * @memberOf MapCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function mapCacheDelete(key) {
  var result = _getMapData(this, key)['delete'](key);
  this.size -= result ? 1 : 0;
  return result;
}

var _mapCacheDelete = mapCacheDelete;

/**
 * Gets the map value for `key`.
 *
 * @private
 * @name get
 * @memberOf MapCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function mapCacheGet(key) {
  return _getMapData(this, key).get(key);
}

var _mapCacheGet = mapCacheGet;

/**
 * Checks if a map value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf MapCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function mapCacheHas(key) {
  return _getMapData(this, key).has(key);
}

var _mapCacheHas = mapCacheHas;

/**
 * Sets the map `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf MapCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the map cache instance.
 */
function mapCacheSet(key, value) {
  var data = _getMapData(this, key),
      size = data.size;

  data.set(key, value);
  this.size += data.size == size ? 0 : 1;
  return this;
}

var _mapCacheSet = mapCacheSet;

/**
 * Creates a map cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function MapCache(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `MapCache`.
MapCache.prototype.clear = _mapCacheClear;
MapCache.prototype['delete'] = _mapCacheDelete;
MapCache.prototype.get = _mapCacheGet;
MapCache.prototype.has = _mapCacheHas;
MapCache.prototype.set = _mapCacheSet;

var _MapCache = MapCache;

/** Used as the size to enable large array optimizations. */
var LARGE_ARRAY_SIZE = 200;

/**
 * Sets the stack `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Stack
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the stack cache instance.
 */
function stackSet(key, value) {
  var data = this.__data__;
  if (data instanceof _ListCache) {
    var pairs = data.__data__;
    if (!_Map || (pairs.length < LARGE_ARRAY_SIZE - 1)) {
      pairs.push([key, value]);
      this.size = ++data.size;
      return this;
    }
    data = this.__data__ = new _MapCache(pairs);
  }
  data.set(key, value);
  this.size = data.size;
  return this;
}

var _stackSet = stackSet;

/**
 * Creates a stack cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Stack(entries) {
  var data = this.__data__ = new _ListCache(entries);
  this.size = data.size;
}

// Add methods to `Stack`.
Stack.prototype.clear = _stackClear;
Stack.prototype['delete'] = _stackDelete;
Stack.prototype.get = _stackGet;
Stack.prototype.has = _stackHas;
Stack.prototype.set = _stackSet;

var _Stack = Stack;

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED$2 = '__lodash_hash_undefined__';

/**
 * Adds `value` to the array cache.
 *
 * @private
 * @name add
 * @memberOf SetCache
 * @alias push
 * @param {*} value The value to cache.
 * @returns {Object} Returns the cache instance.
 */
function setCacheAdd(value) {
  this.__data__.set(value, HASH_UNDEFINED$2);
  return this;
}

var _setCacheAdd = setCacheAdd;

/**
 * Checks if `value` is in the array cache.
 *
 * @private
 * @name has
 * @memberOf SetCache
 * @param {*} value The value to search for.
 * @returns {number} Returns `true` if `value` is found, else `false`.
 */
function setCacheHas(value) {
  return this.__data__.has(value);
}

var _setCacheHas = setCacheHas;

/**
 *
 * Creates an array cache object to store unique values.
 *
 * @private
 * @constructor
 * @param {Array} [values] The values to cache.
 */
function SetCache(values) {
  var index = -1,
      length = values == null ? 0 : values.length;

  this.__data__ = new _MapCache;
  while (++index < length) {
    this.add(values[index]);
  }
}

// Add methods to `SetCache`.
SetCache.prototype.add = SetCache.prototype.push = _setCacheAdd;
SetCache.prototype.has = _setCacheHas;

var _SetCache = SetCache;

/**
 * A specialized version of `_.some` for arrays without support for iteratee
 * shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {boolean} Returns `true` if any element passes the predicate check,
 *  else `false`.
 */
function arraySome(array, predicate) {
  var index = -1,
      length = array == null ? 0 : array.length;

  while (++index < length) {
    if (predicate(array[index], index, array)) {
      return true;
    }
  }
  return false;
}

var _arraySome = arraySome;

/**
 * Checks if a `cache` value for `key` exists.
 *
 * @private
 * @param {Object} cache The cache to query.
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function cacheHas(cache, key) {
  return cache.has(key);
}

var _cacheHas = cacheHas;

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG = 1,
    COMPARE_UNORDERED_FLAG = 2;

/**
 * A specialized version of `baseIsEqualDeep` for arrays with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Array} array The array to compare.
 * @param {Array} other The other array to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} stack Tracks traversed `array` and `other` objects.
 * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
 */
function equalArrays(array, other, bitmask, customizer, equalFunc, stack) {
  var isPartial = bitmask & COMPARE_PARTIAL_FLAG,
      arrLength = array.length,
      othLength = other.length;

  if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
    return false;
  }
  // Assume cyclic values are equal.
  var stacked = stack.get(array);
  if (stacked && stack.get(other)) {
    return stacked == other;
  }
  var index = -1,
      result = true,
      seen = (bitmask & COMPARE_UNORDERED_FLAG) ? new _SetCache : undefined;

  stack.set(array, other);
  stack.set(other, array);

  // Ignore non-index properties.
  while (++index < arrLength) {
    var arrValue = array[index],
        othValue = other[index];

    if (customizer) {
      var compared = isPartial
        ? customizer(othValue, arrValue, index, other, array, stack)
        : customizer(arrValue, othValue, index, array, other, stack);
    }
    if (compared !== undefined) {
      if (compared) {
        continue;
      }
      result = false;
      break;
    }
    // Recursively compare arrays (susceptible to call stack limits).
    if (seen) {
      if (!_arraySome(other, function(othValue, othIndex) {
            if (!_cacheHas(seen, othIndex) &&
                (arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
              return seen.push(othIndex);
            }
          })) {
        result = false;
        break;
      }
    } else if (!(
          arrValue === othValue ||
            equalFunc(arrValue, othValue, bitmask, customizer, stack)
        )) {
      result = false;
      break;
    }
  }
  stack['delete'](array);
  stack['delete'](other);
  return result;
}

var _equalArrays = equalArrays;

/** Built-in value references. */
var Uint8Array = _root.Uint8Array;

var _Uint8Array = Uint8Array;

/**
 * Converts `map` to its key-value pairs.
 *
 * @private
 * @param {Object} map The map to convert.
 * @returns {Array} Returns the key-value pairs.
 */
function mapToArray(map) {
  var index = -1,
      result = Array(map.size);

  map.forEach(function(value, key) {
    result[++index] = [key, value];
  });
  return result;
}

var _mapToArray = mapToArray;

/**
 * Converts `set` to an array of its values.
 *
 * @private
 * @param {Object} set The set to convert.
 * @returns {Array} Returns the values.
 */
function setToArray(set) {
  var index = -1,
      result = Array(set.size);

  set.forEach(function(value) {
    result[++index] = value;
  });
  return result;
}

var _setToArray = setToArray;

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG$1 = 1,
    COMPARE_UNORDERED_FLAG$1 = 2;

/** `Object#toString` result references. */
var boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    symbolTag = '[object Symbol]';

var arrayBufferTag = '[object ArrayBuffer]',
    dataViewTag = '[object DataView]';

/** Used to convert symbols to primitives and strings. */
var symbolProto = _Symbol ? _Symbol.prototype : undefined,
    symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;

/**
 * A specialized version of `baseIsEqualDeep` for comparing objects of
 * the same `toStringTag`.
 *
 * **Note:** This function only supports comparing values with tags of
 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {string} tag The `toStringTag` of the objects to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} stack Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalByTag(object, other, tag, bitmask, customizer, equalFunc, stack) {
  switch (tag) {
    case dataViewTag:
      if ((object.byteLength != other.byteLength) ||
          (object.byteOffset != other.byteOffset)) {
        return false;
      }
      object = object.buffer;
      other = other.buffer;

    case arrayBufferTag:
      if ((object.byteLength != other.byteLength) ||
          !equalFunc(new _Uint8Array(object), new _Uint8Array(other))) {
        return false;
      }
      return true;

    case boolTag:
    case dateTag:
    case numberTag:
      // Coerce booleans to `1` or `0` and dates to milliseconds.
      // Invalid dates are coerced to `NaN`.
      return eq_1(+object, +other);

    case errorTag:
      return object.name == other.name && object.message == other.message;

    case regexpTag:
    case stringTag:
      // Coerce regexes to strings and treat strings, primitives and objects,
      // as equal. See http://www.ecma-international.org/ecma-262/7.0/#sec-regexp.prototype.tostring
      // for more details.
      return object == (other + '');

    case mapTag:
      var convert = _mapToArray;

    case setTag:
      var isPartial = bitmask & COMPARE_PARTIAL_FLAG$1;
      convert || (convert = _setToArray);

      if (object.size != other.size && !isPartial) {
        return false;
      }
      // Assume cyclic values are equal.
      var stacked = stack.get(object);
      if (stacked) {
        return stacked == other;
      }
      bitmask |= COMPARE_UNORDERED_FLAG$1;

      // Recursively compare objects (susceptible to call stack limits).
      stack.set(object, other);
      var result = _equalArrays(convert(object), convert(other), bitmask, customizer, equalFunc, stack);
      stack['delete'](object);
      return result;

    case symbolTag:
      if (symbolValueOf) {
        return symbolValueOf.call(object) == symbolValueOf.call(other);
      }
  }
  return false;
}

var _equalByTag = equalByTag;

/**
 * Appends the elements of `values` to `array`.
 *
 * @private
 * @param {Array} array The array to modify.
 * @param {Array} values The values to append.
 * @returns {Array} Returns `array`.
 */
function arrayPush(array, values) {
  var index = -1,
      length = values.length,
      offset = array.length;

  while (++index < length) {
    array[offset + index] = values[index];
  }
  return array;
}

var _arrayPush = arrayPush;

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray = Array.isArray;

var isArray_1 = isArray;

/**
 * The base implementation of `getAllKeys` and `getAllKeysIn` which uses
 * `keysFunc` and `symbolsFunc` to get the enumerable property names and
 * symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @param {Function} symbolsFunc The function to get the symbols of `object`.
 * @returns {Array} Returns the array of property names and symbols.
 */
function baseGetAllKeys(object, keysFunc, symbolsFunc) {
  var result = keysFunc(object);
  return isArray_1(object) ? result : _arrayPush(result, symbolsFunc(object));
}

var _baseGetAllKeys = baseGetAllKeys;

/**
 * A specialized version of `_.filter` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {Array} Returns the new filtered array.
 */
function arrayFilter(array, predicate) {
  var index = -1,
      length = array == null ? 0 : array.length,
      resIndex = 0,
      result = [];

  while (++index < length) {
    var value = array[index];
    if (predicate(value, index, array)) {
      result[resIndex++] = value;
    }
  }
  return result;
}

var _arrayFilter = arrayFilter;

/**
 * This method returns a new empty array.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {Array} Returns the new empty array.
 * @example
 *
 * var arrays = _.times(2, _.stubArray);
 *
 * console.log(arrays);
 * // => [[], []]
 *
 * console.log(arrays[0] === arrays[1]);
 * // => false
 */
function stubArray() {
  return [];
}

var stubArray_1 = stubArray;

/** Used for built-in method references. */
var objectProto$5 = Object.prototype;

/** Built-in value references. */
var propertyIsEnumerable = objectProto$5.propertyIsEnumerable;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeGetSymbols = Object.getOwnPropertySymbols;

/**
 * Creates an array of the own enumerable symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of symbols.
 */
var getSymbols = !nativeGetSymbols ? stubArray_1 : function(object) {
  if (object == null) {
    return [];
  }
  object = Object(object);
  return _arrayFilter(nativeGetSymbols(object), function(symbol) {
    return propertyIsEnumerable.call(object, symbol);
  });
};

var _getSymbols = getSymbols;

/**
 * The base implementation of `_.times` without support for iteratee shorthands
 * or max array length checks.
 *
 * @private
 * @param {number} n The number of times to invoke `iteratee`.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the array of results.
 */
function baseTimes(n, iteratee) {
  var index = -1,
      result = Array(n);

  while (++index < n) {
    result[index] = iteratee(index);
  }
  return result;
}

var _baseTimes = baseTimes;

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return value != null && typeof value == 'object';
}

var isObjectLike_1 = isObjectLike;

/** `Object#toString` result references. */
var argsTag = '[object Arguments]';

/**
 * The base implementation of `_.isArguments`.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 */
function baseIsArguments(value) {
  return isObjectLike_1(value) && _baseGetTag(value) == argsTag;
}

var _baseIsArguments = baseIsArguments;

/** Used for built-in method references. */
var objectProto$6 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$4 = objectProto$6.hasOwnProperty;

/** Built-in value references. */
var propertyIsEnumerable$1 = objectProto$6.propertyIsEnumerable;

/**
 * Checks if `value` is likely an `arguments` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 *  else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
var isArguments = _baseIsArguments(function() { return arguments; }()) ? _baseIsArguments : function(value) {
  return isObjectLike_1(value) && hasOwnProperty$4.call(value, 'callee') &&
    !propertyIsEnumerable$1.call(value, 'callee');
};

var isArguments_1 = isArguments;

/**
 * This method returns `false`.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {boolean} Returns `false`.
 * @example
 *
 * _.times(2, _.stubFalse);
 * // => [false, false]
 */
function stubFalse() {
  return false;
}

var stubFalse_1 = stubFalse;

var isBuffer_1 = createCommonjsModule(function (module, exports) {
/** Detect free variable `exports`. */
var freeExports = 'object' == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule = freeExports && 'object' == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = freeModule && freeModule.exports === freeExports;

/** Built-in value references. */
var Buffer = moduleExports ? _root.Buffer : undefined;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined;

/**
 * Checks if `value` is a buffer.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
 * @example
 *
 * _.isBuffer(new Buffer(2));
 * // => true
 *
 * _.isBuffer(new Uint8Array(2));
 * // => false
 */
var isBuffer = nativeIsBuffer || stubFalse_1;

module.exports = isBuffer;
});

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;

/** Used to detect unsigned integer values. */
var reIsUint = /^(?:0|[1-9]\d*)$/;

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
  var type = typeof value;
  length = length == null ? MAX_SAFE_INTEGER : length;

  return !!length &&
    (type == 'number' ||
      (type != 'symbol' && reIsUint.test(value))) &&
        (value > -1 && value % 1 == 0 && value < length);
}

var _isIndex = isIndex;

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER$1 = 9007199254740991;

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This method is loosely based on
 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * _.isLength(3);
 * // => true
 *
 * _.isLength(Number.MIN_VALUE);
 * // => false
 *
 * _.isLength(Infinity);
 * // => false
 *
 * _.isLength('3');
 * // => false
 */
function isLength(value) {
  return typeof value == 'number' &&
    value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER$1;
}

var isLength_1 = isLength;

/** `Object#toString` result references. */
var argsTag$1 = '[object Arguments]',
    arrayTag = '[object Array]',
    boolTag$1 = '[object Boolean]',
    dateTag$1 = '[object Date]',
    errorTag$1 = '[object Error]',
    funcTag$1 = '[object Function]',
    mapTag$1 = '[object Map]',
    numberTag$1 = '[object Number]',
    objectTag = '[object Object]',
    regexpTag$1 = '[object RegExp]',
    setTag$1 = '[object Set]',
    stringTag$1 = '[object String]',
    weakMapTag = '[object WeakMap]';

var arrayBufferTag$1 = '[object ArrayBuffer]',
    dataViewTag$1 = '[object DataView]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/** Used to identify `toStringTag` values of typed arrays. */
var typedArrayTags = {};
typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
typedArrayTags[uint32Tag] = true;
typedArrayTags[argsTag$1] = typedArrayTags[arrayTag] =
typedArrayTags[arrayBufferTag$1] = typedArrayTags[boolTag$1] =
typedArrayTags[dataViewTag$1] = typedArrayTags[dateTag$1] =
typedArrayTags[errorTag$1] = typedArrayTags[funcTag$1] =
typedArrayTags[mapTag$1] = typedArrayTags[numberTag$1] =
typedArrayTags[objectTag] = typedArrayTags[regexpTag$1] =
typedArrayTags[setTag$1] = typedArrayTags[stringTag$1] =
typedArrayTags[weakMapTag] = false;

/**
 * The base implementation of `_.isTypedArray` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 */
function baseIsTypedArray(value) {
  return isObjectLike_1(value) &&
    isLength_1(value.length) && !!typedArrayTags[_baseGetTag(value)];
}

var _baseIsTypedArray = baseIsTypedArray;

/**
 * The base implementation of `_.unary` without support for storing metadata.
 *
 * @private
 * @param {Function} func The function to cap arguments for.
 * @returns {Function} Returns the new capped function.
 */
function baseUnary(func) {
  return function(value) {
    return func(value);
  };
}

var _baseUnary = baseUnary;

var _nodeUtil = createCommonjsModule(function (module, exports) {
/** Detect free variable `exports`. */
var freeExports = 'object' == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule = freeExports && 'object' == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = freeModule && freeModule.exports === freeExports;

/** Detect free variable `process` from Node.js. */
var freeProcess = moduleExports && _freeGlobal.process;

/** Used to access faster Node.js helpers. */
var nodeUtil = (function() {
  try {
    return freeProcess && freeProcess.binding && freeProcess.binding('util');
  } catch (e) {}
}());

module.exports = nodeUtil;
});

/* Node.js helper references. */
var nodeIsTypedArray = _nodeUtil && _nodeUtil.isTypedArray;

/**
 * Checks if `value` is classified as a typed array.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 * @example
 *
 * _.isTypedArray(new Uint8Array);
 * // => true
 *
 * _.isTypedArray([]);
 * // => false
 */
var isTypedArray = nodeIsTypedArray ? _baseUnary(nodeIsTypedArray) : _baseIsTypedArray;

var isTypedArray_1 = isTypedArray;

/** Used for built-in method references. */
var objectProto$7 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$5 = objectProto$7.hasOwnProperty;

/**
 * Creates an array of the enumerable property names of the array-like `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @param {boolean} inherited Specify returning inherited property names.
 * @returns {Array} Returns the array of property names.
 */
function arrayLikeKeys(value, inherited) {
  var isArr = isArray_1(value),
      isArg = !isArr && isArguments_1(value),
      isBuff = !isArr && !isArg && isBuffer_1(value),
      isType = !isArr && !isArg && !isBuff && isTypedArray_1(value),
      skipIndexes = isArr || isArg || isBuff || isType,
      result = skipIndexes ? _baseTimes(value.length, String) : [],
      length = result.length;

  for (var key in value) {
    if ((inherited || hasOwnProperty$5.call(value, key)) &&
        !(skipIndexes && (
           // Safari 9 has enumerable `arguments.length` in strict mode.
           key == 'length' ||
           // Node.js 0.10 has enumerable non-index properties on buffers.
           (isBuff && (key == 'offset' || key == 'parent')) ||
           // PhantomJS 2 has enumerable non-index properties on typed arrays.
           (isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset')) ||
           // Skip index properties.
           _isIndex(key, length)
        ))) {
      result.push(key);
    }
  }
  return result;
}

var _arrayLikeKeys = arrayLikeKeys;

/** Used for built-in method references. */
var objectProto$8 = Object.prototype;

/**
 * Checks if `value` is likely a prototype object.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
 */
function isPrototype(value) {
  var Ctor = value && value.constructor,
      proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto$8;

  return value === proto;
}

var _isPrototype = isPrototype;

/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */
function overArg(func, transform) {
  return function(arg) {
    return func(transform(arg));
  };
}

var _overArg = overArg;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeKeys = _overArg(Object.keys, Object);

var _nativeKeys = nativeKeys;

/** Used for built-in method references. */
var objectProto$9 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$6 = objectProto$9.hasOwnProperty;

/**
 * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeys(object) {
  if (!_isPrototype(object)) {
    return _nativeKeys(object);
  }
  var result = [];
  for (var key in Object(object)) {
    if (hasOwnProperty$6.call(object, key) && key != 'constructor') {
      result.push(key);
    }
  }
  return result;
}

var _baseKeys = baseKeys;

/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * _.isArrayLike([1, 2, 3]);
 * // => true
 *
 * _.isArrayLike(document.body.children);
 * // => true
 *
 * _.isArrayLike('abc');
 * // => true
 *
 * _.isArrayLike(_.noop);
 * // => false
 */
function isArrayLike(value) {
  return value != null && isLength_1(value.length) && !isFunction_1(value);
}

var isArrayLike_1 = isArrayLike;

/**
 * Creates an array of the own enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects. See the
 * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * for more details.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keys(new Foo);
 * // => ['a', 'b'] (iteration order is not guaranteed)
 *
 * _.keys('hi');
 * // => ['0', '1']
 */
function keys(object) {
  return isArrayLike_1(object) ? _arrayLikeKeys(object) : _baseKeys(object);
}

var keys_1 = keys;

/**
 * Creates an array of own enumerable property names and symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names and symbols.
 */
function getAllKeys(object) {
  return _baseGetAllKeys(object, keys_1, _getSymbols);
}

var _getAllKeys = getAllKeys;

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG$2 = 1;

/** Used for built-in method references. */
var objectProto$10 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$7 = objectProto$10.hasOwnProperty;

/**
 * A specialized version of `baseIsEqualDeep` for objects with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} stack Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalObjects(object, other, bitmask, customizer, equalFunc, stack) {
  var isPartial = bitmask & COMPARE_PARTIAL_FLAG$2,
      objProps = _getAllKeys(object),
      objLength = objProps.length,
      othProps = _getAllKeys(other),
      othLength = othProps.length;

  if (objLength != othLength && !isPartial) {
    return false;
  }
  var index = objLength;
  while (index--) {
    var key = objProps[index];
    if (!(isPartial ? key in other : hasOwnProperty$7.call(other, key))) {
      return false;
    }
  }
  // Assume cyclic values are equal.
  var stacked = stack.get(object);
  if (stacked && stack.get(other)) {
    return stacked == other;
  }
  var result = true;
  stack.set(object, other);
  stack.set(other, object);

  var skipCtor = isPartial;
  while (++index < objLength) {
    key = objProps[index];
    var objValue = object[key],
        othValue = other[key];

    if (customizer) {
      var compared = isPartial
        ? customizer(othValue, objValue, key, other, object, stack)
        : customizer(objValue, othValue, key, object, other, stack);
    }
    // Recursively compare objects (susceptible to call stack limits).
    if (!(compared === undefined
          ? (objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack))
          : compared
        )) {
      result = false;
      break;
    }
    skipCtor || (skipCtor = key == 'constructor');
  }
  if (result && !skipCtor) {
    var objCtor = object.constructor,
        othCtor = other.constructor;

    // Non `Object` object instances with different constructors are not equal.
    if (objCtor != othCtor &&
        ('constructor' in object && 'constructor' in other) &&
        !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
          typeof othCtor == 'function' && othCtor instanceof othCtor)) {
      result = false;
    }
  }
  stack['delete'](object);
  stack['delete'](other);
  return result;
}

var _equalObjects = equalObjects;

/* Built-in method references that are verified to be native. */
var DataView = _getNative(_root, 'DataView');

var _DataView = DataView;

/* Built-in method references that are verified to be native. */
var Promise$1 = _getNative(_root, 'Promise');

var _Promise = Promise$1;

/* Built-in method references that are verified to be native. */
var Set = _getNative(_root, 'Set');

var _Set = Set;

/* Built-in method references that are verified to be native. */
var WeakMap = _getNative(_root, 'WeakMap');

var _WeakMap = WeakMap;

/** `Object#toString` result references. */
var mapTag$2 = '[object Map]',
    objectTag$1 = '[object Object]',
    promiseTag = '[object Promise]',
    setTag$2 = '[object Set]',
    weakMapTag$1 = '[object WeakMap]';

var dataViewTag$2 = '[object DataView]';

/** Used to detect maps, sets, and weakmaps. */
var dataViewCtorString = _toSource(_DataView),
    mapCtorString = _toSource(_Map),
    promiseCtorString = _toSource(_Promise),
    setCtorString = _toSource(_Set),
    weakMapCtorString = _toSource(_WeakMap);

/**
 * Gets the `toStringTag` of `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
var getTag = _baseGetTag;

// Fallback for data views, maps, sets, and weak maps in IE 11 and promises in Node.js < 6.
if ((_DataView && getTag(new _DataView(new ArrayBuffer(1))) != dataViewTag$2) ||
    (_Map && getTag(new _Map) != mapTag$2) ||
    (_Promise && getTag(_Promise.resolve()) != promiseTag) ||
    (_Set && getTag(new _Set) != setTag$2) ||
    (_WeakMap && getTag(new _WeakMap) != weakMapTag$1)) {
  getTag = function(value) {
    var result = _baseGetTag(value),
        Ctor = result == objectTag$1 ? value.constructor : undefined,
        ctorString = Ctor ? _toSource(Ctor) : '';

    if (ctorString) {
      switch (ctorString) {
        case dataViewCtorString: return dataViewTag$2;
        case mapCtorString: return mapTag$2;
        case promiseCtorString: return promiseTag;
        case setCtorString: return setTag$2;
        case weakMapCtorString: return weakMapTag$1;
      }
    }
    return result;
  };
}

var _getTag = getTag;

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG$3 = 1;

/** `Object#toString` result references. */
var argsTag$2 = '[object Arguments]',
    arrayTag$1 = '[object Array]',
    objectTag$2 = '[object Object]';

/** Used for built-in method references. */
var objectProto$11 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$8 = objectProto$11.hasOwnProperty;

/**
 * A specialized version of `baseIsEqual` for arrays and objects which performs
 * deep comparisons and tracks traversed objects enabling objects with circular
 * references to be compared.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} [stack] Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function baseIsEqualDeep(object, other, bitmask, customizer, equalFunc, stack) {
  var objIsArr = isArray_1(object),
      othIsArr = isArray_1(other),
      objTag = objIsArr ? arrayTag$1 : _getTag(object),
      othTag = othIsArr ? arrayTag$1 : _getTag(other);

  objTag = objTag == argsTag$2 ? objectTag$2 : objTag;
  othTag = othTag == argsTag$2 ? objectTag$2 : othTag;

  var objIsObj = objTag == objectTag$2,
      othIsObj = othTag == objectTag$2,
      isSameTag = objTag == othTag;

  if (isSameTag && isBuffer_1(object)) {
    if (!isBuffer_1(other)) {
      return false;
    }
    objIsArr = true;
    objIsObj = false;
  }
  if (isSameTag && !objIsObj) {
    stack || (stack = new _Stack);
    return (objIsArr || isTypedArray_1(object))
      ? _equalArrays(object, other, bitmask, customizer, equalFunc, stack)
      : _equalByTag(object, other, objTag, bitmask, customizer, equalFunc, stack);
  }
  if (!(bitmask & COMPARE_PARTIAL_FLAG$3)) {
    var objIsWrapped = objIsObj && hasOwnProperty$8.call(object, '__wrapped__'),
        othIsWrapped = othIsObj && hasOwnProperty$8.call(other, '__wrapped__');

    if (objIsWrapped || othIsWrapped) {
      var objUnwrapped = objIsWrapped ? object.value() : object,
          othUnwrapped = othIsWrapped ? other.value() : other;

      stack || (stack = new _Stack);
      return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
    }
  }
  if (!isSameTag) {
    return false;
  }
  stack || (stack = new _Stack);
  return _equalObjects(object, other, bitmask, customizer, equalFunc, stack);
}

var _baseIsEqualDeep = baseIsEqualDeep;

/**
 * The base implementation of `_.isEqual` which supports partial comparisons
 * and tracks traversed objects.
 *
 * @private
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @param {boolean} bitmask The bitmask flags.
 *  1 - Unordered comparison
 *  2 - Partial comparison
 * @param {Function} [customizer] The function to customize comparisons.
 * @param {Object} [stack] Tracks traversed `value` and `other` objects.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 */
function baseIsEqual(value, other, bitmask, customizer, stack) {
  if (value === other) {
    return true;
  }
  if (value == null || other == null || (!isObjectLike_1(value) && !isObjectLike_1(other))) {
    return value !== value && other !== other;
  }
  return _baseIsEqualDeep(value, other, bitmask, customizer, baseIsEqual, stack);
}

var _baseIsEqual = baseIsEqual;

/**
 * Performs a deep comparison between two values to determine if they are
 * equivalent.
 *
 * **Note:** This method supports comparing arrays, array buffers, booleans,
 * date objects, error objects, maps, numbers, `Object` objects, regexes,
 * sets, strings, symbols, and typed arrays. `Object` objects are compared
 * by their own, not inherited, enumerable properties. Functions and DOM
 * nodes are compared by strict equality, i.e. `===`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.isEqual(object, other);
 * // => true
 *
 * object === other;
 * // => false
 */
function isEqual(value, other) {
  return _baseIsEqual(value, other);
}

var isEqual_1 = isEqual;

var TILE_SIZE = 50;

var Tilemap = function (_Emitter) {
	inherits(Tilemap, _Emitter);

	function Tilemap(game) {
		classCallCheck(this, Tilemap);

		var _this = possibleConstructorReturn(this, (Tilemap.__proto__ || Object.getPrototypeOf(Tilemap)).call(this));

		_this.game = game;
		_this.size = { width: 0, height: 0 };
		_this.bodies = [];
		_this.spawnAreas = [];
		_this.loadedJSON = {};
		return _this;
	}

	createClass(Tilemap, [{
		key: "clearBodies",
		value: function clearBodies() {
			var _this2 = this;

			this.bodies.forEach(function (body) {
				return _this2.game.world.removeBody(body);
			});
			this.bodies = [];
			this.emit("collisions-cleared");
			return this;
		}
	}, {
		key: "toJSON",
		value: function toJSON() {
			return this.loadedJSON;
		}
	}, {
		key: "fromJSON",
		value: function fromJSON(json) {
			var _this3 = this;

			this.clearBodies();

			this.loadedJSON = json;

			this.size.width = json.size.width;
			this.size.height = json.size.height;

			// build the collisions for the map
			this.bodies = Tilemap.buildCollisions(json.collisions);

			// set all the collisions groups
			this.bodies.forEach(function (body) {
				body.shapes.forEach(function (shape) {
					shape.collisionGroup = COLLISION_GROUPS.WALLS;
					shape.collisionMask = COLLISION_GROUPS.ALL;
				});
			});

			this.bodies.forEach(function (body) {
				return _this3.game.world.addBody(body);
			});
			this.emit("from-json", json);
			return this;
		}
	}, {
		key: "getSpawnPoint",
		value: function getSpawnPoint() {
			return {
				x: this.size.width / 2 * TILE_SIZE,
				y: this.size.height / 2 * TILE_SIZE
			};
		}
	}], [{
		key: "buildCollisions",
		value: function buildCollisions$$1(collisions) {
			var bodies = [];

			for (var i = 0; i < collisions.length; i++) {
				var object = collisions[i];

				if (!object.visible) continue;

				// create the shape
				if (Array.isArray(object.polygon)) {
					var body = new p2.Body({ mass: 0 });
					body.position[0] = object.x;
					body.position[1] = object.y;
					body.fromPolygon(object.polygon.map(function (point) {
						return [point.x, point.y];
					}));
					bodies.push(body);
				} else if (Array.isArray(object.polyline)) {
					var _body = new p2.Body({ mass: 0 });
					_body.position[0] = object.x;
					_body.position[1] = object.y;

					// start at the second point
					for (var _i = 1; _i < object.polyline.length; _i++) {
						var prev = object.polyline[_i - 1];
						var curr = object.polyline[_i];
						var length = Math.sqrt(Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2));
						var angle = Math.atan2(curr.y - prev.y, curr.x - prev.x);
						_body.addShape(new p2.Line({
							position: [lerp(prev.x, curr.x, 0.5), lerp(prev.y, curr.y, 0.5)],
							length: length,
							angle: angle
						}));
					}

					bodies.push(_body);
				} else if (object.height > 0 && object.width > 0) {
					var _body2 = new p2.Body({ mass: 0 });
					_body2.position[0] = object.x + object.width / 2;
					_body2.position[1] = object.y + object.height / 2;
					_body2.addShape(new p2.Box({
						width: object.width,
						height: object.height
					}));
					bodies.push(_body2);
				}
			}

			return bodies;
		}
	}, {
		key: "parseTiledJSON",
		value: function parseTiledJSON(json) {
			var mapJSON = {
				size: {
					width: json.width,
					height: json.height
				},
				types: [],
				tiles: []
			};

			// get the collisions
			mapJSON.collisions = json.layers.find(function (layer) {
				return layer.objects && layer.name == "collision" && layer.type == "objectgroup";
			}).objects;

			// get all the tile props
			var tileProperties = {};
			json.tilesets.forEach(function (tileset) {
				for (var id in tileset.tileproperties) {
					var tileID = parseInt(id) + tileset.firstgid;
					if (Reflect.ownKeys(tileset.tileproperties[id]).length > 0) {
						if (!tileProperties[tileID]) tileProperties[tileID] = {};
						Object.assign(tileProperties[tileID], tileset.tileproperties[id]);
					}
				}
			});

			// compile all the tile props
			json.layers.filter(function (layer) {
				return layer.type === "tilelayer";
			}).forEach(function (layer) {
				for (var i = 0; i < layer.data.length; i++) {
					var y = Math.floor(i / json.width);
					var x = i - y * json.width;
					if (!mapJSON.tiles[y]) mapJSON.tiles[y] = [];
					if (!mapJSON.tiles[y][x]) mapJSON.tiles[y][x] = [];

					var props = tileProperties[layer.data[i]];
					if (props) mapJSON.tiles[y][x].push(props);
				}
			});

			// condense the tiles down to types
			mapJSON.tiles = mapJSON.tiles.map(function (row) {
				return row.map(function (tile) {
					// find a type that has exactly the make models as the tile
					var type = mapJSON.types.find(function (type) {
						return isEqual_1(tile, type);
					});

					if (!type && tile.length > 0) mapJSON.types.push(type = tile);

					return mapJSON.types.indexOf(type);
				});
			});

			return mapJSON;
		}
	}]);
	return Tilemap;
}(Emitter);

var BASE_CONFIG = {
	player: {
		movement: {
			speed: 180,
			excelerate: 0.9,
			decelerate: 0.7
		},
		max: 10
	}
};

var Game = function (_Emitter) {
	inherits(Game, _Emitter);

	function Game() {
		classCallCheck(this, Game);

		var _this = possibleConstructorReturn(this, (Game.__proto__ || Object.getPrototypeOf(Game)).call(this));

		_this.id = Game.ids.encode(Date.now());
		_this.info = {};
		_this.isMaster = false;
		_this.config = JSON.parse(JSON.stringify(BASE_CONFIG));

		_this.players = new PlayerManager(_this);
		_this.map = new Tilemap(_this);
		_this.bullets = new BulletManager(_this);

		// create the physics world
		_this.world = new p2.World({
			gravity: [0, 0]
		});
		return _this;
	}

	createClass(Game, [{
		key: "getPlayer",
		value: function getPlayer() {
			var _players;

			return (_players = this.players).getPlayer.apply(_players, arguments);
		}
	}, {
		key: "createPlayer",
		value: function createPlayer() {
			var _players2;

			return (_players2 = this.players).createPlayer.apply(_players2, arguments);
		}
	}, {
		key: "removePlayer",
		value: function removePlayer() {
			var _players3;

			return (_players3 = this.players).removePlayer.apply(_players3, arguments);
		}
	}, {
		key: "spawnPlayer",
		value: function spawnPlayer(id) {
			var player = this.players.getPlayer(id);
			var point = this.map.getSpawnPoint();

			player.setPosition(point.x, point.y);
			player.setProp("spawned", true);
			return this;
		}
	}, {
		key: "setInfo",
		value: function setInfo(key, value) {
			if (key instanceof Object) {
				for (var i in key) {
					this.info[i] = key[i];
				}this.emit("info-changed", key);
			} else {
				this.info[key] = value;
				this.emit("info-changed", key, value);
			}

			return this;
		}
	}, {
		key: "getInfo",
		value: function getInfo(key, value) {
			return this.info[key];
		}
	}, {
		key: "getDelta",
		value: function getDelta() {
			var newTime = new Date();
			var delta = (newTime - this.lastDelta) / 1000;
			this.lastDelta = newTime;
			return delta;
		}
	}, {
		key: "update",
		value: function update() {
			var d = this.getDelta();

			// update the physics world
			this.world.step(1 / 60, d, 1);

			// update the players
			this.players.update(d);

			// update the bullets
			this.bullets.update(d);

			this.emit("update", d);
		}
	}, {
		key: "toJSON",
		value: function toJSON() {
			var json = {
				id: this.id,
				info: this.info,
				config: this.config,
				map: this.map.toJSON(),
				players: this.players.toJSON()
			};

			// fire the event
			this.emit("to-json", json);

			return json;
		}
	}, {
		key: "fromJSON",
		value: function fromJSON(json) {
			this.id = json.id;
			this.setInfo(json.info);
			this.players.fromJSON(json.players);
			this.map.fromJSON(json.map);

			// fire the event
			this.emit("from-json", json);

			return this;
		}
	}, {
		key: "isClient",
		get: function get$$1() {
			return !this.isMaster;
		}
	}]);
	return Game;
}(Emitter);

Game.ids = new Hashids("games");


Game.DEFAULT_FPS = 1 / 60;

export { Game, Player, PlayerManager, Tilemap, Bullet, BulletManager };
//# sourceMappingURL=lazer-game-core.module.js.map
