export interface PlatformFace {
  isApp: boolean;
  [name: string]: number | boolean | string;
}

const platform: PlatformFace = {
	isAndroid: false,
	isIos: false,
	isApp: false,
	version: 0,
	appVersion: 0,
};

const ua: string = navigator?.userAgent;
const android = ua?.match(/.*Android\s([\d.]+)/);
const ios = ua?.match(/.*OS\s([\d_]+)/);
const ddxq = /xzone/.test(ua);
const appVersion = ua?.match(/xzone\/((\d\.?)+)/);

if (android) {
	platform.isAndroid = true;
	platform.version = android[1] || 0;
} else if (ios) {
	platform.isIos = true;
	platform.version = ios[1].replace(/_/g, '.') || 0;
}

if (ddxq) {
	platform.isApp = true;
}

if (appVersion) {
	const [, version] = appVersion;
	platform.appVersion = version;
}

export default platform;
