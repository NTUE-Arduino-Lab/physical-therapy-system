/* eslint-disable react/prop-types */
import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useStore } from '../store';
import { ROUTE_PATH } from '../constants';

const ProtectedRoutes = ({ allowedRoles }) => {
    const {
        state: { auth },
    } = useStore();

    if (!auth.isValid) {
        return <Navigate replace to={ROUTE_PATH.sign_in} />;
    }

    return auth.roles.find((role) => allowedRoles?.includes(role)) ? (
        <Outlet />
    ) : (
        <Navigate replace to={ROUTE_PATH.unauthorized} />
    );
};

export default ProtectedRoutes;
