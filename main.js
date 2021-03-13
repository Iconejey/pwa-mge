let mge;

addEventListener('load', e => {
	// pwa-mge element
	mge = document.querySelector('pwa-mge');

	// Navigator compatibility
	// if (mge.navigator != 'chrome') alert('This navigator may not support all features.');

	// Show appropriate section if not in fullscreen or not landscape.
	let screenCallback = e => {
		if (!mge.fullscreen && mge.device == 'mobile') mge.temp = 'fullscreen';
		else if (!mge.landscape) mge.temp = 'landscape';
		else mge.temp = null;
	};

	// Call screenCallBack when mge.fullscreen or mge.landscape changed.
	mge.addEventListener('fullscreenchange', screenCallback);
	mge.addEventListener('landscapechange', screenCallback);
	screenCallback();

	let resCallback = e => {
		mge.setFullResolution();
		mge.querySelector('span#res').textContent = mge.canvas.width + 'x' + mge.canvas.height;
	};

	// Make canvas full resolution.
	addEventListener('resize', e => resCallback());
	resCallback();

	mge.getSection('fullscreen').addEventListener('click', e => (mge.fullscreen = true));

	// Set style applied to shadow dom.
	mge.innerStyleSrc = './inner.css';

	// Joysticks
	setTimeout(e => mge.newJoystick('left', true, false), 1000);
	setTimeout(e => mge.newJoystick('right', false, false), 1000);
});
