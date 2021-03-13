class GameJoystick extends HTMLElement {
	static surface = null;

	static init(elem) {
		GameJoystick.surface = elem;
		elem.addEventListener('touchstart', e => GameJoystick.processEvent(e));
		elem.addEventListener('touchmove', e => GameJoystick.processEvent(e));
		elem.addEventListener('touchend', e => GameJoystick.processEvent(e));
	}

	static processEvent(e) {
		let s = GameJoystick.surface;

		for (let touch of e.changedTouches) {
			let side = touch.clientX < s.clientWidth / 2 ? 'left' : 'right';
			let id = touch.identifier;

			let j = s.querySelector(`[touch='${id}']`) || s.querySelector('#' + side);
			if (j && !j.disabled) j[e.type](touch.clientX, touch.clientY, performance.now(), id);
		}
	}

	///// ///// /////

	constructor() {
		super();

		// Shadow Root
		this.root = this.attachShadow({ mode: 'open' });
		this.root.innerHTML = `
			<link rel="stylesheet" href="./styles/joystick.css">
			<span class="base"></span>
			<span class="tip"></span>
		`;

		this.time = null;
		this._replace_timeout = null;
		this._held_state_timeout = null;

		let pos = { initx: 0, inity: 0, x: 0, y: 0 };

		this._tip = {
			...pos,
			elem: this.shadowRoot.querySelector('span.tip')
		};

		this._base = {
			...pos,
			elem: this.shadowRoot.querySelector('span.base')
		};

		setTimeout(e => {
			let x = this._tip.elem.offsetLeft;
			let y = this._tip.elem.offsetTop;

			this.tip = { initx: x, inity: y };
			this.tip = null;

			this.base = { initx: x, inity: y };
			this.base = null;
		}, 100);
	}

	// disabled attribute
	set disabled(val) {
		if (val) {
			this.setAttribute('disabled', '');
			this.state = 'free';
		} else this.removeAttribute('disabled');
	}

	get disabled() {
		return this.getAttribute('disabled') !== null;
	}

	// fixed attribute
	set fixed(val) {
		if (val) this.setAttribute('fixed', '');
		else this.removeAttribute('fixed');
	}

	get fixed() {
		return this.getAttribute('fixed') !== null;
	}

	// state attribute
	set state(val) {
		if (val) this.setAttribute('state', val);
		else this.removeAttribute('state');
	}

	get state() {
		return this.getAttribute('state');
	}

	// touch attribute
	set touch(val) {
		if (val != null) this.setAttribute('touch', val);
		else this.removeAttribute('touch');
	}

	get touch() {
		return this.getAttribute('touch');
	}

	// Delay
	get delay() {
		return this.time ? performance.now() - this.time : null;
	}

	// Tip
	set tip(obj) {
		if (obj === null) this.tip = { x: this._tip.initx, y: this._tip.inity };
		else this._tip = { ...this._tip, ...obj };
		this.updateStyle(obj);
	}

	get tip() {
		return { x: this._tip.x, y: this._tip.y };
	}

	// Base
	set base(obj) {
		if (obj === null) this.base = { x: this._base.initx, y: this._base.inity };
		else this._base = { ...this._base, ...obj };
		this.updateStyle(obj);
	}

	get base() {
		return { x: this._base.x, y: this._base.y };
	}

	// Radius
	get r() {
		return this._base.elem.clientWidth / 2;
	}

	// Position
	set dx(val) {
		this.tip = { x: this.base.x + val * this.r };
	}

	get dx() {
		return (this.tip.x - this.base.x) / this.r;
	}

	set dy(val) {
		this.tip = { y: this.base.y + val * this.r };
	}

	get dy() {
		return (this.tip.y - this.base.y) / this.r;
	}

	set dxy(val) {
		let d = this.dxy;
		this.dx = (this.dx / d) * val;
		this.dy = (this.dy / d) * val;
		this.dxy;
	}

	get dxy() {
		let dx = this.dx;
		let dy = this.dy;
		return Math.sqrt(dx * dx + dy * dy);
	}

	// Events
	trigger(event_type) {
		this.dispatchEvent(new CustomEvent(event_type, { bubbles: true, composed: true }));
	}

	// Style
	updateStyle(obj) {
		if (obj !== null) {
			let style = `
				--tip-x: ${this._tip.x}px;
				--tip-y: ${this._tip.y}px;
				--base-x: ${this._base.x}px;
				--base-y: ${this._base.y}px;
			`;

			this.setAttribute('style', style);
		} else this.removeAttribute('style');
	}

	// Touch start
	touchstart(x, y, t, id) {
		this.touch = id;
		this.time = t;

		if (!this.fixed) this.base = { x: x, y: y };

		clearTimeout(this._replace_timeout);

		this.touchmove(x, y, t, id);
	}

	// Touch move
	touchmove(x, y, t, id) {
		this.tip = { x: x, y: y };

		if (this.state == 'free' && (!this.fixed || this.dxy < 1)) {
			this.state = 'tap';
			this._held_state_timeout = setTimeout(e => {
				this.state = 'held';
				this.trigger('held-start');
			}, 200);
		}

		if (this.state != 'free') {
			if (this.state == 'held') this.base = this.tip;

			if (this.dxy > 2) {
				this.dxy = 1;
				this.touchend(x, y, t, id);
			}

			if (this.state == 'tap' && this.dxy > 0.2) {
				this.state = 'push';
				clearTimeout(this._held_state_timeout);
				this.trigger('push-start');
			}

			if (this.dxy > 1) {
				if (this.fixed) this.dxy = 1;
				else {
					let d = this.r / this.dxy;
					this.base = {
						x: this.tip.x - this.dx * d,
						y: this.tip.y - this.dy * d
					};
				}
			}

			if (this.state != 'tap') this.trigger(this.state + '-move');
		}
	}

	// Touch end
	touchend(x, y, t, id) {
		clearTimeout(this._held_state_timeout);

		this._replace_timeout = setTimeout(
			e => {
				this.base = null;
				this.tip = null;
			},
			this.state == 'held' && this.fixed ? 100 : 500
		);

		if (this.state == 'tap') this.trigger('tap');
		else this.trigger(this.state + '-end');

		this.touch = null;
		this.state = 'free';
		this.time = null;
	}
}

customElements.define('mge-joystick', GameJoystick);
