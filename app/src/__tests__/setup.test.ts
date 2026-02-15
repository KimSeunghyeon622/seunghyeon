/**
 * Jest 설정 확인용 테스트
 */
describe('Jest Setup', () => {
  it('should run tests correctly', () => {
    expect(true).toBe(true);
  });

  it('should perform basic math operations', () => {
    expect(1 + 1).toBe(2);
    expect(10 - 5).toBe(5);
  });
});
