// Setting left joystick as fixed with 0.2 min opacity
mge.joysticks.L.base.fixed = true;
mge.joysticks.L.base.opacity.min = 0.2;
mge.joysticks.L.tip.opacity.min = 0.2;

// Example player object
let player = { x: 128, y: 128, s: 1 };

// Activating joysticks after 1s
setTimeout(_ => mge.joysticks.forEach(j => j.setActive(true)), 1000);

// Showing example section on left-joystick tap
mge.joysticks.L.onTap = j => mge.setOverlay('example');

// Make player jump to the zone tapped with right-joystick
mge.joysticks.R.onTap = j => (player = { ...player, ...mge.toGameCoords(j.tip) });

// Move player with left-joystick push
mge.joysticks.L.onPush = j => {
	player.x += (j.pos.x * player.s * delay) / 20;
	player.y += (j.pos.y * player.s * delay) / 20;
};

// Left-joystick hold position
let hold_pos;

// Set left-joystick free on hold and remember position
mge.joysticks.L.onHoldStart = j => {
	hold_pos = { ...j.tip };
	j.base.fixed = false;
};

// Move camera with left-joystick hold
mge.joysticks.L.onHold = j => {
	let new_pos = { ...j.tip };
	let x = player.x - ((new_pos.x - hold_pos.x) / mge.elem.clientHeight) * 200;
	let y = player.y - ((new_pos.y - hold_pos.y) / mge.elem.clientHeight) * 200;
	mge.camera.set({ x: x, y: y, z: 128 }, 0.05);
};

// Set left-joystick fixed when holding ends and reposition it
mge.joysticks.L.onHoldEnd = j => {
	j.base.fixed = true;
	j.position();
};

// Make player sprint on Right-joystick hold
mge.joysticks.R.onHoldStart = j => (player.s = 2);
mge.joysticks.R.onHoldEnd = j => (player.s = 1);

// Make player slow down on Right-joystick push
mge.joysticks.R.onPushStart = j => (player.s = 0.5);
mge.joysticks.R.onPushEnd = j => (player.s = 1);

// Logic loop
mge.logic = _ => {
	// Fps count
	document.querySelector('span#fps').innerHTML = Math.floor(1000 / delay);
};

// Graphics loop
mge.graphics = _ => {
	// Clear canvas
	mge.clear();

	// Smoothly follow player with camera
	if (!mge.joysticks.L.tip.held) mge.camera.set({ ...player, z: 100 }, 0.05);

	// Draw background
	mge.ctx.drawImage(imgs['default_background'], 0, 0);

	// Draw player
	mge.ctx.fillStyle = 'white';
	let x = Math.floor(player.x);
	let y = Math.floor(player.y);
	mge.ctx.fillRect(x, y, 1, 1);
};

// Game images
let imgs = [];

// Loading images
mge.loadImg(
	// In
	['./img/default_background.png'],
	// Out
	imgs,
	// When an image loaded
	p => console.log('loading ' + Math.floor(100 * p) + '%'),
	// If an error occurs
	src => console.error('Could not load ' + src),
	// When all images loaded
	_ => {
		// Set canvas size
		let bg = imgs['default_background'];
		mge.canvas.width = bg.width;
		mge.canvas.height = bg.height;

		// Camera on player
		mge.camera.set({ ...player, z: 100 }, 1);

		// Main loop
		mge.start();
	}
);
