jest.mock('../../../src/repositories/user.repository');
jest.mock('../../../src/utils/hash', () => ({
  hashPassword: jest.fn(async (p) => `hashed-${p}`),
  comparePassword: jest.fn(),
}));
jest.mock('../../../src/utils/jwt', () => ({
  signToken: jest.fn(() => 'fake.jwt.token'),
}));

const userRepository = require('../../../src/repositories/user.repository');
const { comparePassword } = require('../../../src/utils/hash');
const authService = require('../../../src/services/auth.service');

beforeEach(() => jest.clearAllMocks());

describe('authService.register', () => {
  test('이메일 중복 → EMAIL_ALREADY_EXISTS', async () => {
    userRepository.findByEmail.mockResolvedValue({ userId: 'u1', email: 'a@example.com' });
    await expect(authService.register({ email: 'a@example.com', password: 'pw', name: 'A' }))
      .rejects.toMatchObject({ code: 'EMAIL_ALREADY_EXISTS', statusCode: 409 });
    expect(userRepository.insertOne).not.toHaveBeenCalled();
  });

  test('정상 등록 → bcrypt 해시 저장 후 insertOne 호출', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    userRepository.insertOne.mockResolvedValue({ userId: 'u1', email: 'a@example.com', name: 'A' });
    const result = await authService.register({ email: 'a@example.com', password: 'password1', name: 'A' });
    expect(userRepository.insertOne).toHaveBeenCalledWith({
      email: 'a@example.com',
      passwordHash: 'hashed-password1',
      name: 'A',
    });
    expect(result.userId).toBe('u1');
  });
});

describe('authService.login', () => {
  test('이메일 미존재 → INVALID_CREDENTIALS', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    await expect(authService.login({ email: 'x@example.com', password: 'pw' }))
      .rejects.toMatchObject({ code: 'INVALID_CREDENTIALS', statusCode: 401 });
  });

  test('비밀번호 불일치 → INVALID_CREDENTIALS', async () => {
    userRepository.findByEmail.mockResolvedValue({ userId: 'u1', email: 'a@example.com', passwordHash: 'h' });
    comparePassword.mockResolvedValue(false);
    await expect(authService.login({ email: 'a@example.com', password: 'pw' }))
      .rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
  });

  test('정상 로그인 → accessToken + user', async () => {
    userRepository.findByEmail.mockResolvedValue({ userId: 'u1', email: 'a@example.com', name: 'A', passwordHash: 'h', createdAt: 't' });
    comparePassword.mockResolvedValue(true);
    const r = await authService.login({ email: 'a@example.com', password: 'pw' });
    expect(r.accessToken).toBe('fake.jwt.token');
    expect(r.user).toEqual({ userId: 'u1', email: 'a@example.com', name: 'A', createdAt: 't' });
  });
});
