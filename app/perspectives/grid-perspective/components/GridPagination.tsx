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

import React, { useState, useEffect, useRef, useReducer } from 'react';
import { connect } from 'react-redux';
import Typography from '@material-ui/core/Typography';
import Tooltip from '@material-ui/core/Tooltip';
import Pagination from '@material-ui/lab/Pagination';
import { bindActionCreators } from 'redux';
import i18n from '-/services/i18n';
import {
  actions as AppActions,
  getCurrentDirectoryColor,
  getPageEntries,
  getSearchResultCount,
  isLoading
} from '-/reducers/app';
import EntryIcon from '-/components/EntryIcon';
import AppConfig from '-/config';
import { TS } from '-/tagspaces.namespace';
import { getMetaForEntry } from '-/services/utils-io';
import {
  getMetaFileLocationForDir,
  getMetaFileLocationForFile,
  getThumbFileLocationForFile
} from '-/utils/paths';
import PlatformIO from '-/services/platform-facade';

interface Props {
  className: string;
  style: Object;
  theme: any;
  // gridRef: Object;
  directories: Array<TS.FileSystemEntry>;
  showDirectories: boolean;
  files: Array<TS.FileSystemEntry>;
  pageEntries: Array<TS.FileSystemEntry>;
  renderCell: (entry: TS.FileSystemEntry, isLast?: boolean) => void;
  currentDirectoryColor: string;
  isAppLoading: boolean;
  currentPage: number;
  gridPageLimit: number;
  currentLocationPath: string;
  currentDirectoryPath: string;
  searchResultCount: number;
  onContextMenu: (event: React.MouseEvent<HTMLDivElement>) => void;
  onClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  updateCurrentDirEntries: (
    dirEntries: TS.FileSystemEntry[],
    pageEntries: any
  ) => void;
}

