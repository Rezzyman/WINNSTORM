# WinnStorm™ Native App Deployment Guide

## Overview
WinnStorm is now a cross-platform native application built with React + TypeScript + Capacitor, deployable to iOS App Store and Google Play Store.

## Platform Information
- **App Name**: WinnStorm
- **Bundle ID**: `com.winnstorm.inspector`
- **Platforms**: iOS (via Xcode) and Android (via Android Studio)
- **Technology**: Capacitor 7.x wrapping React web app

---

## 📱 iOS App Store Deployment

### Prerequisites
1. **Mac Computer** with macOS (required for iOS development)
2. **Xcode** 15.0 or later (download from Mac App Store)
3. **Apple Developer Account** ($99/year)
   - Sign up at: https://developer.apple.com/programs/
4. **CocoaPods** (iOS dependency manager)
   ```bash
   sudo gem install cocoapods
   ```

### Step 1: Open iOS Project
```bash
npx cap open ios
```
This opens the project in Xcode.

### Step 2: Configure Signing & Capabilities
1. In Xcode, select **WinnStorm** project in the navigator
2. Select the **App** target
3. Go to **Signing & Capabilities** tab
4. Select your **Team** (Apple Developer Account)
5. Xcode will automatically create provisioning profiles

### Step 3: Configure Camera Permissions
The app requires camera access for inspection photos. Xcode should auto-configure this, but verify:

1. Open `ios/App/App/Info.plist`
2. Ensure these keys exist:
   ```xml
   <key>NSCameraUsageDescription</key>
   <string>WinnStorm needs camera access to capture inspection photos and thermal images for damage assessment reports.</string>
   <key>NSPhotoLibraryUsageDescription</key>
   <string>WinnStorm needs photo library access to save and retrieve inspection photos.</string>
   <key>NSPhotoLibraryAddUsageDescription</key>
   <string>WinnStorm needs permission to save inspection photos to your photo library.</string>
   ```

### Step 4: Update App Icons
1. Prepare icons in required sizes (see iOS Icon Sizes below)
2. In Xcode, go to **App** > **Assets.xcassets** > **AppIcon**
3. Drag and drop icons for each size
4. Ensure all slots are filled

**iOS Icon Sizes Required:**
- 20x20 pt (2x, 3x) - Notifications
- 29x29 pt (2x, 3x) - Settings
- 40x40 pt (2x, 3x) - Spotlight
- 60x60 pt (2x, 3x) - App Icon
- 1024x1024 pt (1x) - App Store

### Step 5: Build for Testing (TestFlight)
1. Select **Any iOS Device** as the build target
2. Product → Archive
3. Once archive completes, click **Distribute App**
4. Choose **App Store Connect**
5. Upload to App Store Connect
6. Add to TestFlight for beta testing

### Step 6: Submit to App Store
1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Create new app listing
3. Fill in app metadata:
   - App Name: WinnStorm
   - Subtitle: Professional Damage Assessment
   - Description: (See marketing copy below)
   - Keywords: damage assessment, roofing inspection, thermal imaging
   - Screenshots: Capture from iOS simulator/device
   - Category: Business / Productivity
4. Upload build from TestFlight
5. Submit for review

---

## 🤖 Google Play Store Deployment

