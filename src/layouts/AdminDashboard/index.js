/* eslint-disable prettier/prettier */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React from 'react';
import { useNavigate } from 'react-router-dom';

import { ROUTE_PATH } from '../../constants';
import styles from './styles.module.scss';

import IconDashboard1 from '../../components/Dashboard/IconDashboard1';
import IconDashboard2 from '../../components/Dashboard/IconDashboard2';
import IconDashboard3 from '../../components/Dashboard/IconDashboard3';
import IconDashboard4 from '../../components/Dashboard/IconDashboard4';

const AdminDashboard = () => {
    const navigate = useNavigate();

    const goUserList = () => {
        navigate(ROUTE_PATH.user_list);
    };

    const goDifficulityList = () => {
        navigate(ROUTE_PATH.difficulty_list);
    };

    const goRecordList = () => {
        navigate(`${ROUTE_PATH.record_list}/123`);
    };

    const goPrepareWorkout = () => {
        navigate(ROUTE_PATH.prepare_workout);
    };

    return (
        <div className={styles.container}>
            <legend>選擇您的操作</legend>
            <fieldset>
                <TileWithIconAndAction
                    icon={<IconDashboard1 />}
                    action={goUserList}
                />

                <TileWithIconAndAction
                    icon={<IconDashboard2 />}
                    action={goDifficulityList}
                />

                <TileWithIconAndAction
                    icon={<IconDashboard3 />}
                    action={goRecordList}
                />

                <TileWithIconAndAction
                    icon={<IconDashboard4 />}
                    action={goPrepareWorkout}
                />
            </fieldset>
        </div>
    );
};

const TileWithIconAndAction = ({ icon, action }) => (
    <div className={styles.tile} onClick={action}>
        {icon}
    </div>
);

export default AdminDashboard;