const GridPagination = (props: Props) => {
  const {
    className,
    style,
    theme,
    directories,
    showDirectories,
    renderCell,
    isAppLoading,
    currentDirectoryColor,
    gridPageLimit,
    currentPage,
    files,
    pageEntries
  } = props;
  const allFilesCount = files.length;
  const showPagination = gridPageLimit && files.length > gridPageLimit;
  const paginationCount = showPagination
    ? Math.ceil(allFilesCount / gridPageLimit)
    : 10;

  const containerEl = useRef(null);
  // const entriesUpdated = useRef([]);
  const page = useRef<number>(currentPage);
  // const [page, setPage] = useState(currentPage);

  let pageFiles;
  if (showPagination) {
    const start = (page.current - 1) * gridPageLimit;
    pageFiles = files.slice(start, start + gridPageLimit);
  } else {
    pageFiles = files;
  }
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  useEffect(() => {
    if (PlatformIO.haveObjectStoreSupport()) {
      const dirEntriesPromises = getDirEntriesPromises();
      const fileEntriesPromises = getFileEntriesPromises();
      const thumbs = getThumbs();
      updateEntries([...dirEntriesPromises, ...thumbs, ...fileEntriesPromises]);
    }
  }, [page.current, files]);

  useEffect(() => {
    page.current = currentPage;
    /* if (page !== currentPage) {
      setPage(props.currentPage);
    } */
    if (containerEl && containerEl.current) {
      containerEl.current.scrollTop = 0;
    }
  }, [
    props.currentLocationPath,
    props.currentDirectoryPath,
    props.searchResultCount
  ]);

  const setThumbs = (entry: TS.FileSystemEntry): TS.FileSystemEntry => {
    const thumbEntry = { ...entry };
    let thumbPath = getThumbFileLocationForFile(entry.path, '/', false);
    if (thumbPath && thumbPath.startsWith('/')) {
      thumbPath = thumbPath.substring(1);
    }

    thumbPath = PlatformIO.getURLforPath(thumbPath, 604800);
    if (thumbPath) {
      thumbEntry.thumbPath = thumbPath;
    }
    return thumbEntry;
  };

  const getThumbs = (): Promise<any>[] =>
    pageFiles.map(entry => Promise.resolve({ [entry.path]: setThumbs(entry) }));

  const getDirEntriesPromises = (): Promise<any>[] =>
    directories.map(entry => {
      if (
        !checkEntryExist(entry.path) &&
        entry.path.indexOf(
          AppConfig.metaFolder + PlatformIO.getDirSeparator()
        ) === -1
      ) {
        const metaFilePath = getMetaFileLocationForDir(
          entry.path,
          PlatformIO.getDirSeparator()
        );
        return getMetaForEntry(entry, metaFilePath);
      }
      return Promise.resolve({ [entry.path]: undefined });
    });

  const getFileEntriesPromises = (): Promise<any>[] =>
    pageFiles.map(entry => {
      if (
        !checkEntryExist(entry.path) &&
        entry.path.indexOf(
          AppConfig.metaFolder + PlatformIO.getDirSeparator()
        ) === -1
      ) {
        const metaFilePath = getMetaFileLocationForFile(
          entry.path,
          PlatformIO.getDirSeparator()
        );
        // TODO check if metaFilePath exist in listMetaDirectory content
        return getMetaForEntry(entry, metaFilePath);
      }
      return Promise.resolve({ [entry.path]: undefined });
    });

  const updateEntries = metaPromises => {
    Promise.all(metaPromises)
      .then(entries => {
        updateCurrentDirEntries(entries);
        // entriesUpdated.current = entries;
        return entries;
      })
      .catch(err => {
        console.error('err updateEntries:', err);
      });
  };

  const updateCurrentDirEntries = entries => {
    const entriesEnhanced = [];
    entries.forEach(entry => {
      for (const [key, value] of Object.entries(entry)) {
        if (value) {
          // !checkEntryExist(key)) {
          entriesEnhanced.push(value);
        }
      }
    });
    if (entriesEnhanced.length > 0) {
      props.updateCurrentDirEntries(entriesEnhanced, entries);
    }
  };

  const checkEntryExist = path => {
    const index = pageEntries.findIndex(
      objUpdated => Object.keys(objUpdated).indexOf(path) > -1
    );
    return index > -1;
  };

  const handleChange = (event, value) => {
    // setPage(value);
    page.current = value;
    forceUpdate();
    if (containerEl && containerEl.current) {
      containerEl.current.scrollTop = 0;
    }
  };

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-noninteractive-element-interactions,jsx-a11y/no-static-element-interactions
    <div
      ref={containerEl}
      onContextMenu={(event: React.MouseEvent<HTMLDivElement>) =>
        props.onContextMenu(event)
      }
      onClick={(event: React.MouseEvent<HTMLDivElement>) =>
        props.onClick(event)
      }
      style={{
        height: '100%',
        // @ts-ignore
        overflowY: AppConfig.isFirefox ? 'auto' : 'overlay',
        backgroundColor: currentDirectoryColor || 'transparent'
      }}
    >
      <div
        className={className}
        style={style}
        data-tid="perspectiveGridFileTable"
      >
        {page.current === 1 && directories.map(entry => renderCell(entry))}
        {pageFiles.map((entry, index, dArray) =>
          renderCell(entry, index === dArray.length - 1)
        )}
        {!isAppLoading && pageFiles.length < 1 && directories.length < 1 && (
          <div style={{ textAlign: 'center' }}>
            <EntryIcon isFile={false} />
            <Typography
              style={{ padding: 15, color: theme.palette.text.secondary }}
            >
              {i18n.t('core:noFileFolderFound')}
            </Typography>
            <Typography style={{ color: theme.palette.text.secondary }}>
              {i18n.t('core:dragAndDropToImport')}
            </Typography>
          </div>
        )}
        {!isAppLoading &&
          pageFiles.length < 1 &&
          directories.length >= 1 &&
          !showDirectories && (
            <div style={{ textAlign: 'center' }}>
              <EntryIcon isFile={false} />
              <Typography
                style={{ padding: 15, color: theme.palette.text.secondary }}
              >
                {i18n.t('core:noFileButFoldersFound')}
              </Typography>
              <Typography style={{ color: theme.palette.text.secondary }}>
                {i18n.t('core:dragAndDropToImport')}
              </Typography>
            </div>
          )}
      </div>
      {showPagination && (
        <Tooltip
          title={
            directories.length +
            ' folder(s) and ' +
            allFilesCount +
            ' file(s) found'
          }
        >
          <Pagination
            style={{
              left: 15,
              bottom: 65,
              zIndex: 1100,
              position: 'absolute',
              backgroundColor: theme.palette.background.default,
              opacity: 0.97,
              border: '1px solid lightgray',
              borderRadius: 5,
              padding: 3
            }}
            count={paginationCount}
            page={page.current}
            onChange={handleChange}
          />
        </Tooltip>
      )}
      {!showPagination && (directories.length > 0 || pageFiles.length > 0) && (
        <div style={{ padding: 15, bottom: 10 }}>
          <Typography
            style={{
              fontSize: '0.9rem',
              color: theme.palette.text.secondary
            }}
          >
            {directories.length +
              ' folder(s) and ' +
              allFilesCount +
              ' file(s) found'}
          </Typography>
        </div>
      )}
    </div>
  );
};

function mapStateToProps(state) {
  return {
    isAppLoading: isLoading(state),
    currentDirectoryColor: getCurrentDirectoryColor(state),
    searchResultCount: getSearchResultCount(state),
    pageEntries: getPageEntries(state)
  };
}

function mapActionCreatorsToProps(dispatch) {
  return bindActionCreators(
    {
      updateCurrentDirEntries: AppActions.updateCurrentDirEntries
    },
    dispatch
  );
}

const areEqual = (prevProp: Props, nextProp: Props) =>
  JSON.stringify(nextProp.files) === JSON.stringify(prevProp.files) &&
  JSON.stringify(nextProp.directories) === JSON.stringify(prevProp.directories);

export default connect(
  mapStateToProps,
  mapActionCreatorsToProps
)(React.memo(GridPagination, areEqual));
