import { describe, expect, it, vi } from "vitest";

import { greet } from "./greet.js";

const message = "Yay, testing!";

describe("greet", () => {
	it("logs to the console once when message is provided as a string", () => {
		const logger = vi.spyOn(console, "log").mockImplementation(() => undefined);

		greet(message);

		expect(logger).toHaveBeenCalledWith(message);
		expect(logger).toHaveBeenCalledTimes(1);
	});

	it("logs to the console once when message is provided as an object", () => {
		const logger = vi.spyOn(console, "log").mockImplementation(() => undefined);

		greet({ message });

		expect(logger).toHaveBeenCalledWith(message);
		expect(logger).toHaveBeenCalledTimes(1);
	});

	it("logs once when times is not provided in an object", () => {
		const logger = vi.fn();

		greet({ logger, message });

		expect(logger).toHaveBeenCalledWith(message);
		expect(logger).toHaveBeenCalledTimes(1);
	});

	it("logs a specified number of times when times is provided", () => {
		const logger = vi.fn();
		const times = 7;

		greet({ logger, message, times });

		expect(logger).toHaveBeenCalledWith(message);
		expect(logger).toHaveBeenCalledTimes(7);
	});
});
