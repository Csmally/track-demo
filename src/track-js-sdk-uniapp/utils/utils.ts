export const getEleXPath = (el: Element) => {
	let path = el.tagName;
	let temp = el;
	while (temp.parentElement) {
		path += temp.tagName;
		temp = temp.parentElement;
	}
	return path;
};

export const isCanObserve = (that: any) => {
	let temp = that;
	while (temp) {
		if (!temp.isCanObserve) {
			return false;
		}
		temp = temp.$parent;
	}
	return true;
};

export const getDefaultData = (data: any) => {
	if (data || data === 0) {
		return data;
	}

	return '';
};
/**
 * 比较版本号, v1 < v2: -1; v1 == v2 : 0; v1 > v2 : 1;
 * @param ver1
 * @param ver2
 * @returns {number}
 */
export const versionCompare = (v1: any, v2: any): number => {
	const newV1 = String(v1).split('.');
	const newV2 = String(v2).split('.');
	const len = Math.max(newV1.length, newV2.length);

	while (newV1.length < len) {
		newV1.push('0');
	}
	while (newV2.length < len) {
		newV2.push('0');
	}

	for (let i = 0; i < len; i++) {
		const num1: number = parseInt(newV1[i], 10);
		const num2: number = parseInt(newV2[i], 10);

		if (num1 > num2) {
			return 1;
		} if (num1 < num2) {
			return -1;
		}
	}

	return 0;
};
