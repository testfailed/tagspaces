/**
 * TagSpaces - universal file and folder organizer
 * Copyright (C) 2017-present TagSpaces UG (haftungsbeschraenkt)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License (version 3) as
 * published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 */

import { app, Menu } from 'electron';
import Links from '-/links';

export default function buildDesktopMenu(props: any, i18n) {
  function quitApp() {
    app.quit();
  }

  const templateDefault = [
    {
      label: i18n.t('file'),
      submenu: [
        /* {
          label: i18n.t('openNewInstance'),
          accelerator: '',
          click: () => {
            // ipcRenderer.send('new-win', 'newWin');
          }
        }, */
        /* {
          type: 'separator'
        }, */
        {
          label: i18n.t('newFileNote'),
          accelerator: 'CommandOrControl+Shift+n',
          click: props.toggleCreateFileDialog
        },
        {
          label: i18n.t('createDirectory'),
          accelerator: '',
          click: props.showCreateDirectoryDialog
        },
        {
          type: 'separator'
        },
        {
          label: i18n.t('openLink'),
          accelerator: 'CmdOrCtrl+o',
          click: props.toggleOpenLinkDialog
        },
        {
          type: 'separator'
        },
        {
          label: i18n.t('print'),
          accelerator: 'CmdOrCtrl+p',
          click: (item, focusedWindow) => {
            if (focusedWindow.webContents && focusedWindow.webContents.print) {
              focusedWindow.webContents.print();
            }
          }
        },
        {
          type: 'separator'
        },
        {
          label: i18n.t('exitApp'),
          accelerator: 'CmdOrCtrl+q',
          click: quitApp // PlatformIO.quitApp
        }
      ]
    },
    {
      label: i18n.t('edit'),
      submenu: [
        {
          label: i18n.t('undo'),
          accelerator: 'CmdOrCtrl+z',
          role: 'undo'
        },
        {
          label: i18n.t('redo'),
          accelerator: 'Shift+CmdOrCtrl+z',
          role: 'redo'
        },
        {
          type: 'separator'
        },
        {
          label: i18n.t('cut'),
          accelerator: 'CmdOrCtrl+x',
          role: 'cut'
        },
        {
          label: i18n.t('copy'),
          accelerator: 'CmdOrCtrl+c',
          role: 'copy'
        },
        {
          label: i18n.t('paste'),
          accelerator: 'CmdOrCtrl+v',
          role: 'paste'
        },
        {
          label: i18n.t('selectAll'),
          accelerator: 'CmdOrCtrl+a',
          role: 'selectall'
        }
      ]
    },
    {
      label: i18n.t('view'),
      submenu: [
        {
          label: i18n.t('showLocationManager'),
          click: props.openLocationManagerPanel
        },
        {
          label: i18n.t('showTagLibrary'),
          click: props.openTagLibraryPanel
        },
        {
          label: i18n.t('showSearch'),
          click: props.openSearch
        },
        {
          label: i18n.t('showDevTools'),
          click: (item, focusedWindow) => {
            focusedWindow.toggleDevTools();
          }
        },
        {
          label: i18n.t('reloadApplication'),
          accelerator: 'CmdOrCtrl+Shift+R',
          click: (item, focusedWindow) => {
            focusedWindow.webContents.reload();
          }
        },
        {
          type: 'separator'
        },
        {
          label: i18n.t('goback'),
          accelerator: 'Alt+Left',
          click: props.goBack
        },
        {
          label: i18n.t('goforward'),
          accelerator: 'Alt+Right',
          click: props.goForward
        },
        {
          type: 'separator'
        },
        {
          label: i18n.t('zoomReset'),
          accelerator: 'CmdOrCtrl+0',
          click: props.setZoomResetApp
        },
        {
          label: i18n.t('zoomIn'),
          accelerator: 'CmdOrCtrl+Shift+Plus',
          click: props.setZoomInApp
        },
        {
          label: i18n.t('zoomOut'),
          accelerator: 'CmdOrCtrl+-',
          click: props.setZoomOutApp
        },
        {
          label: i18n.t('toggleFullScreen'),
          accelerator: 'F11',
          click: (item, focusedWindow) => {
            // props.toggleFullScreen
            if (focusedWindow.isFullScreen()) {
              props.exitFullscreen();
              focusedWindow.setFullScreen(false);
            } else {
              focusedWindow.setFullScreen(true);
            }
          }
        },
        {
          type: 'separator'
        },
        {
          label: i18n.t('settings'),
          click: props.toggleSettingsDialog
        }
      ]
    },
    {
      label: '&' + i18n.t('help'),
      submenu: [
        {
          label: '&' + i18n.t('documentation'),
          accelerator: 'F1',
          click: props.openHelpFeedbackPanel
        },
        {
          label: '&' + i18n.t('shortcutKeys'),
          click: props.toggleKeysDialog
        },
        {
          label: 'Welcome Wizzard',
          click: props.toggleOnboardingDialog
        },
        {
          label: '&' + i18n.t('whatsNew'),
          click: () => {
            props.openURLExternally({
              url: Links.links.changelogURL,
              skipConfirm: true
            });
          }
        },
        {
          label: '&' + i18n.t('followOnTwitter'),
          click: () => {
            props.openURLExternally({
              url: Links.links.twitter
            });
          }
        },
        {
          type: 'separator'
        },
        {
          label: '&' + i18n.t('suggestNewFeatures'),
          click: () => {
            props.openURLExternally({
              url: Links.links.suggestFeature
            });
          }
        },
        {
          label: '&' + i18n.t('reportIssues'),
          click: () => {
            props.openURLExternally({
              url: Links.links.reportIssue
            });
          }
        },
        {
          type: 'separator'
        },
        {
          label: i18n.t('webClipperChrome'),
          click: () => {
            props.openURLExternally({
              url: Links.links.webClipperChrome,
              skipConfirm: true
            });
          }
        },
        {
          label: i18n.t('webClipperFirefox'),
          click: () => {
            props.openURLExternally({
              url: Links.links.webClipperFirefox,
              skipConfirm: true
            });
          }
        },
        {
          type: 'separator'
        },
        {
          label: '&' + i18n.t('license'),
          click: props.toggleLicenseDialog
        },
        {
          label: '&' + i18n.t('thirdPartyLibs'),
          click: props.toggleThirdPartyLibsDialog
        },
        {
          label: '&' + i18n.t('aboutTagSpaces'),
          click: props.toggleAboutDialog
        }
      ]
    }
  ];
  // PlatformIO.initMainMenu(templateDefault);

  // @ts-ignore
  const defaultMenu = Menu.buildFromTemplate(templateDefault); // menuConfig);
  Menu.setApplicationMenu(defaultMenu);
}
