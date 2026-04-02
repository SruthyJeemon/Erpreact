# Mobile App Setup Guide

This guide will help you convert your React ERP application into a native mobile app using Capacitor.

## Prerequisites

Before creating the mobile app, ensure you have:

1. **Node.js** (v18 or higher) - Already installed ✓
2. **Android Studio** (for Android) - [Download here](https://developer.android.com/studio)
3. **Xcode** (for iOS - macOS only) - Available on Mac App Store
4. **Java JDK 11+** (for Android) - Usually included with Android Studio

## Step 1: Build the Web App

First, build your React app:

```bash
cd frontend
npm run build
```

This creates the `dist` folder that Capacitor will use.

## Step 2: Add Mobile Platforms

### For Android:

```bash
cd frontend
npx cap add android
npx cap sync
```

This will:
- Create an `android` folder in your frontend directory
- Sync your web app code to the native project

### For iOS (macOS only):

```bash
cd frontend
npx cap add ios
npx cap sync
```

This will:
- Create an `ios` folder in your frontend directory
- Sync your web app code to the native project

## Step 3: Configure the App

Edit `frontend/capacitor.config.ts` to customize:
- `appId`: Your app's unique identifier (e.g., com.yourcompany.erp)
- `appName`: The name displayed on the device
- `webDir`: The build output directory (usually "dist")

## Step 4: Run the Mobile App

### Android:

```bash
# Option 1: Open in Android Studio
cd frontend
npm run android:dev

# Option 2: Manual steps
npm run build
npx cap sync
npx cap open android
```

Then in Android Studio:
1. Wait for Gradle sync to complete
2. Select a device/emulator
3. Click the Run button (▶️)

### iOS (macOS only):

```bash
# Option 1: Open in Xcode
cd frontend
npm run ios:dev

# Option 2: Manual steps
npm run build
npx cap sync
npx cap open ios
```

Then in Xcode:
1. Select a simulator or device
2. Click the Run button (▶️)

## Step 5: Update Your API URL for Mobile

For mobile apps, you need to update the API URL. The backend should be accessible from the device/emulator.

### Development:
- **Android Emulator**: Use `http://10.0.2.2:5165` instead of `localhost:5165`
- **iOS Simulator**: Use `http://localhost:5165`
- **Physical Device**: Use your computer's IP address (e.g., `http://192.168.1.100:5165`)

### Production:
- Use your production API URL (e.g., `https://api.yourdomain.com`)

Update the API URL in your components or create an environment configuration.

## Step 6: Build for Production

### Android APK/AAB:

```bash
cd frontend
npm run build
npx cap sync
npx cap open android
```

In Android Studio:
1. Build → Generate Signed Bundle / APK
2. Follow the wizard to create a keystore
3. Select build variant (release)
4. Build the APK or AAB

### iOS App Store:

```bash
cd frontend
npm run build
npx cap sync
npx cap open ios
```

In Xcode:
1. Select your project in the navigator
2. Select the target
3. Go to "Signing & Capabilities"
4. Select your team
5. Product → Archive
6. Distribute to App Store

## Available Scripts

- `npm run build` - Build the web app
- `npm run cap:sync` - Sync web code to native projects
- `npm run cap:open` - Open native IDE (specify platform)
- `npm run android:dev` - Build, sync, and open Android Studio
- `npm run ios:dev` - Build, sync, and open Xcode (macOS only)

## Troubleshooting

### Build Errors:
- Make sure you've run `npm run build` before syncing
- Clear the build folder: `rm -rf dist` (or delete manually) and rebuild

### API Connection Issues:
- Check your backend is running
- Verify the API URL is correct for your platform
- For Android emulator, use `10.0.2.2` instead of `localhost`
- For physical devices, use your computer's IP address

### Capacitor Sync Issues:
- Delete `node_modules` and reinstall: `npm install`
- Delete platform folders and re-add them

### Android Studio Issues:
- Make sure Android SDK is installed
- Update Gradle if needed
- Clean project: Build → Clean Project

### iOS Issues:
- Make sure Xcode Command Line Tools are installed
- Run: `xcode-select --install`
- CocoaPods might need updating: `sudo gem install cocoapods`

## Project Structure

After setup, your project will have:

```
frontend/
├── android/          # Android native project
├── ios/              # iOS native project (if on macOS)
├── dist/             # Built web app
├── capacitor.config.ts
└── ...
```

## Next Steps

1. Test your app on emulators/simulators
2. Test on physical devices
3. Configure app icons and splash screens
4. Set up app signing for production
5. Submit to Google Play Store / Apple App Store

## Notes

- The mobile app uses your existing React code - no rewriting needed!
- Capacitor allows you to access native device features if needed
- Your backend API needs to be accessible from mobile devices
- Consider using HTTPS in production
- Test thoroughly on real devices before releasing
