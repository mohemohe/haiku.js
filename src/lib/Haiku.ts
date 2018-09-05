import kuromoji = require("kuromoji");

const reWord = /^[ァ-ヾ]+$/g
const reIgnoreText = /[\[\]「」『』]/g
const reIgnoreChar = /[ァィゥェォャュョ]/g
const reKana = /[ァ-タダ-ヶ]/g

function debug(...args: any[]) {
	if (process.env.NODE_ENV === "debug") {
		console.debug(...args);
	}
}

export default class Haiku {
	private static tokenize(text: string) {
		return new Promise<kuromoji.IpadicFeatures[]>((resolve, reject) => {
			const builder = kuromoji.builder({
				dicPath: "node_modules/kuromoji/dict",
			});
			builder.build((error, tokenizer) => {
				if (error) {
					reject(error);
				}
				const tokens = tokenizer.tokenize(text);
				resolve(tokens);
			});
		})
	}

	private static isEnd(token: kuromoji.IpadicFeatures) {
		return token.pos_detail_1 !== "非自立" && !token.conjugated_type.startsWith("連用") && token.conjugated_type !== "未然形"
	}

	private static isSpace(token: kuromoji.IpadicFeatures) {
		return token.pos_detail_1 === "空白";
	}

	private static isWord(token: kuromoji.IpadicFeatures) {
		return ["名詞", "形容詞", "形容動詞", "副詞", "連体詞", "接続詞", "感動詞", "接頭詞", "フィラー"].filter((type) => {
			return token.pos === type;
		}).length !== 0 ?
			true :
		token.pos === "動詞" && token.pos_detail_1 !== "接尾" ?
			true :
		token.pos === "カスタム人名" || token.pos === "カスタム名詞" ?
			true :
			false;
	}

	private static countChars(text: string) {
		return text.replace(reIgnoreChar, "").length;
	}

	public static async match(target: string | kuromoji.IpadicFeatures[], rule: number[] = [5, 7, 5]) {
		let tokens;
		if (typeof target === typeof "") {
			target = (target as string).replace(reIgnoreText, " ");
			debug(target, "--------------------");
			tokens = await this.tokenize(target as string);
		} else {
			tokens = target as kuromoji.IpadicFeatures[];
		}

		let pos = 0;

		const r = Object.assign([], rule) as number[];

		for (let i = 0; i < tokens.length; i++) {
			const tok = tokens[i];
			debug("トークン");
			debug(tok);

			const c = tok.reading;
			debug("読み:", c);

			if (!c || [...c].length === 0 || (r[pos] === rule[pos] && this.isSpace(tok))) {
				continue;
			}
			const y = [...c].pop() as string;
			debug("最後の文字:", y);

			if (!y.match(reWord)) {
				if (y === "、") {
					continue;
				}
				return false;
			}

			debug(r, r[pos], rule[pos], !this.isWord(tok));
			if (r[pos] === rule[pos] && !this.isWord(tok)) {
				return false;
			}
			const n = this.countChars(c);
			debug(n, "文字")
			r[pos] -= n;
			if (r[pos] === 0) {
				pos++;
				if (pos === [...r].length && i === tokens.length -1) {
					return true;
				}
			}
		}

		return false;
	}

	public static async find(text: string, rule: number[] = [5, 7, 5]) {
		text = text.replace(reIgnoreText, " ");
		const tokens = await this.tokenize(text);

		let targetLen = rule.reduce((prev, current) => {
			return prev + current;
		});
		let len = 0;
		let start = 0;
		let end = 0;
		const haikus: string[] = [];
		for (let i = 0; i < tokens.length; i++) {
			const token = tokens[i];
			if (token.reading) {
				len += [...token.reading.replace(reIgnoreChar, "").replace(/、/g, "")].length;
			} else {
				if (len === 0) {
					start = i + 1;
					continue;
				} else {
					continue;
				}
			}

			debug(i, token.reading);
			if (len === targetLen) {
				debug("found", start,end)
				end = i;
				const toks = tokens.slice(start, end + 1);
				debug(start, end);
				const check = await this.match(toks);
				if (check) {
					const haiku = toks.map((tok) => tok.surface_form).join("");
					haikus.push(haiku);
				}
				len = 0;
				start = i + 1;
			} else if (len > targetLen) {
				len = 0;
				start = start + 1;
				i = start;
			}
		}

		return {
			result: haikus.length !== 0,
			haikus,
		}
	}
}
