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
/* global TagSpaces */
/* eslint no-undef: "error" */
import React, { useEffect, useRef, useState } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import format from 'date-fns/format';
import Typography from '@material-ui/core/Typography';
import MenuItem from '@material-ui/core/MenuItem';
import Tooltip from '@material-ui/core/Tooltip';
import PictureIcon from '@material-ui/icons/Panorama';
import DocumentIcon from '@material-ui/icons/PictureAsPdf';
import NoteIcon from '@material-ui/icons/Note';
import AudioIcon from '@material-ui/icons/MusicVideo';
import VideoIcon from '@material-ui/icons/OndemandVideo';
import ArchiveIcon from '@material-ui/icons/Archive';
import FolderIcon from '@material-ui/icons/FolderOpen';
import UntaggedIcon from '@material-ui/icons/LabelOffOutlined';
import FileIcon from '@material-ui/icons/InsertDriveFileOutlined';
import ClearSearchIcon from '@material-ui/icons/Clear';
import BookmarkIcon from '@material-ui/icons/BookmarkBorder';
import BookIcon from '@material-ui/icons/LocalLibraryOutlined';
// import PlaceIcon from '@material-ui/icons/Place';
import DateIcon from '@material-ui/icons/DateRange';
import Button from '@material-ui/core/Button';
import Input from '@material-ui/core/Input';
import OutlinedInput from '@material-ui/core/OutlinedInput';
import TextField from '@material-ui/core/TextField';
import InputLabel from '@material-ui/core/InputLabel';
import InputAdornment from '@material-ui/core/InputAdornment';
import IconButton from '@material-ui/core/IconButton';
import Select from '@material-ui/core/Select';
import FormControl from '@material-ui/core/FormControl';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import OpenLocationCode from 'open-location-code-typescript';
// import { FormControlLabel, Switch } from '@material-ui/core';
import TagsSelect from './TagsSelect';
import CustomLogo from './CustomLogo';
import { actions as AppActions, getDirectoryPath } from '../reducers/app';
import {
  actions as LocationIndexActions,
  getIndexedEntriesCount,
  isIndexing,
  getSearchQuery
} from '../reducers/location-index';
import { getMaxSearchResults } from '-/reducers/settings';
import styles from './SidePanels.css';
import i18n from '../services/i18n';
import { FileTypeGroups } from '-/services/search';
import { Pro } from '../pro';
import SearchMenu from './menus/SearchMenu';
import { formatDateTime, extractTimePeriod } from '-/utils/dates';
import { isPlusCode, parseLatLon } from '-/utils/misc';
import PlatformIO from '../services/platform-io';
import { AppConfig } from '-/config';
import { actions as SearchActions, getSearches } from '-/reducers/searches';

const SaveSearchDialog = Pro && Pro.UI ? Pro.UI.SaveSearchDialog : false;

interface Props {
  classes: any;
  style?: any;
  theme?: any;
  searchLocationIndex: (searchQuery: TagSpaces.SearchQuery) => void;
  createLocationsIndexes: () => void;
  searchAllLocations: (searchQuery: TagSpaces.SearchQuery) => void;
  loadDirectoryContent: (path: string) => void;
  openURLExternally: (url: string) => void;
  hideDrawer?: () => void;
  searchQuery: TagSpaces.SearchQuery; // () => any;
  setSearchResults: (entries: Array<any>) => void;
  setSearchQuery: (searchQuery: TagSpaces.SearchQuery) => void;
  currentDirectory: string;
  indexedEntriesCount: number;
  maxSearchResults: number;
  indexing: boolean;
  searches: Array<TagSpaces.SearchQuery>;
  addSearches: (searches: Array<TagSpaces.SearchQuery>) => void;
}

