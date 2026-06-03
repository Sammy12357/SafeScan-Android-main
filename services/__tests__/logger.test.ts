import { log, registerCrashSink } from "@/services/logger";

describe("logger", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    registerCrashSink(null);
    consoleErrorSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it("invokes the registered crash sink for errors", () => {
    const sink = jest.fn();
    registerCrashSink(sink);
    const err = new Error("boom");
    log.error(err, { route: "/scan-result/1" });
    expect(sink).toHaveBeenCalledWith(err, { route: "/scan-result/1" });
  });

  it("swallows exceptions thrown by the crash sink", () => {
    registerCrashSink(() => {
      throw new Error("sink failure");
    });
    expect(() => log.error(new Error("boom"))).not.toThrow();
  });

  it("allows clearing the sink", () => {
    const sink = jest.fn();
    registerCrashSink(sink);
    registerCrashSink(null);
    log.error(new Error("nope"));
    expect(sink).not.toHaveBeenCalled();
  });
});
