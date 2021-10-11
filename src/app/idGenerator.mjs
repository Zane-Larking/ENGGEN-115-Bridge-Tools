export class IdGenerator {
	constructor(chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
		this._chars = chars;
		this._nextId = [0];
		this.releasedIds = [];
	}
	
	next() {
		if (this.releasedIds.length > 0) {
			return this.releasedIds.shift();
		}
		const r = [];
		for (const char of this._nextId) {
			r.unshift(this._chars[char]);
		}
		this._increment();
		return r.join('');
	}
	
	_increment() {
		for (let i = 0; i < this._nextId.length; i++) {
			const val = ++this._nextId[i];
			if (val >= this._chars.length) {
				this._nextId[i] = 0;
			} else {
				return;
			}
		}
		this._nextId.push(0);
	}
	
	release(id) {
		this.releasedIds.push(id);
		this.releasedIds.sort((a, b) => {
			if(a < b) { return -1; }
			if(a > b) { return 1; }
			return 0;
		})
	}
	
	*[Symbol.iterator]() {
		while (true) {
			yield this.next();
		}
	}
}