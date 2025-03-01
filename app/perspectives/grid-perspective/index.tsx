import React from 'react';

export { default } from './components/MainContainer';

// interface PerspectiveSettings {
//   settingsKey: string;
//   orderBy: boolean;
//   sortBy: string; // 'byName',
//   layoutType: string; // 'grid', // list grid
//   singleClickAction: string; // openInternal openExternal
//   entrySize: string; // small, normal, big
//   thumbnailMode: string; // cover contain
//   showDirectories: boolean;
//   showTags: boolean;
// }

export const defaultSettings = {
  testID: 'gridPerspectiveContainer',
  settingsKey: 'tsPerspectiveGrid',
  orderBy: true,
  sortBy: 'byName',
  layoutType: 'grid', // list grid
  singleClickAction: 'openInternal', // openInternal openExternal
  entrySize: 'small', // small, normal, big
  thumbnailMode: 'contain', // cover contain
  showDirectories: true,
  showTags: true
};
