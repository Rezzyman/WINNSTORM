# WinnStorm Mobile App Deployment Guide

This guide provides step-by-step instructions for deploying WinnStorm to the Apple App Store and Google Play Store using Capacitor.

## Prerequisites

### Development Environment
- **macOS** (required for iOS builds)
- **Xcode 15+** (for iOS)
- **Android Studio** (for Android)
- **Node.js 18+**
- **CocoaPods** (for iOS dependencies)

### Accounts Required
- **Apple Developer Account** ($99/year) - https://developer.apple.com
- **Google Play Developer Account** ($25 one-time) - https://play.google.com/console

---

## Part 1: Pre-Build Setup

### 1.1 Build the Web Application

```bash
# Install dependencies
npm install

# Build the production web app
npm run build

# Sync Capacitor with the built web app
npx cap sync
```

### 1.2 Configure Production API URL

Edit `capacitor.config.ts` and uncomment/set the production URL:

```typescript
server: {
  url: 'https://your-winnstorm-domain.replit.app',
  cleartext: true,
  androidScheme: 'https'
},
```

After publishing your Replit app, replace `your-winnstorm-domain` with your actual domain.

---

## Part 2: iOS App Store Deployment

### 2.1 Open iOS Project

```bash
npx cap open ios
```

This opens the project in Xcode.

### 2.2 Configure Signing & Capabilities

1. Select the **App** target in Xcode
2. Go to **Signing & Capabilities** tab
3. Select your **Team** (Apple Developer account)
4. Set **Bundle Identifier**: `com.winnstorm.inspector`
5. Enable **Automatically manage signing**

### 2.3 Add Required Capabilities

Click **+ Capability** and add:
- **Push Notifications** (for future updates)
- **Background Modes** (Audio, Location updates already configured)
- **Associated Domains** (for deep linking)

### 2.4 Configure App Icons

Create app icons in these sizes and add to `ios/App/App/Assets.xcassets/AppIcon.appiconset/`:

| Size | Usage |
|------|-------|
| 20x20 | iPad Notifications |
| 29x29 | Settings |
| 40x40 | Spotlight |
| 60x60 | iPhone App |
| 76x76 | iPad App |
| 83.5x83.5 | iPad Pro App |
| 1024x1024 | App Store |

**Tip**: Use a tool like https://appicon.co to generate all sizes from a 1024x1024 source.

### 2.5 Create Launch Screen

The launch screen is configured in `ios/App/App/Base.lproj/LaunchScreen.storyboard`. Customize with WinnStorm branding.

### 2.6 Build for Release

1. Select **Product > Archive**
2. When complete, the **Organizer** window opens
3. Click **Distribute App**
4. Choose **App Store Connect**
5. Follow the prompts to upload

### 2.7 App Store Connect Setup

1. Go to https://appstoreconnect.apple.com
2. Create a new app with:
   - **Bundle ID**: `com.winnstorm.inspector`
   - **Name**: WinnStorm
   - **Primary Language**: English
   - **SKU**: `winnstorm-inspector-2024`

3. Fill in required information:
   - **Description**: See below
   - **Keywords**: damage assessment, roof inspection, hail damage, storm damage, property inspection, insurance claims
   - **Support URL**: Your support page
   - **Privacy Policy URL**: Your privacy policy
   
4. Upload screenshots (required sizes):
   - iPhone 6.7" (1290 x 2796)
   - iPhone 6.5" (1284 x 2778)
   - iPad 12.9" (2048 x 2732)

5. Select **Age Rating**: 4+
6. Set **Price**: Free (with in-app subscription)
7. Submit for Review

---

## Part 3: Google Play Store Deployment

### 3.1 Open Android Project

```bash
npx cap open android
```

This opens the project in Android Studio.

### 3.2 Update Version Information

Edit `android/app/build.gradle`:

```gradle
defaultConfig {
    applicationId "com.winnstorm.inspector"
    versionCode 1        // Increment for each release
    versionName "1.0.0"  // User-visible version
}
```

### 3.3 Configure App Icons

Add app icons to `android/app/src/main/res/`:

| Folder | Size |
|--------|------|
| mipmap-mdpi | 48x48 |
| mipmap-hdpi | 72x72 |
| mipmap-xhdpi | 96x96 |
| mipmap-xxhdpi | 144x144 |
| mipmap-xxxhdpi | 192x192 |

