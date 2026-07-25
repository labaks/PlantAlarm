import React from 'react';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

// PW-018: official Google test unit — swap for the real production ad unit once the
// AdMob account is confirmed/restored (see RELEASE_CHECKLIST.md).
const adUnitId = TestIds.BANNER;

export function AdBanner() {
  return <BannerAd unitId={adUnitId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />;
}
