// game time
var time = 0;
var delay = 0;

// Joystick object
function Joystick(side) {
	this.id = -1;
	this.side = side;
	this.active = false;

	this.ttrig = 200;
	this.rtrig = 0.2;
	this.rout = 2;

	this.tip = { x: 0, y: 0, r: { min: 7, max: 15, val: 10 }, active: 0, held: false, opacity: { min: 0, max: 1 }, elem: document.querySelector('span.joystick.' + (side == 'L' ? 'left' : 'right') + '.tip') };
	this.base = { x: 0, y: 0, r: { min: 7, max: 15, val: 10 }, active: 0, fixed: false, opacity: { min: 0, max: 1 }, elem: document.querySelector('span.joystick.' + (side == 'L' ? 'left' : 'right') + '.base') };

	this.prev = { x: 0, y: 0 };
	this.pos = { x: 0, y: 0, d: 0 };

	this.time = 0;

	// Tap event
	this.onTap = j => {};

	// Push events
	this.onPushStart = j => {};
	this.onPush = j => {};
	this.onPushEnd = j => {};

	// Hold events
	this.onHoldStart = j => {};
	this.onHold = j => {};
	this.onHoldEnd = j => {};

	this.color = 'white';

	this.setActive = mode => {
		if (mode != this.active) {
			this.active = mode;

			if (mode) {
				this.tip.elem.style.opacity = 1;
				this.base.elem.style.opacity = 1;

				this.position();

				this.tip.x = this.base.x;
				this.tip.y = this.base.y;
			}
		}
	};

	this.position = _ => {
		this.base.elem.classList.remove('transition');
		this.tip.elem.classList.remove('transition');

		let x = (mge.elem.clientWidth / 6) * (this.side == 'R' ? 5 : 1);
		let y = (mge.elem.clientHeight * 3) / 4;

		this.base.x = x;
		this.base.y = y;

		this.base.elem.style.left = this.base.x + 'px';
		this.base.elem.style.top = this.base.y + 'px';

		this.tip.elem.style.left = this.tip.x + 'px';
		this.tip.elem.style.top = this.tip.y + 'px';
	};

	this.updatePos = _ => {
		let r = this.base.elem.clientWidth / 2;
		let dx = this.tip.x - this.base.x;
		let dy = this.tip.y - this.base.y;
		let dxy = Math.sqrt(dx * dx + dy * dy);

		this.pos = { x: dx / r, y: dy / r, d: dxy / r };

		if (!this.tip.held && this.pos.d > this.rout) {
			this.tip.active = 0;
			this.base.active = 0;
		}
	};

	this.update = _ => {
		// To fix position
		let fix = _ => {
			if (this.base.fixed || !this.tip.active) {
				this.tip.x = this.base.x;
				this.tip.y = this.base.y;
			} else {
				this.base.x = this.tip.x;
				this.base.y = this.tip.y;
			}
		};

		if (this.tip.active) {
			if (this.base.active) {
				if (this.tip.held) {
					this.onHold(this);
					fix();
				} else this.onPush(this);
			} else {
				if (this.pos.d > this.rtrig) {
					this.base.active = true;
					this.onPushStart(this);
				} else if (time - this.time > this.ttrig) {
					this.base.active = true;
					this.tip.held = true;
					fix();
					this.onHoldStart(this);
				}
			}
		} else fix();

		// Set coords and size of tip and base elements
		for (let part of ['tip', 'base']) {
			this[part].elem.style.left = this[part].x + 'px';
			this[part].elem.style.top = this[part].y + 'px';
			this[part].elem.style.width = this[part].r.val * 2 + 'vh';
			this[part].elem.style.height = this[part].r.val * 2 + 'vh';

			let timed = time - this.time > this.ttrig * 2.8;

			if (this.tip.held) {
				this[part].elem.classList[timed ? 'remove' : 'add']('transition');
				this[part].elem.style.opacity = this[part].opacity.max;
			} else if (this[part].active) {
				this[part].elem.classList.remove('transition');
				this[part].elem.style.opacity = this[part].opacity.max;
			} else if (this.tip.active && !this.base.active) {
				this.base.elem.classList.remove('transition');
			} else {
				this[part].elem.classList.add('transition');
				this[part].elem.style.opacity = this.active ? this[part].opacity.min : 0;
			}
		}

		this.base.r.val = this.tip.held ? this.base.r.min - 1 : this.base.r.max;
		this.tip.r.val = this.tip.r.min;
	};
}

