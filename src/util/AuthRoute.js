/* eslint-disable react/prop-types */
/*
 *
 * This File is Deprecated!!!
 *
 */

import React, { useContext } from 'react';
import { Route, Redirect } from 'react-router-dom';

import routePath from '../constants/path';
import { StoreContext } from '../store';

const AuthRoute = ({ component: Component, ...props }) => {
    const {
        state: { auth },
    } = useContext(StoreContext);

    console.log(auth);

    return (
        <Route
            component={(_props) =>
                auth.isValid ? (
                    <Component {..._props} />
                ) : (
                    <Redirect push to={routePath.backstage_login} />
                )
            }
            {...props}
        />
    );
};

export default AuthRoute;
