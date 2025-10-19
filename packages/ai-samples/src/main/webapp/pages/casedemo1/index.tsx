import React from 'react';
import layout from '@splunk/react-page/18';
import Casedemo1 from '@splunk/casedemo-1';
import { getUserTheme } from '@splunk/splunk-utils/themes';
import { StyledContainer } from './Styles';

getUserTheme()
    .then((theme) => {
        layout(
            <StyledContainer>
                <Casedemo1 />
            </StyledContainer>,
            {
                theme,
            }
        );
    })
    .catch((e) => {
        const errorEl = document.createElement('span');
        errorEl.innerHTML = e;
        document.body.appendChild(errorEl);
    });