// Game engine object
var mge = {
	elem: document.querySelector('div.mge-main'),
	canvas: document.querySelector('.mge-main canvas#mge-can'),
	overlay: document.querySelector('.mge-main .mge-overlay'),

	camera: {
		x: 0,
		y: 0,
		z: 100,

		update: _ => {
			let scale = mge.elem.clientHeight / mge.camera.z;
			let size = scale * mge.canvas.width;

			// Resize canvas
			mge.canvas.style.width = size + 'px';
			mge.canvas.style.height = size + 'px';

			// Move canvas
			mge.canvas.style.left = -mge.camera.x * scale + 'px';
			mge.canvas.style.top = -mge.camera.y * scale + 'px';
		},

		set: (obj, ratio = 1) => {
			for (let c of 'xyz') {
				if (c in obj) mge.camera[c] = mge.camera[c] * (1 - ratio) + obj[c] * ratio;
			}
		}
	},

	ctx: null,
	touch_margin: 32,

	clear: _ => mge.ctx.clearRect(0, 0, mge.canvas.width, mge.canvas.height),

	getFullscreen: _ => Boolean(document.fullscreenElement),

	forceFullscreen: true,
	fullscreenOn: false,
	setFullscreen: mode => {
		setTimeout(_ => mge.resize(), 10);

		if (!mode || mode == 'on') {
			document.documentElement.requestFullscreen().catch(err => {});
			return 'on';
		}

		if (!mode || mode == 'off') {
			document.exitFullscreen();
			return 'off';
		}
	},

	forceLandscape: true,
	landscapeMode: false,

	overlayID: 'undefined',
	overlayContent: 'undefined',
	setOverlay: id => {
		if (!id) id = 'blank';
		if (id != mge.overlayID) {
			mge.canvas.classList.remove('on-' + mge.overlayID + '-section');
			mge.canvas.classList.add('on-' + id + '-section');

			mge.overlayID = id;
			if (!['landscape', 'fullscreen'].includes(id)) mge.overlayContent = id;

			let done = false;
			for (let section of document.querySelectorAll('.mge-overlay section')) {
				if (section.id == id) {
					done = true;
					section.classList.remove('mge-hidden');
				} else section.classList.add('mge-hidden');
			}

			if (!done) console.error(id + ': This section does not exist.');

			mge.onOverlayChange();
		}
	},

	onOverlayChange: _ => {},

	resize: _ => {
		mge.landscapeMode = innerWidth > innerHeight;
		mge.fullscreenOn = mge.getFullscreen();

		let section = mge.overlayContent;
		if (!mge.landscapeMode && mge.forceLandscape) section = 'landscape';
		if (!mge.fullscreenOn && mge.forceFullscreen) section = 'fullscreen';
		mge.setOverlay(section);

		mge.joysticks.forEach(j => j.position());
	},

	toGameCoords: coords => {
		let scale = mge.elem.clientHeight / mge.camera.z;
		return {
			x: (coords.x - parseInt(mge.canvas.style.left) - mge.elem.clientWidth / 2) / scale,
			y: (coords.y - parseInt(mge.canvas.style.top) - mge.elem.clientHeight / 2) / scale
		};
	},

	toScreenCoords: coords => {
		return coords;
	},

	loadImg: (srcs, out, onLoad = p => {}, onError = src => {}, onFinish = _ => {}) => {
		let load_num = 0;
		let load_err = false;

		for (let src of srcs) {
			let img = new Image();

			img.addEventListener('error', event => {
				load_err = true;
				onError(src);
			});

			img.addEventListener('load', event => {
				if (!load_err) {
					load_num++;
					let key = src.split('/')[src.split('/').length - 1].split('.')[0];

					if ('chrome' in window) {
						out[key] = document.createElement('canvas');
						out[key].width = img.width;
						out[key].height = img.height;
						out[key].getContext('2d').drawImage(img, 0, 0);
					} else out[key] = img;

					if (load_num == srcs.length) onFinish();
					else onLoad(load_num / srcs.length);
				}
			});

			img.src = src;
		}
	},

	joysticks: {
		L: new Joystick('L'),
		R: new Joystick('R'),
		forEach: callback => {
			callback(mge.joysticks.L);
			callback(mge.joysticks.R);
		}
	},

	logic: _ => {},
	graphics: _ => {},

	// Tick loop
	tick: async new_time => {
		delay = new_time - time;
		time = new_time;

		// Parallel async calls
		await Promise.all([
			(async _ => {
				mge.joysticks.forEach(j => j.update());
				mge.camera.update();
			})(),
			(async _ => {
				mge.logic();
				mge.graphics();
			})()
		]);

		requestAnimationFrame(mge.tick);
	},

	start: _ => mge.tick(0)
};

