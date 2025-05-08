module.exports = {
  extends: ['next/core-web-vitals'],
  rules: {
    'no-console': 'error',
    'no-unused-vars': 'error',
    'no-undef': 'error',
    'react/prop-types': 'error',
    'react/jsx-uses-react': 'error',
    'react/jsx-uses-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-module-boundary-types': 'error',
  },
  ignorePatterns: ['!**/*'],
  settings: {
    next: {
      rootDir: '.',
    },
  },
};
