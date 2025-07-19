import Calculation from '../../../helper/calculation/calculation';

const calculation = new Calculation();
/* eslint-disable*/
export default function parseExpression(json: any) {
	const {
		value,
	} = json;
	const data = json?.data?.data || {};
	let temp = '';
	try {
		if (eval) {
			const isFunction = /function/.test(value);
			const string = `
				var data = ${JSON.stringify(data)};
				if (${isFunction}) {
					temp = ${value}();
				} else {
					temp = (function() {
						return ${value}
					}())
				}
			`;
			eval(string);
		} else {
			temp = calculation.done(json);
		}
	} catch (error) {
		console.log('track', error)
	}	
	return temp;
}