const Search = React.memo((props: Props) => {
  const [textQuery, setTextQuery] = useState<string>(
    props.searchQuery.textQuery
  );
  // const [tagsAND, setTagsAND] = useState<Array<Tag>>(props.searchQuery.tagsAND);
  // const [tagsOR, setTagsOR] = useState<Array<Tag>>(props.searchQuery.tagsAND);
  // const [tagsNOT, setTagsNOT] = useState<Array<Tag>>(props.searchQuery.tagsAND);
  const [fileTypes, setFileTypes] = useState<Array<string>>(
    props.searchQuery.fileTypes
      ? props.searchQuery.fileTypes
      : FileTypeGroups.any
  );
  const [searchBoxing, setSearchBoxing] = useState<
    'location' | 'folder' | 'global'
  >(
    props.searchQuery.searchBoxing ? props.searchQuery.searchBoxing : 'location'
  );
  const [searchType, setSearchType] = useState<
    'fussy' | 'semistrict' | 'strict'
  >(props.searchQuery.searchType ? props.searchQuery.searchType : 'fussy');
  const [lastModified, setLastModified] = useState<string>(
    props.searchQuery.lastModified ? props.searchQuery.lastModified : ''
  );
  const [saveSearchDialogOpened, setSaveSearchDialogOpened] = useState<
    TagSpaces.SearchQuery
  >(undefined);
  const [tagTimePeriod, setTagTimePeriod] = useState<string>('');
  const [tagTimePeriodHelper, setTagTimePeriodHelper] = useState<string>(' ');
  const [tagPlace, setTagPlace] = useState<string>(' ');
  const [tagPlaceHelper, setTagPlaceHelper] = useState<string>(' ');
  const [tagTimePeriodFrom, setTagTimePeriodFrom] = useState<number | null>(
    props.searchQuery.tagTimePeriodFrom
      ? props.searchQuery.tagTimePeriodFrom
      : null
  );
  const [tagTimePeriodTo, setTagTimePeriodTo] = useState<number | null>(
    props.searchQuery.tagTimePeriodTo ? props.searchQuery.tagTimePeriodTo : null
  );
  const [tagPlaceLat, setTagPlaceLat] = useState<number | null>(null);
  const [tagPlaceLong, setTagPlaceLong] = useState<number | null>(null);
  // const [tagPlaceRadius, setTagPlaceRadius] = useState<number>(0);
  const [forceIndexing, setForceIndexing] = useState<boolean>(
    props.searchQuery.forceIndexing ? props.searchQuery.forceIndexing : false
  );
  const [fileSize, setFileSize] = useState<string>(
    props.searchQuery.fileSize ? props.searchQuery.fileSize : ''
  );
  const [
    searchMenuAnchorEl,
    setSearchMenuAnchorEl
  ] = useState<null | HTMLElement>(null);

  const [
    isExportSearchesDialogOpened,
    setExportSearchesDialogOpened
  ] = useState<boolean>(false);

  const ExportSearchesDialog =
    Pro && Pro.UI ? Pro.UI.ExportSearchesDialog : false;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importFile, setImportFile] = useState<File>(undefined);

  const ImportSearchesDialog =
    Pro && Pro.UI ? Pro.UI.ImportSearchesDialog : false;

  const mainSearchField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // https://github.com/mui-org/material-ui/issues/1594
    const timeout = setTimeout(() => {
      if (mainSearchField && mainSearchField.current) {
        mainSearchField.current.focus();
      }
    }, 100);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  function handleFileInputChange(selection: any) {
    const target = selection.currentTarget;
    const file = target.files[0];
    setImportFile(file);
    target.value = null;
  }

  const handleFileTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { target } = event;
    const { value, name } = target;

    if (name === 'fileTypes') {
      const types = JSON.parse(value);
      setFileTypes(types);
      if (searchBoxing !== 'global') {
        props.searchLocationIndex({
          ...props.searchQuery,
          fileTypes: types
        });
      }
    }
  };

  const handleFileSizeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { target } = event;
    const { value, name } = target;

    if (name === 'fileSize') {
      setFileSize(value);
      if (searchBoxing !== 'global') {
        props.searchLocationIndex({
          ...props.searchQuery,
          fileSize: value
        });
      }
    }
  };

  const handleLastModifiedChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { target } = event;
    const { value, name } = target;

    if (name === 'lastModified') {
      setLastModified(value);
      if (searchBoxing !== 'global') {
        props.searchLocationIndex({
          ...props.searchQuery,
          lastModified: value
        });
      }
    }
  };

  const handleSavedSearchChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { target } = event;
    const { value } = target;

    const savedSearch = props.searches.find(search => search.uuid === value);
    setTextQuery(savedSearch.textQuery);
    if (savedSearch.fileTypes && savedSearch.fileTypes !== fileTypes) {
      setFileTypes(savedSearch.fileTypes);
    }
    if (savedSearch.fileSize && savedSearch.fileSize !== fileSize) {
      setFileSize(savedSearch.fileSize);
    }
    if (savedSearch.lastModified && savedSearch.lastModified !== lastModified) {
      setLastModified(savedSearch.lastModified);
    }
    if (savedSearch.searchType && savedSearch.searchType !== searchType) {
      setSearchType(savedSearch.searchType);
    }
    if (savedSearch.searchBoxing && savedSearch.searchBoxing !== searchBoxing) {
      setSearchBoxing(savedSearch.searchBoxing);
    }
    if (
      savedSearch.forceIndexing &&
      savedSearch.forceIndexing !== forceIndexing
    ) {
      setForceIndexing(savedSearch.forceIndexing);
    }
    let ttPeriod;
    if (
      savedSearch.tagTimePeriodFrom &&
      savedSearch.tagTimePeriodFrom !== tagTimePeriodFrom
    ) {
      setTagTimePeriodFrom(savedSearch.tagTimePeriodFrom);
      ttPeriod = format(new Date(savedSearch.tagTimePeriodFrom), 'yyyyMMdd');
    }
    if (
      savedSearch.tagTimePeriodTo &&
      savedSearch.tagTimePeriodTo !== tagTimePeriodTo
    ) {
      setTagTimePeriodTo(savedSearch.tagTimePeriodTo);
      ttPeriod +=
        '-' + format(new Date(savedSearch.tagTimePeriodTo), 'yyyyMMdd');
    }

    if (ttPeriod) {
      setTagTimePeriod(ttPeriod);
    }

    if (savedSearch.searchBoxing === 'global') {
      props.searchAllLocations(savedSearch);
    } else {
      props.searchLocationIndex(savedSearch);
    }
  };

  function removeTags(tagsArray, removeTagsArray) {
    // eslint-disable-next-line react/no-access-state-in-setstate
    return tagsArray.filter(tag =>
      removeTagsArray.some(valueTag => valueTag.title !== tag.title)
    );
  }

  const handleTagFieldChange = (name, value, reason) => {
    let searchQuery;
    if (reason === 'remove-value') {
      if (name === 'tagsAND') {
        searchQuery = {
          ...props.searchQuery,
          tagsAND: removeTags(props.searchQuery.tagsAND, value)
        };
      } else if (name === 'tagsNOT') {
        searchQuery = {
          ...props.searchQuery,
          tagsNOT: removeTags(props.searchQuery.tagsNOT, value)
        };
      } else if (name === 'tagsOR') {
        searchQuery = {
          ...props.searchQuery,
          tagsOR: removeTags(props.searchQuery.tagsOR, value)
        };
      }
      if (!haveSearchFilters(searchQuery)) {
        clearSearch();
      }
    } else {
      // eslint-disable-next-line no-lonely-if
      if (name === 'tagsAND') {
        searchQuery = { ...props.searchQuery, tagsAND: value };
      } else if (name === 'tagsNOT') {
        searchQuery = { ...props.searchQuery, tagsNOT: value };
      } else if (name === 'tagsOR') {
        searchQuery = { ...props.searchQuery, tagsOR: value };
      }
    }
    props.searchLocationIndex(searchQuery);
    // if (searchBoxing !== 'global') { // TODO disable automatic search in global mode
    //
    // }
  };

  function haveSearchFilters(searchQuery) {
    return (
      searchQuery.textQuery ||
      (searchQuery.tagsAND !== undefined && searchQuery.tagsAND.length > 0) ||
      (searchQuery.tagsNOT !== undefined && searchQuery.tagsNOT.length > 0) ||
      (searchQuery.tagsOR !== undefined && searchQuery.tagsOR.length > 0) ||
      (searchQuery.fileTypes !== undefined &&
        searchQuery.fileTypes !== FileTypeGroups.any) ||
      searchQuery.lastModified ||
      searchQuery.tagTimePeriodFrom ||
      searchQuery.tagTimePeriodTo ||
      searchQuery.tagPlaceLat ||
      searchQuery.tagPlaceLong ||
      searchQuery.fileSize
    );
  }

  const handleTimePeriodChange = event => {
    const { target } = event;
    const { value } = target;
    const { fromDateTime, toDateTime } = extractTimePeriod(value);

    if (toDateTime && fromDateTime) {
      const tagTPeriodHelper =
        'From: ' +
        formatDateTime(fromDateTime) +
        ' To: ' +
        formatDateTime(toDateTime);
      setTagTimePeriodFrom(fromDateTime.getTime());
      setTagTimePeriodTo(toDateTime.getTime());
      setTagTimePeriodHelper(tagTPeriodHelper);
    } else {
      setTagTimePeriodHelper('');
    }

    setTagTimePeriod(value);
  };

  const handlePlaceChange = event => {
    const { target } = event;
    const { value } = target;
    let lat = null;
    let lon = null;
    let tagPHelper;

    if (isPlusCode(value)) {
      const coord = OpenLocationCode.decode(value);
      lat = Number(coord.latitudeCenter.toFixed(7));
      lon = Number(coord.longitudeCenter.toFixed(7));
    } else {
      const latLon = parseLatLon(value);
      if (latLon) {
        ({ lat, lon } = latLon);
      }
    }

    if (lat && lon) {
      tagPHelper = 'Place at lat: ' + lat + ' long: ' + lon;
    } else {
      tagPHelper = '';
    }
    setTagPlace(value);
    setTagPlaceLat(lat);
    setTagPlaceLong(lon);
    setTagPlaceHelper(tagPHelper);
  };

  const clickSearchButton = () => {
    executeSearch();
    if (props.hideDrawer) {
      props.hideDrawer();
    }
  };

  const openPlace = () => {
    if (tagPlaceLat && tagPlaceLong) {
      PlatformIO.openUrl(
        'https://www.openstreetmap.org/#map=16/' +
          tagPlaceLat +
          '/' +
          tagPlaceLong
      );
    }
  };

  const startSearch = event => {
    if (event.key === 'Enter' || event.keyCode === 13) {
      if (props.hideDrawer) {
        props.hideDrawer();
      }
      executeSearch();
    }
  };

  function openCurrentDirectory() {
    if (props.currentDirectory) {
      props.loadDirectoryContent(props.currentDirectory);
    } else {
      props.setSearchResults([]);
    }
  }

  const clearSearch = () => {
    props.setSearchQuery({});
    openCurrentDirectory();
    setTextQuery(''); // textQuery.current = '';
    setSearchBoxing('location');
    setSearchType('fussy');
    setFileTypes(FileTypeGroups.any);
    setLastModified('');
    setTagTimePeriod('');
    setTagTimePeriodHelper(' ');
    setTagPlace(' ');
    setTagPlaceHelper(' ');
    setTagTimePeriodFrom(null);
    setTagTimePeriodTo(null);
    setTagPlaceLat(null);
    setTagPlaceLong(null);
    // setTagPlaceRadius(0);
    setForceIndexing(false);
    setFileSize('');
  };

  const saveSearch = (isNew: boolean = true) => {
    setSaveSearchDialogOpened({
      uuid: isNew ? undefined : props.searchQuery.uuid,
      title: props.searchQuery.title,
      textQuery, // .current,
      tagsAND: props.searchQuery.tagsAND,
      tagsOR: props.searchQuery.tagsOR,
      tagsNOT: props.searchQuery.tagsNOT,
      // @ts-ignore
      searchBoxing,
      searchType,
      fileTypes,
      lastModified,
      fileSize,
      tagTimePeriodFrom: tagTimePeriodFrom || null,
      tagTimePeriodTo: tagTimePeriodTo || null,
      tagPlaceLat,
      tagPlaceLong,
      // tagPlaceRadius,
      maxSearchResults: props.maxSearchResults,
      currentDirectory: props.currentDirectory,
      forceIndexing
    });
  };

  const switchSearchBoxing = (
    event: React.MouseEvent<HTMLElement>,
    boxing: 'location' | 'folder' | 'global'
  ) => {
    if (boxing !== null) {
      setSearchBoxing(boxing);
    }
  };

  const switchSearchType = (
    event: React.MouseEvent<HTMLElement>,
    type: 'fussy' | 'semistrict' | 'strict'
  ) => {
    if (type !== null) {
      setSearchType(type);
    }
  };

  const executeSearch = () => {
    const { searchAllLocations, searchLocationIndex } = props;
    const searchQuery: TagSpaces.SearchQuery = {
      textQuery, // .current,
      tagsAND: props.searchQuery.tagsAND,
      tagsOR: props.searchQuery.tagsOR,
      tagsNOT: props.searchQuery.tagsNOT,
      // @ts-ignore
      searchBoxing,
      searchType,
      fileTypes,
      lastModified,
      fileSize,
      tagTimePeriodFrom: tagTimePeriodFrom || null,
      tagTimePeriodTo: tagTimePeriodTo || null,
      tagPlaceLat,
      tagPlaceLong,
      // tagPlaceRadius,
      maxSearchResults: props.maxSearchResults,
      currentDirectory: props.currentDirectory,
      forceIndexing
    };
    console.log('Search object: ' + JSON.stringify(searchQuery));
    if (searchBoxing === 'global') {
      searchAllLocations(searchQuery);
    } else {
      searchLocationIndex(searchQuery);
    }
  };

  const handleSearchMenu = (event: any) => {
    setSearchMenuAnchorEl(event.currentTarget);
  };

  const handleCloseSearchMenu = () => {
    setSearchMenuAnchorEl(null);
  };

  const { classes, indexing, indexedEntriesCount } = props;

  const indexStatus = indexedEntriesCount
    ? indexedEntriesCount + ' indexed entries'
    : '';
  return (
    <div className={classes.panel} style={props.style}>
      <CustomLogo />
      <div className={classes.toolbar}>
        <Typography
          className={classNames(classes.panelTitle, classes.header)}
          style={{ flex: 0 }}
        >
          {i18n.t('searchTitle')}
        </Typography>
        <Typography
          variant="caption"
          className={classes.header}
          style={{ alignSelf: 'center', paddingLeft: 5, display: 'block' }}
        >
          {indexStatus}
        </Typography>
        <IconButton
          style={{ marginLeft: 'auto' }}
          data-tid="searchMenu"
          onClick={handleSearchMenu}
        >
          <MoreVertIcon />
        </IconButton>
      </div>
      <SearchMenu
        anchorEl={searchMenuAnchorEl}
        open={Boolean(searchMenuAnchorEl)}
        onClose={handleCloseSearchMenu}
        createLocationsIndexes={props.createLocationsIndexes}
        openURLExternally={props.openURLExternally}
        exportSearches={() => {
          setExportSearchesDialogOpened(true);
        }}
        importSearches={() => {
          fileInputRef.current.click();
        }}
      />
      <div className={classes.searchArea}>
        <FormControl
          className={classes.formControl}
          style={{ marginTop: 10, width: '98%' }}
          disabled={indexing}
        >
          <OutlinedInput
            id="textQuery"
            name="textQuery"
            value={textQuery}
            onChange={event => {
              setTextQuery(event.target.value);
            }}
            inputRef={mainSearchField}
            margin="dense"
            autoFocus
            onKeyDown={startSearch}
            title={i18n.t('core:searchWordsWithInterval')}
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  id="clearSearchID"
                  onClick={clearSearch}
                  size="small"
                  edge="end"
                >
                  <ClearSearchIcon />
                </IconButton>
              </InputAdornment>
            }
          />
        </FormControl>
        <FormControl className={classes.formControl} disabled={indexing}>
          <ToggleButtonGroup
            onChange={switchSearchBoxing}
            size="small"
            exclusive
            style={{ marginBottom: 10, alignSelf: 'center' }}
            value={searchBoxing}
          >
            <ToggleButton value="location">
              <Tooltip arrow title={i18n.t('searchPlaceholder')}>
                <div>{i18n.t('location')}</div>
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="folder">
              <Tooltip
                arrow
                title={i18n.t('searchCurrentFolderWithSubFolders')}
              >
                <div>{i18n.t('folder')}</div>
              </Tooltip>
            </ToggleButton>
            <ToggleButton disabled={!Pro} value="global">
              <Tooltip
                arrow
                title="Search globally in all locations. Feature is in BETA status."
              >
                <div>{i18n.t('globalSearch')}</div>
              </Tooltip>
              <sub>{Pro ? ' BETA' : ' PRO'}</sub>
            </ToggleButton>
          </ToggleButtonGroup>
        </FormControl>
        <FormControl className={classes.formControl} disabled={indexing}>
          <ToggleButtonGroup
            onChange={switchSearchType}
            size="small"
            exclusive
            style={{ marginBottom: 10, alignSelf: 'center' }}
            value={searchType}
          >
            <ToggleButton value="fussy" data-tid="fussySearchTID">
              <Tooltip
                arrow
                title={i18n.t(
                  'Delivering broader search results, tolerating typos'
                )}
              >
                <div>{i18n.t('fussy')}</div>
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="semistrict" data-tid="semiStrictSearchTID">
              <Tooltip
                arrow
                title={i18n.t(
                  'Exact search in file path, description and text content (by enabled full-text search)'
                )}
              >
                <div>{i18n.t('semistrict')}</div>
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="strict" data-tid="strictSearchTID">
              <Tooltip arrow title="Same as semistrict but case sensitive">
                <div>{i18n.t('strict')}</div>
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        </FormControl>
        <FormControl className={classes.formControl} disabled={indexing}>
          <ToggleButtonGroup
            onChange={() => setForceIndexing(!forceIndexing)}
            size="small"
            exclusive
            style={{ marginBottom: 10, alignSelf: 'center' }}
            value={forceIndexing}
          >
            <ToggleButton value={false}>
              <Tooltip
                arrow
                title={i18n.t(
                  'Will the use the already create index, if it is not expired'
                )}
              >
                <div>{i18n.t('default index')}</div>
              </Tooltip>
            </ToggleButton>
            <ToggleButton value={true} data-tid="forceIndexingTID">
              <Tooltip
                arrow
                title={i18n.t('Will force the recreation of the index')}
              >
                <div>{i18n.t('force re-indexing')}</div>
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        </FormControl>
        {/* <FormControlLabel
          title={i18n.t('core:enableIndexingBySearch')}
          control={
            <Switch
              data-tid="forceIndexingTID"
              checked={forceIndexing}
              onChange={() => setForceIndexing(!forceIndexing)}
              name="forceIndexing"
            />
          }
          label={
            <Typography
              style={{ padding: 15, color: props.theme.palette.text.primary }}
            >
              {i18n.t('forceReindexing')}
            </Typography>
          }
        /> */}
        <br />
        <FormControl className={classes.formControl}>
          <ButtonGroup style={{ justifyContent: 'center' }}>
            <Button
              disabled={indexing}
              id="searchButton"
              // variant="outlined"
              color="primary"
              onClick={clickSearchButton}
              style={{ width: '98%' }}
              size="medium"
            >
              {indexing
                ? 'Search disabled while indexing'
                : i18n.t('searchTitle')}
            </Button>
          </ButtonGroup>
        </FormControl>
        <FormControl className={classes.formControl} disabled={indexing}>
          <TagsSelect
            placeholderText={i18n.t('core:selectTags')}
            label={i18n.t('core:mustContainTheseTags')}
            tags={props.searchQuery.tagsAND}
            handleChange={handleTagFieldChange}
            tagSearchType="tagsAND"
            tagMode="remove"
          />
        </FormControl>
        <FormControl className={classes.formControl} disabled={indexing}>
          <TagsSelect
            placeholderText={i18n.t('core:selectTags')}
            tags={props.searchQuery.tagsOR}
            label={i18n.t('core:atLeastOneOfTheseTags')}
            handleChange={handleTagFieldChange}
            tagSearchType="tagsOR"
            tagMode="remove"
          />
        </FormControl>
        <FormControl className={classes.formControl} disabled={indexing}>
          <TagsSelect
            placeholderText={i18n.t('core:selectTags')}
            tags={props.searchQuery.tagsNOT}
            label={i18n.t('core:noneOfTheseTags')}
            handleChange={handleTagFieldChange}
            tagSearchType="tagsNOT"
            tagMode="remove"
          />
        </FormControl>
        {AppConfig.showAdvancedSearch && (
          <React.Fragment>
            <FormControl
              className={classes.formControl}
              disabled={indexing || !Pro}
              title={
                !Pro
                  ? i18n.t('core:thisFunctionalityIsAvailableInPro')
                  : undefined
              }
            >
              <InputLabel htmlFor="file-type">
                {i18n.t('core:fileType')}
              </InputLabel>
              <Select
                value={JSON.stringify(fileTypes)}
                onChange={handleFileTypeChange}
                input={<Input name="fileTypes" id="file-type" />}
              >
                <MenuItem value={JSON.stringify(FileTypeGroups.any)}>
                  {i18n.t('core:anyType')}
                </MenuItem>
                <MenuItem value={JSON.stringify(FileTypeGroups.folders)}>
                  <IconButton>
                    <FolderIcon />
                  </IconButton>
                  {i18n.t('core:searchFolders')}
                </MenuItem>
                <MenuItem value={JSON.stringify(FileTypeGroups.files)}>
                  <IconButton>
                    <FileIcon />
                  </IconButton>
                  {i18n.t('core:searchFiles')}
                </MenuItem>
                <MenuItem value={JSON.stringify(FileTypeGroups.untagged)}>
                  <IconButton>
                    <UntaggedIcon />
                  </IconButton>
                  {i18n.t('core:searchUntaggedEntries')}
                </MenuItem>
                <MenuItem
                  value={JSON.stringify(FileTypeGroups.images)}
                  title={FileTypeGroups.images.toString()}
                >
                  <IconButton>
                    <PictureIcon />
                  </IconButton>
                  {i18n.t('core:searchPictures')}
                </MenuItem>
                <MenuItem
                  value={JSON.stringify(FileTypeGroups.documents)}
                  title={FileTypeGroups.documents.toString()}
                >
                  <IconButton>
                    <DocumentIcon />
                  </IconButton>
                  {i18n.t('core:searchDocuments')}
                </MenuItem>
                <MenuItem
                  value={JSON.stringify(FileTypeGroups.notes)}
                  title={FileTypeGroups.notes.toString()}
                >
                  <IconButton>
                    <NoteIcon />
                  </IconButton>
                  {i18n.t('core:searchNotes')}
                </MenuItem>
                <MenuItem
                  value={JSON.stringify(FileTypeGroups.audio)}
                  title={FileTypeGroups.audio.toString()}
                >
                  <IconButton>
                    <AudioIcon />
                  </IconButton>
                  {i18n.t('core:searchAudio')}
                </MenuItem>
                <MenuItem
                  value={JSON.stringify(FileTypeGroups.video)}
                  title={FileTypeGroups.video.toString()}
                >
                  <IconButton>
                    <VideoIcon />
                  </IconButton>
                  {i18n.t('core:searchVideoFiles')}
                </MenuItem>
                <MenuItem
                  value={JSON.stringify(FileTypeGroups.archives)}
                  title={FileTypeGroups.archives.toString()}
                >
                  <IconButton>
                    <ArchiveIcon />
                  </IconButton>
                  {i18n.t('core:searchArchives')}
                </MenuItem>
                <MenuItem
                  value={JSON.stringify(FileTypeGroups.bookmarks)}
                  title={FileTypeGroups.bookmarks.toString()}
                >
                  <IconButton>
                    <BookmarkIcon />
                  </IconButton>
                  {i18n.t('core:searchBookmarks')}
                </MenuItem>
                <MenuItem
                  value={JSON.stringify(FileTypeGroups.ebooks)}
                  title={FileTypeGroups.ebooks.toString()}
                >
                  <IconButton>
                    <BookIcon />
                  </IconButton>
                  {i18n.t('core:searchEbooks')}
                </MenuItem>
              </Select>
              {/* <FormHelperText>{i18n.t('core:searchFileTypes')}</FormHelperText> */}
            </FormControl>
            <FormControl
              className={classes.formControl}
              disabled={indexing || !Pro}
              title={i18n.t('core:thisFunctionalityIsAvailableInPro')}
            >
              <InputLabel shrink htmlFor="file-size">
                {i18n.t('core:sizeSearchTitle')}
              </InputLabel>
              <Select
                value={fileSize}
                onChange={handleFileSizeChange}
                input={<Input name="fileSize" id="file-size" />}
                displayEmpty
              >
                <MenuItem value="">{i18n.t('core:sizeAny')}</MenuItem>
                <MenuItem value="sizeEmpty">
                  {i18n.t('core:sizeEmpty')}
                </MenuItem>
                <MenuItem value="sizeTiny">
                  {i18n.t('core:sizeTiny')}
                  &nbsp;(&lt;&nbsp;10KB)
                </MenuItem>
                <MenuItem value="sizeVerySmall">
                  {i18n.t('core:sizeVerySmall')}
                  &nbsp;(&lt;&nbsp;100KB)
                </MenuItem>
                <MenuItem value="sizeSmall">
                  {i18n.t('core:sizeSmall')}
                  &nbsp;(&lt;&nbsp;1MB)
                </MenuItem>
                <MenuItem value="sizeMedium">
                  {i18n.t('core:sizeMedium')}
                  &nbsp;(&lt;&nbsp;50MB)
                </MenuItem>
                <MenuItem value="sizeLarge">
                  {i18n.t('core:sizeLarge')}
                  &nbsp;(&lt;&nbsp;1GB)
                </MenuItem>
                <MenuItem value="sizeHuge">
                  {i18n.t('core:sizeHuge')}
                  &nbsp;(&gt;&nbsp;1GB)
                </MenuItem>
              </Select>
            </FormControl>
            <FormControl
              className={classes.formControl}
              disabled={indexing || !Pro}
              title={
                !Pro
                  ? i18n.t('core:thisFunctionalityIsAvailableInPro')
                  : undefined
              }
            >
              <InputLabel shrink htmlFor="modification-date">
                {i18n.t('core:lastModifiedSearchTitle')}
              </InputLabel>
              <Select
                value={lastModified}
                onChange={handleLastModifiedChange}
                input={<Input name="lastModified" id="modification-date" />}
                displayEmpty
              >
                <MenuItem value="">{i18n.t('core:anyTime')}</MenuItem>
                <MenuItem value="today">{i18n.t('core:today')}</MenuItem>
                <MenuItem value="yesterday">
                  {i18n.t('core:yesterday')}
                </MenuItem>
                <MenuItem value="past7Days">
                  {i18n.t('core:past7Days')}
                </MenuItem>
                <MenuItem value="past30Days">
                  {i18n.t('core:past30Days')}
                </MenuItem>
                <MenuItem value="past6Months">
                  {i18n.t('core:past6Months')}
                </MenuItem>
                <MenuItem value="pastYear">{i18n.t('core:pastYear')}</MenuItem>
                <MenuItem value="moreThanYear">
                  {i18n.t('core:moreThanYear')}
                </MenuItem>
              </Select>
            </FormControl>
            <FormControl
              className={classes.formControl}
              title={
                !Pro
                  ? i18n.t('core:thisFunctionalityIsAvailableInPro')
                  : undefined
              }
            >
              <TextField
                id="tagTimePeriod"
                label={i18n.t('Enter time period')}
                value={tagTimePeriod}
                disabled={indexing || !Pro}
                onChange={handleTimePeriodChange}
                onKeyDown={startSearch}
                helperText={tagTimePeriodHelper}
                error={tagTimePeriodHelper.length < 1}
                InputProps={{
                  endAdornment: (
                    <InputAdornment
                      position="end"
                      title="201905 for May 2019 / 20190412 for 12th of April 2019 / 20190501~124523 for specific time"
                    >
                      <IconButton>
                        <DateIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              {/* <TextField
                id="tagPlace"
                label={i18n.t('GPS coordinates or plus code')}
                value={tagPlace}
                disabled={indexing || !Pro}
                onChange={handlePlaceChange}
                onKeyDown={startSearch}
                helperText={tagPlaceHelper}
                error={tagPlaceHelper.length < 1}
                InputProps={{
                  endAdornment: (
                    <InputAdornment
                      position="end"
                      title="GPS: 49.23276,12.43123 PlusCode: 8FRG8Q87+6X"
                    >
                      <IconButton onClick={openPlace}>
                        <PlaceIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              /> */}
            </FormControl>
            <FormControl
              className={classes.formControl}
              disabled={indexing || !Pro}
              title={
                !Pro
                  ? i18n.t('core:thisFunctionalityIsAvailableInPro')
                  : undefined
              }
            >
              <InputLabel shrink htmlFor="saved-searches">
                {i18n.t('core:savedSearchesTitle')}
              </InputLabel>
              <Select
                onChange={handleSavedSearchChange}
                input={<Input name="savedSearch" id="saved-searches" />}
                displayEmpty
                value={props.searchQuery.uuid ? props.searchQuery.uuid : -1}
              >
                <MenuItem value={-1} style={{ display: 'none' }} />
                {props.searches.map(search => (
                  <MenuItem key={search.uuid} value={search.uuid}>
                    <span style={{ width: '100%' }}>{search.title}</span>
                    {/* <IconButton
                      onClick={event =>
                        handleSavedSearchEdit(event, search.uuid)
                      }
                    >
                      <FolderIcon />
                    </IconButton> */}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {Pro && (
              <FormControl className={classes.formControl}>
                <ButtonGroup style={{ justifyContent: 'center' }}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    size="medium"
                    style={
                      props.searchQuery.uuid
                        ? { width: '48%' }
                        : { width: '100%' }
                    }
                    onClick={() => saveSearch()}
                  >
                    {i18n.t('searchSaveBtn')}
                  </Button>
                  {props.searchQuery.uuid && (
                    <Button
                      variant="outlined"
                      color="secondary"
                      size="medium"
                      style={{ width: '48%' }}
                      onClick={() => saveSearch(false)}
                    >
                      {i18n.t('searchEditBtn')}
                    </Button>
                  )}
                </ButtonGroup>
              </FormControl>
            )}
            <FormControl className={classes.formControl}>
              <ButtonGroup style={{ justifyContent: 'center' }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  size="medium"
                  style={{ width: '100%' }}
                  onClick={clearSearch}
                  id="resetSearchButton"
                >
                  {i18n.t('resetBtn')}
                </Button>
              </ButtonGroup>
            </FormControl>
            {SaveSearchDialog && saveSearchDialogOpened !== undefined && (
              <SaveSearchDialog
                open={saveSearchDialogOpened !== undefined}
                onClose={(searchQuery: TagSpaces.SearchQuery) => {
                  setSaveSearchDialogOpened(undefined);
                  if (searchQuery) {
                    if (searchQuery.searchBoxing === 'global') {
                      props.searchAllLocations(searchQuery);
                    } else {
                      props.searchLocationIndex(searchQuery);
                    }
                  }
                }}
                onClearSearch={() => clearSearch()}
                searchQuery={saveSearchDialogOpened}
              />
            )}
            <input
              style={{ display: 'none' }}
              ref={fileInputRef}
              accept="*"
              type="file"
              onChange={handleFileInputChange}
            />
            {ExportSearchesDialog && isExportSearchesDialogOpened && (
              <ExportSearchesDialog
                open={isExportSearchesDialogOpened}
                onClose={() => setExportSearchesDialogOpened(false)}
                searches={props.searches}
              />
            )}
            {ImportSearchesDialog && importFile && (
              <ImportSearchesDialog
                open={Boolean(importFile)}
                onClose={() => setImportFile(undefined)}
                importFile={importFile}
                addSearches={props.addSearches}
                searches={props.searches}
              />
            )}
          </React.Fragment>
        )}
      </div>
    </div>
  );
});

function mapStateToProps(state) {
  return {
    indexing: isIndexing(state),
    searchQuery: getSearchQuery(state),
    currentDirectory: getDirectoryPath(state),
    indexedEntriesCount: getIndexedEntriesCount(state),
    maxSearchResults: getMaxSearchResults(state),
    searches: getSearches(state)
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      searchAllLocations: LocationIndexActions.searchAllLocations,
      setSearchQuery: LocationIndexActions.setSearchQuery,
      searchLocationIndex: LocationIndexActions.searchLocationIndex,
      createLocationsIndexes: LocationIndexActions.createLocationsIndexes,
      loadDirectoryContent: AppActions.loadDirectoryContent,
      openURLExternally: AppActions.openURLExternally,
      setSearchResults: AppActions.setSearchResults,
      addSearches: SearchActions.addSearches
    },
    dispatch
  );
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withStyles(styles, { withTheme: true })(Search));
