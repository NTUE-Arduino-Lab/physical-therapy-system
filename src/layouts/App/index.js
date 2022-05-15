/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { ConfigProvider } from 'antd';
import 'moment/locale/zh-tw';
import locale from 'antd/lib/locale/zh_TW';
import React, { useEffect, useState } from 'react';
import { useStore } from '../../store';
import { SET_AUTH } from '../../store/actions';
import _ from '../../util/helper';
// import moment from 'moment';

// import styles from './styles.module.scss';
import 'antd/dist/antd.css';
import '@ant-design/flowchart/dist/index.css';

/*
    expect: 
        ConfigProvider
*/

const AppProvider = ({ children }) => {
    const { dispatch } = useStore();
    const [initializedDone, setInitializedDone] = useState(false);

    useEffect(() => {
        attempLogin();
        const listener = (ev) => {
            ev.preventDefault();

            dispatch({
                type: SET_AUTH,
                payload: {
                    isValid: false,
                    roles: [],
                },
            });

            ev.returnValue = '文章要保存吼，确定离开吗？';
        };
        window.addEventListener('beforeunload', listener);
        return () => {
            window.removeEventListener('beforeunload', listener);
        };
    }, []);

    const attempLogin = () => {
        // console.log('executing attemp login');
        // const expiredIn = window.localStorage.getItem(
        //     'inventory-system-expired-in',
        // );
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

    return <ConfigProvider locale={locale}>{children}</ConfigProvider>;
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
