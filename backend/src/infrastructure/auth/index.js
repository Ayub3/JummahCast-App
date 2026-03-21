import { LocalAuthProvider } from './LocalAuthProvider.js';
import { CognitoAuthProvider } from './CognitoAuthProvider.js';

/**
 * Authentication Factory
 * Creates the appropriate auth provider based on environment
 */
export function createAuthProvider(config) {
  const authMode = config.AUTH_MODE || 'local';

  if (authMode === 'cognito') {
    console.log('🔐 Using AWS Cognito authentication');
    return new CognitoAuthProvider({
      userPoolId: config.COGNITO_USER_POOL_ID,
      clientId: config.COGNITO_CLIENT_ID,
      region: config.AWS_REGION,
    });
  }

  console.log('🔐 Using Local authentication (dev mode)');
  return new LocalAuthProvider(config.JWT_SECRET);
}
