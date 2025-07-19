export enum OPERATE_TYPE {
	PLUS,
	SUB,
	MULT,
	DIV,
	AND,
	OR,
	EQUAL,
	NOT_EQUAL,
	DEFAULT,
	MORE_THAN,
	LESS_THAN,
	MORE_EQUAL,
	LESS_EUQAL,
}

export enum CALCULATION_TYPE {
	EXPRESSION,
	PATH,
	NORMAL,
}

class CalculationNode {
	public type: OPERATE_TYPE;

	public left: CalculationNode | null;

	public right: CalculationNode | null;

	public preNode: CalculationNode | null;

	private value: string;

	constructor() {
		this.type = OPERATE_TYPE.DEFAULT;
		this.left = null;
		this.right = null;
		this.preNode = null;
		this.value = '';
	}

	// 设置value
	public setValue(value: string): void {
		this.value = value;
	}

	// 添加value
	public plusValue(value: string): void {
		this.value += value;
	}

	// 获取value
	public getValue(): string {
		return this.value;
	}

	// 确定当前的类型
	public confirmType(): void {
		const v = this.value.trim();
		switch (v) {
		case '+':
			this.type = OPERATE_TYPE.PLUS;
			break;
		case '-':
			this.type = OPERATE_TYPE.SUB;
			break;
		case '*':
			this.type = OPERATE_TYPE.MULT;
			break;
		case '/':
			this.type = OPERATE_TYPE.DIV;
			break;
		case '||':
			this.type = OPERATE_TYPE.OR;
			break;
		case '&&':
			this.type = OPERATE_TYPE.AND;
			break;
		case '!=':
			this.type = OPERATE_TYPE.NOT_EQUAL;
			break;
		case '!==':
			this.type = OPERATE_TYPE.NOT_EQUAL;
			break;
		case '===':
			this.type = OPERATE_TYPE.EQUAL;
			break;
		case '==':
			this.type = OPERATE_TYPE.EQUAL;
			break;
		case '>':
			this.type = OPERATE_TYPE.MORE_THAN;
			break;
		case '<':
			this.type = OPERATE_TYPE.LESS_THAN;
			break;
		case '<=':
			this.type = OPERATE_TYPE.LESS_EUQAL;
			break;
		case '>=':
			this.type = OPERATE_TYPE.MORE_EQUAL;
			break;
		default:
			break;
		}
	}
}

export default CalculationNode;