### Prerequisites
1. **Android Studio** (download from https://developer.android.com/studio)
2. **Google Play Developer Account** ($25 one-time fee)
   - Sign up at: https://play.google.com/console/signup
3. **Java Development Kit (JDK)** 17 or later

### Step 1: Open Android Project
```bash
npx cap open android
```
This opens the project in Android Studio.

### Step 2: Configure App Signing
For production releases, you need a signing key:

```bash
# Generate keystore (do this ONCE and keep it safe!)
keytool -genkey -v -keystore winnstorm-release.keystore -alias winnstorm -keyalg RSA -keysize 2048 -validity 10000

# Save keystore in a secure location
# NEVER commit this to version control!
```

Update `android/app/build.gradle`:
```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file("path/to/winnstorm-release.keystore")
            storePassword "YOUR_STORE_PASSWORD"
            keyAlias "winnstorm"
            keyPassword "YOUR_KEY_PASSWORD"
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Step 3: Configure Camera Permissions
Camera permissions are already configured in `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-feature android:name="android.hardware.camera" android:required="true" />
```

### Step 4: Update App Icons and Splash Screen
1. Prepare icons in required densities (see Android Icon Sizes below)
2. In Android Studio, right-click **res** → New → Image Asset
3. Configure Asset Type: **Launcher Icons (Adaptive and Legacy)**
4. Upload high-res icon (512x512 recommended)
5. Generate icons for all densities

**Android Icon Densities:**
- mdpi: 48x48
- hdpi: 72x72
- xhdpi: 96x96
- xxhdpi: 144x144
- xxxhdpi: 192x192

### Step 5: Build Release APK/AAB
```bash
cd android
./gradlew bundleRelease
```

The signed AAB will be at:
`android/app/build/outputs/bundle/release/app-release.aab`

### Step 6: Upload to Google Play Console
1. Go to [Google Play Console](https://play.google.com/console/)
2. Create a new application
3. Fill in app details:
   - App Name: WinnStorm
   - Short Description: Professional damage assessment platform for inspectors
   - Full Description: (See marketing copy below)
   - Category: Business
   - Screenshots: Capture from Android emulator/device
4. Upload the AAB file
5. Create a release:
   - Choose **Production** or **Internal Testing** track
   - Upload APK/AAB
   - Fill release notes
6. Submit for review

---

## 📸 Screenshots Requirements

### iOS (Required Sizes)
- 6.7" Display: 1290x2796 (iPhone 15 Pro Max)
- 6.5" Display: 1284x2778 (iPhone 14 Pro Max)
- 5.5" Display: 1242x2208 (iPhone 8 Plus) - Optional

### Android (Required)
- Phone: 320-3840 px wide (landscape or portrait)
- 7" Tablet: 1024x600 or higher
- 10" Tablet: 1920x1200 or higher

**Recommended Screenshot Scenes:**
1. Dashboard with inspection overview
2. Winn Report workflow in progress
3. Thermal analysis with AI results
4. Mobile-optimized navigation
5. Camera capture interface
6. Stormy AI assistant interaction

---

## 🔑 Environment Variables for Production

Before deploying, ensure these environment variables are configured:

```bash
# Firebase Configuration (for authentication)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# OpenAI (for Stormy AI Assistant)
OPENAI_API_KEY=your_openai_api_key

# Google Maps (for property mapping)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

---

## 🚀 Build and Sync Workflow

### Standard Development Cycle
```bash
# 1. Make code changes in client/src/

# 2. Build web app
npm run build

# 3. Sync to native platforms
npx cap sync

# 4. Open in IDE for native development
npx cap open ios    # or
npx cap open android

# 5. Run from Xcode or Android Studio
```

### Quick Sync (After Code Changes)
```bash
npm run build && npx cap sync
```

---

## 📱 Testing on Physical Devices

### iOS Device Testing
1. Connect iPhone/iPad via USB
2. In Xcode, select your device from the dropdown
3. Click the "Play" button to build and run
4. Trust the developer certificate on device if prompted

### Android Device Testing
1. Enable Developer Options on Android device
2. Enable USB Debugging
3. Connect device via USB
4. In Android Studio, select your device
5. Click the "Run" button

---

## 🔒 Security Considerations

1. **API Keys**: Never commit API keys to version control
2. **Keystore**: Store Android keystore in a secure, encrypted location
3. **Environment Variables**: Use Replit Secrets or environment-specific configs
4. **HTTPS Only**: All API endpoints must use HTTPS in production
5. **Code Signing**: Both platforms require proper code signing certificates

---

## 📋 App Store Listing Copy

### Short Description (80 chars max)
Professional damage assessment platform powered by AI and thermal imaging.

### Full Description
WinnStorm™ is the premier mobile platform for damage assessment consultants, bringing Eric Winn's proven methodology to iOS and Android devices. Conduct comprehensive roof inspections with confidence using AI-powered guidance, thermal imaging analysis, and field-optimized workflows.

**Key Features:**
✓ AI-Powered Inspection Coach - Stormy adapts guidance to your experience level
✓ Native Camera Integration - Capture thermal images and damage photos instantly
✓ Comprehensive Winn Methodology - Step-by-step workflows for professional reports
✓ Mobile-First Design - Optimized for outdoor use with large touch targets
✓ Offline Capability - Work on rooftops without internet connectivity
✓ Thermal Analysis - AI-powered temperature anomaly detection
✓ Educational Tooltips - Learn the "why" behind each inspection step
✓ Weather Verification - Correlate damage with meteorological data

**Perfect For:**
- Roofing Inspectors
- Insurance Adjusters  
- Damage Assessment Consultants
- Property Restoration Professionals

Transform your inspection workflow with the most advanced damage assessment platform available.

---

## 🆘 Troubleshooting

### iOS Build Errors
- **"No provisioning profiles found"**: Select your Team in Xcode signing settings
- **"Pod install failed"**: Run `cd ios/App && pod install`
- **"Module not found"**: Clean build folder: Product → Clean Build Folder

### Android Build Errors
- **"SDK not found"**: Set ANDROID_HOME in environment variables
- **"Gradle sync failed"**: File → Invalidate Caches → Restart
- **"Keystore not found"**: Verify keystore path in build.gradle

### Capacitor Sync Issues
```bash
# Clear and rebuild
rm -rf dist
rm -rf ios/App/App/public
rm -rf android/app/src/main/assets/public
npm run build
npx cap sync
```

---

## 📚 Additional Resources

- **Capacitor Docs**: https://capacitorjs.com/docs
- **iOS App Distribution**: https://developer.apple.com/distribute/
- **Google Play Console Help**: https://support.google.com/googleplay/android-developer
- **App Store Review Guidelines**: https://developer.apple.com/app-store/review/guidelines/
- **Google Play Policy**: https://play.google.com/about/developer-content-policy/

---

## ✅ Pre-Launch Checklist

### iOS
- [ ] All app icons uploaded (all sizes)
- [ ] Privacy policy URL provided
- [ ] Support URL provided
- [ ] Screenshots for all required device sizes
- [ ] App Store description and keywords
- [ ] Test on physical iOS devices
- [ ] TestFlight beta testing completed
- [ ] All camera permissions configured

### Android
- [ ] App icons for all densities
- [ ] Privacy policy URL provided
- [ ] Screenshots for phone and tablet
- [ ] Google Play description complete
- [ ] Test on physical Android devices
- [ ] Content rating questionnaire completed
- [ ] All permissions justified and configured
- [ ] Release signed with production keystore

---

**Ready to Deploy!** 🚀

Follow this guide step-by-step and WinnStorm will be live on both app stores. For support, refer to the troubleshooting section or official platform documentation.
