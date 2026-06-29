/**
 * Used when `@capacitor-community/apple-sign-in` is not in node_modules
 * (e.g. npm install failed). Web dev can run; native iOS must install the real package.
 */
export const SignInWithApple = {
  authorize: async () => {
    throw new Error(
      'Sign in with Apple (native) is unavailable: install dependencies with npm install in frontend/. ' +
        'If npm fails with certificate errors, fix your network/SSL or registry settings, then reinstall.'
    );
  },
}
