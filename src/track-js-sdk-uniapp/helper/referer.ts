type actType = 'click' | 'exposure' | 'swipe' | 'elapse';

interface AttributesType {
	name: string;
	value: string;
	type: number;
}

interface ActionType {
	key?: string;
	path: string;
	act_type: actType;
	page_id: string;
	attributes: AttributesType[];
}

export default class Referer {
	private pageStack: Map<string, Map<number, ActionType[] | undefined>>;

	private elapsePage: string[];

	public refer: ActionType[];

	public page: string[];

	public isBack: boolean;

	public pageBack: boolean;

	constructor() {
		this.pageStack = new Map(); // 存放点击的栈
		this.page = []; // 曝光的页面进入的栈
		this.refer = []; // 正常使用的refer栈
		this.elapsePage = []; // tab页点击的时候存放的pageName
		this.isBack = true;
		this.pageBack = true;
	}

	public push(pageName: string) {
		this.resetRefer();
		this.page.unshift(pageName);
		// console.log(pageName, 'push');
		if (this.pageStack.has(pageName)) {
			const page = this.pageStack.get(pageName);
			page?.set(page.size + 1, undefined);
		} else {
			this.pageStack.set(pageName, new Map());
		}
	}

	public pushElapse(pageName: string) {
		this.elapsePage.push(pageName);
	}

	public pushEvent(action: ActionType) {
		const length = this.page.length;
		const pageName = action.page_id;
		if (length) {
			if (this.has(pageName)) {
				const pageMap = this.pageStack.get(pageName) as Map<number, ActionType[]>;
				const pageSet = pageMap.get(pageMap.size || 1);
				if (pageSet) {
					pageSet.push(action);
				} else {
					pageMap.set(pageMap.size || 1, [action]);
				}
			} else {
				console.error('当前页面栈为空，请先添加页面');
			}
		}
	}

	public deleteEvent() {
		if (this.page.length) {
			const lastPage = this.page[0];
			const pageMap = this.pageStack.get(lastPage);
			const stack = pageMap?.get(pageMap.size || 1);
			if (stack && stack.length) {
				stack.splice(0, stack.length);
			}
		}
	}

	public has(pageName: string) {
		return this.pageStack.has(pageName);
	}

	public get(pageName: string) {
		return this.pageStack.get(pageName);
	}

	public clear(pageName: string) {
		if (this.page.length && pageName === this.page[this.page.length - 1]) {
			this.page = [];
			this.refer = [];
			this.elapsePage = [];
			this.pageStack.clear();
		}
	}

	public back() {
		if (this.isBack && this.lastPage) {
			this.page.shift();
			// 当前页面退栈了， 前一个页面的事件也需要清空
			this.deleteEvent();
			this.resetRefer(true);
		}
	}

	public getLastTabPage(tabs: string[] = []) {
		if (!tabs.length) {
			return this.lastPage;
		}
		let i = 0;
		while (!tabs.includes(this.page[i]) && this.page[i]) {
			i++;
		}
		return this.page[i] || '';
	}

	private resetRefer(isBack?: boolean) {
		const length = this.page.length;
		this.refer = [];
		if (length) {
			const tempPage = this.page.slice();
			if (isBack) {
				tempPage.shift();
			}
			const cache: Record<string, number> = {};
			const shouldAddReferPages = length > 3 ? tempPage.slice(0, 3) : tempPage;
			// console.log(shouldAddReferPages, 'page');
			// console.log(this.pageStack, this.pageStack.size, 'pageStack');
			shouldAddReferPages.forEach((page) => {
				if (cache[page] !== undefined) {
					cache[page]++;
				} else {
					cache[page] = 0;
				}
				const stack = this.pageStack.get(page);
				const size = stack?.size;
				if (size) {
					let action;
					let i = size;
					while (i) {
						const act = stack?.get(i - cache[page]);
						if (act && act.length) {
							action = act[act.length - 1];
							break;
						}
						i--;
					}
					if (action && action.page_id) action.page_id = action.page_id.replace('WebReferMask', '');
					action && this.refer.push(action);
				}
			});
		}
	}

	get lastElapseAction() {
		if (this.elapsePage.length) {
			return this.elapsePage[this.elapsePage.length - 1];
		}
		return undefined;
	}

	get lastPage() {
		return this.page.length ? this.page[0] : null;
	}
}
