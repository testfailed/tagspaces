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

import React from 'react';
import { connect } from 'react-redux';
import Tooltip from '@material-ui/core/Tooltip';
import { TS } from '-/tagspaces.namespace';
import { getAllTags, getTagColors } from '-/reducers/taglibrary';
import { getTagColor, getTagTextColor } from '-/reducers/settings';
import i18n from '-/services/i18n';

interface Props {
  tags: Array<TS.Tag>;
  allTags?: Array<TS.Tag>;
  defaultTextColor?: string;
  defaultBackgroundColor?: string;
}

const TagsPreview = (props: Props) => {
  const { tags, allTags, defaultBackgroundColor, defaultTextColor } = props;
  if (!tags || tags.length < 1) {
    return <></>;
  }
  let tagNames = i18n.t('core:searchTags') + ': ';
  tags.forEach(tag => {
    tagNames = tagNames + tag.title + ' ';
  });

  const tag1Colors = getTagColors(allTags, tags[0].title);
  const firstTagColor =
    tags[0].color || tag1Colors.color || defaultBackgroundColor;
  let secondTagColor = defaultBackgroundColor;
  let moreThanOne = false;
  if (tags[1]) {
    moreThanOne = true;
    const tag2Colors = getTagColors(allTags, tags[1].title);
    if (tags[1].color) {
      secondTagColor = tags[1].color || tag2Colors.color;
    }
  }
  return (
    <Tooltip title={tagNames}>
      <span
        style={{
          display: 'inline-block',
          width: 18,
          height: 15,
          marginLeft: 5,
          borderRadius: 7,
          borderRight: moreThanOne ? 'white 1px solid' : 'initial',
          boxShadow: moreThanOne ? '4px 0px 0px 0px ' + secondTagColor : 'none',
          backgroundColor: firstTagColor,
          fontSize: 11,
          lineHeight: '16px',
          color: tag1Colors.textcolor || defaultTextColor,
          textAlign: 'center'
        }}
      >
        {moreThanOne ? tags.length : '1'}
      </span>
    </Tooltip>
  );
};

function mapStateToProps(state) {
  return {
    allTags: getAllTags(state),
    defaultBackgroundColor: getTagColor(state),
    defaultTextColor: getTagTextColor(state)
  };
}
export default connect(mapStateToProps)(TagsPreview);
