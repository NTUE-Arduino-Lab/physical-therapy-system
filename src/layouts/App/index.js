/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import { useStore } from '../../store';
import { SET_AUTH } from '../../store/actions';
// import moment from 'moment';
import _ from '../../util/helper';

// import styles from './styles.module.scss';

/*
    expect: 
        ConfigProvider
*/

const AppProvider = ({ children }) => {
    const { dispatch } = useState();
    const [initializedDone, setInitializedDone] = useState(false);

    useEffect(() => {
        attempLogin();
    }, []);

    const attempLogin = () => {
        console.log('executing attemp login');
        const expiredIn = window.localStorage.getItem(
            'inventory-system-expired-in',
        );
        setInitializedDone(true);

        // Example Down Below
        // if (_.isNullOrUndefined(expiredIn)) {
        //     setInitializedDone(true);
        //     return;
        // }
        // if (moment(expiredIn).endOf('day').isSameOrAfter(moment())) {
        //     dispatch({
        //         type: SET_AUTH,
        //         payload: {
        //             isValid: true,
        //             roles: [5051],
        //         },
        //     });
        // }
        // setInitializedDone(true);
    };

    if (!initializedDone) {
        return null;
    }

    return <div>{children}</div>;
};

export default AppProvider;

// Example Down Below

// /* eslint-disable react/prop-types */
// import React from 'react';
// import { ConfigProvider } from 'antd';
// import 'moment/locale/zh-tw';
// import locale from 'antd/lib/locale/zh_TW';

// // import styles from './styles.module.scss';

// const App = ({ children }) => (
//     <ConfigProvider locale={locale}>{children}</ConfigProvider>
// );

// export default App;
