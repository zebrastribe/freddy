describe('logger', () => {
  let logger;
  let originalConsoleLog;
  let originalConsoleWarn;
  let originalConsoleError;

  beforeAll(async () => {
    ({ logger } = await import('../../../trace/v2-frontend/src/shared/lib/logger.js'));
  });

  beforeEach(() => {
    originalConsoleLog = console.log;
    originalConsoleWarn = console.warn;
    originalConsoleError = console.error;
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
    localStorage.removeItem('trace.log.level');
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
    localStorage.removeItem('trace.log.level');
  });

  test('redacts sensitive values in logged context', () => {
    logger.info('auth_event', { token: 'abc123', nested: { password: 'secret' } });
    expect(console.log).toHaveBeenCalledTimes(1);
    const payload = console.log.mock.calls[0][0];
    expect(payload.context.token).toBe('[REDACTED]');
    expect(payload.context.nested.password).toBe('[REDACTED]');
  });

  test('respects configured log level filtering', () => {
    const originalGetItem = window.localStorage.getItem;
    window.localStorage.getItem = jest.fn((key) => key === 'trace.log.level' ? 'warn' : null);
    console.log.mockClear();
    console.warn.mockClear();
    logger.info('informational');
    logger.warn('warning_event');
    expect(console.log).not.toHaveBeenCalledWith(expect.objectContaining({ event: 'informational' }));
    expect(console.warn).toHaveBeenCalledTimes(1);
    window.localStorage.getItem = originalGetItem;
  });

  test('logs errors via console.error', () => {
    logger.error('save_failed', { message: 'boom' });
    expect(console.error).toHaveBeenCalledTimes(1);
    const payload = console.error.mock.calls[0][0];
    expect(payload.level).toBe('error');
    expect(payload.event).toBe('save_failed');
  });
});
