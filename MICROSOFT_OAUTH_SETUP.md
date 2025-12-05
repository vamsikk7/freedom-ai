# Microsoft OAuth Setup Guide

This guide explains how to configure Microsoft OAuth authentication with SuperTokens.

## Prerequisites

1. Azure Active Directory (Azure AD) account
2. SuperTokens instance running (or use the hosted version)

## Step 1: Register Application in Azure Portal

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory** > **App registrations** > **New registration**
3. Fill in the application details:
   - **Name**: Freedom AI Management (or your preferred name)
   - **Supported account types**: 
     - "Accounts in any organizational directory and personal Microsoft accounts" (recommended)
     - Or "Accounts in this organizational directory only" (for single tenant)
   - **Redirect URI**: 
     - Platform: **Web**
     - URI: `http://localhost:8080/api/v1/auth/callback/microsoft` (for development)
     - For production: `https://yourdomain.com/api/v1/auth/callback/microsoft`

4. Click **Register**

## Step 2: Get Client ID and Secret

1. After registration, go to **Overview** page
2. Copy the **Application (client) ID** - this is your `MICROSOFT_OAUTH_CLIENT_ID`

3. Go to **Certificates & secrets** > **New client secret**
4. Add a description (e.g., "Freedom AI OAuth Secret")
5. Choose expiration (recommended: 24 months)
6. Click **Add**
7. **IMPORTANT**: Copy the **Value** immediately (it won't be shown again)
   - This is your `MICROSOFT_OAUTH_CLIENT_SECRET`

## Step 3: Configure API Permissions

1. Go to **API permissions**
2. Click **Add a permission** > **Microsoft Graph** > **Delegated permissions**
3. Add the following permissions:
   - `openid` (usually added automatically)
   - `email`
   - `profile`
   - `User.Read` (optional, for additional user info)
4. Click **Add permissions**
5. Click **Grant admin consent for [Your Organization]** (if you're an admin)

## Step 4: Configure Environment Variables

Add these to your `.env` file or environment:

```env
# Microsoft OAuth
MICROSOFT_OAUTH_CLIENT_ID=your-client-id-here
MICROSOFT_OAUTH_CLIENT_SECRET=your-client-secret-here
```

## Step 5: Update Redirect URIs

### Important: Redirect URI Configuration

The redirect URI in Azure Portal must point to **your backend API**, not the frontend.

### Development
- **Azure Portal Redirect URI**: `http://localhost:8080/api/v1/auth/callback/microsoft`
- **Frontend Callback Page**: `http://localhost:3000/auth/callback` (handled automatically by SuperTokens)

### Production
- **Azure Portal Redirect URI**: `https://your-api-domain.com/api/v1/auth/callback/microsoft`
- **Frontend Callback Page**: `https://your-frontend-domain.com/auth/callback` (handled automatically by SuperTokens)

**Note**: SuperTokens handles the OAuth callback and automatically redirects to the frontend callback URL you specify in the initial OAuth request.

## Step 6: Test the Integration

1. Start your server with the environment variables set
2. Go to `/auth/signin` or `/auth/signup`
3. Click the "Microsoft" button
4. You should be redirected to Microsoft login
5. After authentication, you'll be redirected back to `/auth/callback`
6. Then automatically redirected to `/dashboard`

## Troubleshooting

### "Invalid redirect URI" error
- Ensure the redirect URI in Azure Portal exactly matches what SuperTokens uses
- Check that the URI includes the correct protocol (http/https) and port
- SuperTokens uses: `{API_DOMAIN}/api/v1/auth/callback/microsoft`

### "Application not found" error
- Verify `MICROSOFT_OAUTH_CLIENT_ID` is correct
- Check that the application is registered in the correct Azure AD tenant

### "Invalid client secret" error
- Verify `MICROSOFT_OAUTH_CLIENT_SECRET` is correct
- Check if the secret has expired (create a new one if needed)
- Ensure there are no extra spaces or quotes in the environment variable

### Authentication succeeds but user not created
- Check MongoDB connection
- Verify user creation logic in the auth handler
- Check server logs for errors

## Security Notes

1. **Never commit secrets to version control**
2. Use environment variables or secret management services
3. Rotate client secrets regularly
4. Use HTTPS in production
5. Restrict redirect URIs to your actual domains only

## Additional Resources

- [Microsoft Identity Platform Documentation](https://learn.microsoft.com/en-us/azure/active-directory/develop/)
- [SuperTokens Documentation](https://supertokens.com/docs)
- [OAuth 2.0 Authorization Code Flow](https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow)

