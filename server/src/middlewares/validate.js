const AppError = require('../utils/AppError');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const rules = {
  email(value) {
    if (typeof value !== 'string' || !EMAIL_REGEX.test(value)) return '이메일 형식이 올바르지 않습니다';
    return null;
  },
  password(value) {
    if (typeof value !== 'string' || value.length < 8) return '비밀번호는 8자 이상이어야 합니다';
    return null;
  },
  title(value) {
    if (typeof value !== 'string') return '제목은 문자열이어야 합니다';
    const len = value.length;
    if (len < 1 || len > 200) return '제목은 1자 이상 200자 이하여야 합니다';
    return null;
  },
  colorCode(value) {
    if (typeof value !== 'string' || !COLOR_REGEX.test(value)) return '색상 코드는 #RRGGBB 형식이어야 합니다';
    return null;
  },
  uuid(value) {
    if (typeof value !== 'string' || !UUID_REGEX.test(value)) return 'UUID 형식이 올바르지 않습니다';
    return null;
  },
  date(value) {
    if (typeof value !== 'string' || !DATE_REGEX.test(value)) return '날짜는 YYYY-MM-DD 형식이어야 합니다';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '유효하지 않은 날짜입니다';
    return null;
  },
  boolean(value) {
    if (value === true || value === false) return null;
    if (typeof value === 'string' && (value === 'true' || value === 'false')) return null;
    return 'true 또는 false여야 합니다';
  },
};

function validateSection(source, section, errors, prefix) {
  if (!section) return;
  for (const [field, spec] of Object.entries(section)) {
    const ruleName = typeof spec === 'string' ? spec : spec.rule;
    const optional = typeof spec === 'object' && spec.optional === true;
    const value = source ? source[field] : undefined;

    if (value === undefined || value === null || value === '') {
      if (!optional) errors.push(`${prefix}.${field}: 필수 입력값입니다`);
      continue;
    }

    const rule = rules[ruleName];
    if (!rule) {
      errors.push(`${prefix}.${field}: 알 수 없는 검증 규칙 '${ruleName}'`);
      continue;
    }
    const error = rule(value);
    if (error) errors.push(`${prefix}.${field}: ${error}`);
  }
}

module.exports = function validate(schema) {
  return function validateMiddleware(req, res, next) {
    const errors = [];
    validateSection(req.body, schema.body, errors, 'body');
    validateSection(req.params, schema.params, errors, 'params');
    validateSection(req.query, schema.query, errors, 'query');

    if (errors.length > 0) {
      return next(new AppError('VALIDATION_ERROR', 400, errors.join('; ')));
    }
    return next();
  };
};

module.exports.rules = rules;
