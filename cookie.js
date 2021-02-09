const setCookie = (key, val, exp = 720) => {
	let d = new Date();
	d.setTime(d.getTime() + exp * 24 * 60 * 60 * 1000);
	document.cookie = `${key}=${val};expires=${d.toUTCString()}`;
};

const getCookie = key => {
	for (let cookie of document.cookie.split('; ')) {
		let pair = cookie.split('=');
		if (pair[0] == key) return pair[1];
	}

	return '';
};

const initCookie = (key, val) => {
	if (!getCookie(key)) setCookie(key, val);
};

const remCookie = key => {
	document.cookie = key + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;Secure';
};
