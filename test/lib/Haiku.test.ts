import {TestFixture, AsyncTest, Expect, TestCase, Timeout} from "alsatian";
import {TestBase} from "../TestBase";
import Haiku from "../../src";

@TestFixture("haikujs")
export class HaikuTest extends TestBase {
	@AsyncTest("俳句")
	@Timeout(5000)
	@TestCase("古池や蛙飛び込む水の音")
	@TestCase("柿くへば鐘が鳴るなり法隆寺")
	@TestCase("菜の花や月は東に日は西に")
	public async haikuTest(text: string) {
		const result = await Haiku.match(text);
		Expect(result).toBe(true);
	}

	@AsyncTest("俳句じゃない")
	@Timeout(5000)
	@TestCase("烏龍茶")
	@TestCase("それサバンナでも同じこと言えんの？")
	@TestCase("感じ取れたら手を繋ごう、重なるのは人生のライン and レミリア最高！")
	public async nonHaikuTest(text: string) {
		const result = await Haiku.match(text);
		Expect(result).toBe(false);
	}

	@AsyncTest("俳句を含む")
	@Timeout(5000)
	@TestCase("ウオオオオオオオオ古池や蛙飛び込む水の音ウオオオオオオオオ", ["古池や蛙飛び込む水の音"])
	@TestCase("ウオオオオオオオオ柿くへば鐘が鳴るなり法隆寺ウオオオオオオオオ", ["柿くへば鐘が鳴るなり法隆寺"])
	@TestCase("ウオオオオオオオオ菜の花や月は東に日は西にウオオオオオオオオ", ["菜の花や月は東に日は西に"])
	@TestCase("ウオオオオオオオオ菜の花や月は東に日は西にウオオオオオオオオ古池や蛙飛び込む水の音ウオオオオオオオオ", ["菜の花や月は東に日は西に", "古池や蛙飛び込む水の音"])
	@TestCase("感じ取れたら手を繋ごう、重なるのは人生のライン and レミリア最高！古池や蛙飛び込む水の音ウオオオオオオオオ", ["古池や蛙飛び込む水の音"])
	public async containHaikuTest(text: string, expect: string[]) {
		const result = await Haiku.find(text);
		Expect(result.result).toBe(true);
		Expect(result.haikus).toEqual(expect);
	}
}
