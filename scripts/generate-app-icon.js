/**
 * Generate app icon sizes from src/assets/images/logo.png
 * Run: node scripts/generate-app-icon.js
 */
const path = require('path');
const fs = require('fs');
const { Jimp } = require('jimp');

const LOGO_PATH = path.join(__dirname, '..', 'src', 'assets', 'images', 'logo.png');
const ANDROID_RES = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
const IOS_ICONSET = path.join(__dirname, '..', 'ios', 'kaarigari', 'Images.xcassets', 'AppIcon.appiconset');

const ANDROID_SIZES = [
  { dir: 'mipmap-mdpi', size: 48 },
  { dir: 'mipmap-hdpi', size: 72 },
  { dir: 'mipmap-xhdpi', size: 96 },
  { dir: 'mipmap-xxhdpi', size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
];

const IOS_SIZES = [40, 58, 60, 80, 87, 120, 180, 1024];

async function main() {
  if (!fs.existsSync(LOGO_PATH)) {
    console.error('Logo not found at', LOGO_PATH);
    process.exit(1);
  }

  const logo = await Jimp.read(LOGO_PATH);

  for (const { dir, size } of ANDROID_SIZES) {
    const outDir = path.join(ANDROID_RES, dir);
    const resized = logo.clone().resize({ w: size, h: size });
    await resized.write(path.join(outDir, 'ic_launcher.png'));
    await resized.write(path.join(outDir, 'ic_launcher_round.png'));
    console.log('Android', dir, size + 'x' + size);
  }

  const iosImages = [];
  for (const size of IOS_SIZES) {
    const filename = `Icon-${size}.png`;
    const resized = logo.clone().resize({ w: size, h: size });
    await resized.write(path.join(IOS_ICONSET, filename));
    console.log('iOS', filename);
    iosImages.push({ size: `${size}x${size}`, filename });
  }

  const contentsJson = {
    images: [
      { idiom: 'iphone', scale: '2x', size: '20x20', filename: 'Icon-40.png' },
      { idiom: 'iphone', scale: '3x', size: '20x20', filename: 'Icon-60.png' },
      { idiom: 'iphone', scale: '2x', size: '29x29', filename: 'Icon-58.png' },
      { idiom: 'iphone', scale: '3x', size: '29x29', filename: 'Icon-87.png' },
      { idiom: 'iphone', scale: '2x', size: '40x40', filename: 'Icon-80.png' },
      { idiom: 'iphone', scale: '3x', size: '40x40', filename: 'Icon-120.png' },
      { idiom: 'iphone', scale: '2x', size: '60x60', filename: 'Icon-120.png' },
      { idiom: 'iphone', scale: '3x', size: '60x60', filename: 'Icon-180.png' },
      { idiom: 'ios-marketing', scale: '1x', size: '1024x1024', filename: 'Icon-1024.png' },
    ],
    info: { author: 'xcode', version: 1 },
  };
  fs.writeFileSync(
    path.join(IOS_ICONSET, 'Contents.json'),
    JSON.stringify(contentsJson, null, 2)
  );
  console.log('App icon generated for Android and iOS.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
