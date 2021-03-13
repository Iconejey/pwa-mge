customElements.define(
	'mge-section',
	class extends HTMLElement {
		constructor() {
			super();

			// Shadow Root
			this.root = this.attachShadow({ mode: 'open' });

			this.root.innerHTML = `
				<link rel="stylesheet" href="./styles/section.css">
				<style></style>
				<slot></slot>
			`;
		}

		set pausing(val) {
			if (val) this.setAttribute('pausing', '');
			else this.removeAttribute('pausing');
		}

		get pausing() {
			return this.getAttribute('pausing') !== null;
		}

		set temp(val) {
			if (val) this.setAttribute('temp', '');
			else this.removeAttribute('temp');
		}

		get temp() {
			return this.getAttribute('temp') !== null;
		}

		static get observedAttributes() {
			return ['pausing', 'id', 'temp'];
		}

		attributeChangedCallback(name, oldValue, newValue) {
			if (this.parentElement) this.parentElement.updatePause();

			if (name === 'id' || name === 'temp') {
				this.root.querySelector('style').innerHTML = `
					:host-context(pwa-mge:not([temp]):not([section='${this.id}'])),
					:host-context(pwa-mge[temp]:not([temp='${this.id}'])) {
						display: none !important;
					}
				`;
			}
		}
	}
);