// Joystick events
document.querySelector('.tactile').addEventListener('touchstart', event => {
	event.preventDefault();

	for (let t of event.changedTouches) {
		let x = t.clientX;
		let y = t.clientY;

		let j = mge.joysticks[x < mge.elem.clientWidth / 2 ? 'L' : 'R'];

		if (!j.active) return;

		j.id = t.identifier;
		j.tip.x = x;
		j.tip.y = y;

		j.prev.x = x;
		j.prev.y = y;

		if (!j.base.fixed) {
			j.base.x = j.tip.x;
			j.base.y = j.tip.y;
		}

		j.updatePos();

		let r = j.base.elem.clientWidth / 2;

		if (j.pos.d * r > r) {
			j.pos = { x: 0, y: 0, d: 0 };
			j.tip.x = j.base.x;
			j.tip.y = j.base.y;
		} else {
			j.time = time;
			j.tip.active = true;
		}
	}
});

document.querySelector('.tactile').addEventListener('touchmove', event => {
	event.preventDefault();

	for (let t of event.changedTouches) {
		let x = t.clientX;
		let y = t.clientY;

		mge.joysticks.forEach(j => {
			if (j.id == t.identifier && j.tip.active) {
				j.prev = { ...j.tip };

				j.tip.x = x;
				j.tip.y = y;

				if (j.base.fixed && j.tip.held) j.prev = { ...j.tip };

				j.updatePos();

				if (j.pos.d > 1) {
					let r = j.base.elem.clientWidth / 2;

					if (j.base.fixed) {
						j.tip.x = j.base.x + (j.pos.x * r) / j.pos.d;
						j.tip.y = j.base.y + (j.pos.y * r) / j.pos.d;
					} else {
						j.base.x = j.tip.x - (j.pos.x * r) / j.pos.d;
						j.base.y = j.tip.y - (j.pos.y * r) / j.pos.d;
					}

					j.updatePos();
				}
			}
		});
	}
});

document.querySelector('.tactile').addEventListener('touchend', event => {
	event.preventDefault();

	for (let t of event.changedTouches) {
		let x = t.clientX;
		let y = t.clientY;

		mge.joysticks.forEach(j => {
			if (j.id == t.identifier) {
				if (j.tip.active) {
					if (j.base.active) {
						if (j.tip.held) j.onHoldEnd(j);
						else j.onPushEnd(j);
					} else j.onTap(j);
				}

				j.tip.active = false;
				j.base.active = false;
				j.tip.held = false;

				j.id = -1;
			}
		});
	}
});

// Context
mge.ctx = mge.canvas.getContext('2d');

// Show canvas
mge.setOverlay('blank');

// Resize event
addEventListener('resize', event => mge.resize());
mge.resize();

// Fullscreen section event
document.querySelector('.mge-overlay #fullscreen').addEventListener('click', event => mge.setFullscreen('on'));
