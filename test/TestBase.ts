import { AsyncSetupFixture, AsyncTeardownFixture } from "alsatian";

export class TestBase {
	@AsyncSetupFixture
	public async setupFixtureAsync() {
		return;
	}

	@AsyncTeardownFixture
	public async teardownFixtureAsync() {
		return;
	}
}
