jest.mock('../../../src/repositories/user.repository');
jest.mock('../../../src/utils/hash', () => ({
  hashPassword: jest.fn(async (p) => `hashed-${p}`),
  comparePassword: jest.fn(),
}));

const userRepository = require('../../../src/repositories/user.repository');
const { comparePassword } = require('../../../src/utils/hash');
const userService = require('../../../src/services/user.service');

beforeEach(() => jest.clearAllMocks());

describe('userService.updateProfile', () => {
  test('email 포함 → EMAIL_CHANGE_NOT_ALLOWED', async () => {
    await expect(userService.updateProfile('u1', { email: 'new@example.com' }))
      .rejects.toMatchObject({ code: 'EMAIL_CHANGE_NOT_ALLOWED', statusCode: 400 });
  });

  test('newPassword 짧음 → VALIDATION_ERROR', async () => {
    await expect(userService.updateProfile('u1', { currentPassword: 'old', newPassword: 'x' }))
      .rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  test('currentPassword 불일치 → INVALID_CURRENT_PASSWORD', async () => {
    userRepository.findById.mockResolvedValue({ userId: 'u1', passwordHash: 'h' });
    comparePassword.mockResolvedValue(false);
    await expect(userService.updateProfile('u1', { currentPassword: 'wrong', newPassword: 'password1' }))
      .rejects.toMatchObject({ code: 'INVALID_CURRENT_PASSWORD', statusCode: 401 });
  });

  test('이름만 변경 시 updateById에 name만 전달', async () => {
    userRepository.updateById.mockResolvedValue({ userId: 'u1', name: '새이름' });
    await userService.updateProfile('u1', { name: '새이름' });
    expect(userRepository.updateById).toHaveBeenCalledWith('u1', { name: '새이름' });
  });

  test('updateById가 null → USER_NOT_FOUND', async () => {
    userRepository.updateById.mockResolvedValue(null);
    await expect(userService.updateProfile('u1', { name: 'x' }))
      .rejects.toMatchObject({ code: 'USER_NOT_FOUND', statusCode: 404 });
  });
});

describe('userService.deleteAccount', () => {
  test('미존재 → USER_NOT_FOUND', async () => {
    userRepository.findById.mockResolvedValue(null);
    await expect(userService.deleteAccount('u1'))
      .rejects.toMatchObject({ code: 'USER_NOT_FOUND', statusCode: 404 });
    expect(userRepository.deleteById).not.toHaveBeenCalled();
  });

  test('존재 → deleteById 호출', async () => {
    userRepository.findById.mockResolvedValue({ userId: 'u1' });
    await userService.deleteAccount('u1');
    expect(userRepository.deleteById).toHaveBeenCalledWith('u1');
  });
});
