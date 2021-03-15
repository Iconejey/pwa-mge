const render = html => {
	let temp = document.createElement('template');
	temp.innerHTML = html;
	return temp.content.cloneNode(true);
};

class GameEngineElement extends HTMLElement {
	constructor() {
		super();

		// Shadow Root
		this.root = this.attachShadow({ mode: 'open' });

		this.root.innerHTML = `
			<link rel="stylesheet" href="./styles/pwa-mge.css">
			<link id="inner-css" rel="stylesheet">
			<canvas></canvas>
			<div class="tactile" oncontextmenu="return false"></div>
			<slot></slot>
		`;

		// Canvas
		this.canvas = this.get('canvas');
		this.ctx = this.canvas.getContext('2d');

		// Device
		this.device = /Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop';

		// Navigator
		this.navigator = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor) ? 'chrome' : 'unsafe';

		// Handle resizing event
		addEventListener('resize', e => this.handleResize());

		// Handle Slot change event
		this.get('slot').addEventListener('slotchange', e => {
			this.handleResize();
			this.updatePause();
		});
	}

	// Get element from shadow root
	get(selector, n = 0) {
		return this.root.querySelectorAll(selector)[n];
	}

	// section attribute
	set section(id) {
		if (id) this.setAttribute('section', id);
		else this.removeAttribute('section');
	}

	get section() {
		return this.getAttribute('section');
	}

	// temp attribute
	set temp(id) {
		if (id) this.setAttribute('temp', id);
		else this.removeAttribute('temp');
	}

	get temp() {
		return this.getAttribute('temp');
	}

	// Get section by ID
	getSection(id) {
		return id ? this.querySelector('mge-section#' + id) : null;
	}

	// Actual section element
	get section_element() {
		return this.getSection(this.section);
	}

	// Actual temp element
	get temp_element() {
		return this.getSection(this.temp);
	}

	// Get all section elements
	get sections() {
		return this.querySelectorAll('mge-section');
	}

	// paused attribute
	set paused(val) {
		if (val) this.setAttribute('paused', '');
		else this.removeAttribute('paused');
	}

	get paused() {
		return this.getAttribute('paused') !== null;
	}

	// Update paused attribute
	updatePause() {
		this.paused = (this.section_element && this.section_element.pausing) || (this.temp_element && this.temp_element.pausing);
	}

	// landscape attribute
	set landscape(val) {
		if (val) this.setAttribute('landscape', '');
		else this.removeAttribute('landscape');
	}

	get landscape() {
		return this.getAttribute('landscape') !== null;
	}

	// fullscreen attribute
	set fullscreen(val) {
		(val ? this.requestFullscreen() : document.exitFullscreen()).catch(err => err);
		this.updateFullscreen();
	}

	get fullscreen() {
		this.updateFullscreen();
		return this.getAttribute('fullscreen') !== null;
	}

	// innerStyleSrc attribute
	set innerStyleSrc(val) {
		this.get('link#inner-css').href = val;
	}

	get innerStyleSrc() {
		return this.get('link#inner-css').href;
	}

	// Joysticks
	newJoystick(id, isFixed = false, isDisabled = false) {
		let t = this.get('.tactile');
		if (!GameJoystick.surface) GameJoystick.init(t);

		let j = new GameJoystick();
		if (t.querySelector('#' + id)) return console.error('Game already has ' + name + ' joystick.');

		j.id = id;
		j.fixed = isFixed;
		j.disabled = isDisabled;
		j.state = 'free';

		t.appendChild(j);
	}

	updateFullscreen() {
		if (this.offsetHeight > screen.height * 0.9) this.setAttribute('fullscreen', '');
		else this.removeAttribute('fullscreen');
	}

	setFullResolution() {
		this.canvas.width = this.canvas.clientWidth * devicePixelRatio;
		this.canvas.height = this.canvas.clientHeight * devicePixelRatio;
	}

	static get observedAttributes() {
		return ['section', 'temp', 'fullscreen', 'landscape'];
	}

	attributeChangedCallback(name, oldValue, newValue) {
		this.updatePause();

		if (['fullscreen', 'landscape'].includes(name) && oldValue != newValue) {
			this.dispatchEvent(new CustomEvent(name + 'change', { bubbles: true, composed: true }));
		}

		if (name == 'temp' && oldValue !== newValue) {
			let s = this.getSection(oldValue);
			if (s && s.temp) s.remove();
		}
	}

	handleResize() {
		this.landscape = outerWidth > outerHeight;
		this.updateFullscreen();
	}

	newSection(id, pausing = false, temp = false, innerHTML = '') {
		let s = document.createElement('mge-section');
		s.id = id;
		s.pausing = pausing;
		s.temp = temp;
		s.innerHTML = innerHTML;

		if (s.temp) this.temp = id;

		return this.appendChild(s);
	}

	// Images
	loadImages(src_list) {
		let n = 0;
		let promises = [];

		for (let src of src_list) {
			promises.push(
				new Promise((res, err) => {
					let img = document.createElement('img');
					img.src = src;

					img.addEventListener('load', e => {
						n++;
						this.dispatchEvent(new CustomEvent('img-load-progress', { detail: { src: src, progress: n / src_list.length }, bubbles: true, composed: true }));
						res(img);
					});
				})
			);
		}

		return Promise.all(promises);
	}
}

customElements.define('pwa-mge', GameEngineElement);

document.write('<script src="./src/mge-section.js"></script>');
document.write('<script src="./src/mge-joystick.js"></script>');
document.write('<script src="./src/cookie.js"></script>');
document.write('<link rel="stylesheet" href="./styles/global.css" />');