Create both `ic_launcher.png` and `ic_launcher_round.png` for each size.

### 3.4 Create Signing Key

```bash
keytool -genkey -v -keystore winnstorm-release.keystore \
  -alias winnstorm -keyalg RSA -keysize 2048 -validity 10000
```

**IMPORTANT**: Store this keystore securely. You'll need it for all future updates.

### 3.5 Configure Signing in build.gradle

Add to `android/app/build.gradle`:

```gradle
android {
    signingConfigs {
        release {
            storeFile file('winnstorm-release.keystore')
            storePassword 'YOUR_STORE_PASSWORD'
            keyAlias 'winnstorm'
            keyPassword 'YOUR_KEY_PASSWORD'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 3.6 Build Release APK/AAB

```bash
# Build Android App Bundle (preferred for Play Store)
cd android
./gradlew bundleRelease

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

### 3.7 Google Play Console Setup

1. Go to https://play.google.com/console
2. Create a new app:
   - **App name**: WinnStorm
   - **Default language**: English
   - **App or game**: App
   - **Free or paid**: Free

3. Complete Store Listing:
   - **Short description** (80 chars max)
   - **Full description** (4000 chars max)
   - **App icon**: 512x512 PNG
   - **Feature graphic**: 1024x500 PNG
   - **Screenshots**: Phone (min 2), Tablet (optional)

4. Complete Content Rating questionnaire

5. Set up **App Content**:
   - Privacy Policy URL
   - Ads declaration
   - Target audience

6. Create a **Release**:
   - Go to **Production > Create new release**
   - Upload your `.aab` file
   - Add release notes
   - Review and roll out

---

## Part 4: App Store Descriptions

### Short Description (80 chars)
```
AI-powered damage assessment for professional roof and property inspectors.
```

### Full Description
```
WinnStorm is the premier mobile platform for damage assessment consultants, featuring AI-guided inspections powered by the proven Winn Methodology.

KEY FEATURES:

STORMY AI ASSISTANT
- Hands-free voice commands for field inspections
- Real-time photo analysis and damage detection
- AI-powered thermal image interpretation
- Automated report generation with professional summaries

COMPREHENSIVE INSPECTIONS
- 8-step guided methodology ensures nothing is missed
- GPS-tagged photo documentation
- Voice memo recording for field notes
- Support for thermal imaging cameras

PROFESSIONAL REPORTS
- Generate Winn Methodology reports instantly
- Include weather verification data
- Export to PDF for client delivery
- CRM integration for seamless workflow

TEAM MANAGEMENT
- Multi-property scheduling and routing
- Workload tracking and assignment
- Bulk property import from CSV/Excel
- Real-time sync across devices

CERTIFICATION PROGRAM
- Complete training courses in-app
- Track certification progress
- Access to advanced methodology modules

Perfect for roofing contractors, public adjusters, insurance professionals, and independent damage consultants.

Download WinnStorm today and transform your damage assessment workflow.
```

### Keywords (Apple App Store)
```
damage assessment, roof inspection, hail damage, storm damage, property inspection, insurance claims, thermal imaging, Winn Methodology, roofing, public adjuster
```

---

## Part 5: Post-Launch Checklist

### Monitoring & Analytics
- [ ] Set up Firebase Analytics in the app
- [ ] Configure crash reporting (Crashlytics)
- [ ] Monitor user reviews and respond promptly

### Updates
- [ ] Plan regular update schedule
- [ ] Increment version codes for each release
- [ ] Test thoroughly before submitting updates

### Marketing
- [ ] Create promotional screenshots
- [ ] Record app preview video (iOS)
- [ ] Prepare press release for launch

---

## Troubleshooting

### iOS Build Issues

**"No provisioning profile"**
- Ensure you're signed into your Apple Developer account in Xcode
- Enable "Automatically manage signing"

**"Module not found"**
```bash
cd ios/App
pod install --repo-update
```

### Android Build Issues

**"SDK location not found"**
- Create `android/local.properties` with:
```
sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk
```

**"Keystore file not found"**
- Ensure keystore path is correct in build.gradle
- Use absolute path if relative path fails

---

## Security Notes

1. **Never commit keystores or signing credentials to git**
2. Store all signing keys in a secure password manager
3. Use environment variables for CI/CD pipelines
4. Enable Play App Signing for additional security (Google Play)

---

## Support

For deployment assistance, contact support@winnstorm.com
