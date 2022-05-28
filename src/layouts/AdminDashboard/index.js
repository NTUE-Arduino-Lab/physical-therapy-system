/* eslint-disable prettier/prettier */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TeamOutlined,
    SlidersOutlined,
    ProfileOutlined,
    RocketOutlined,
} from '@ant-design/icons';

import { ROUTE_PATH } from '../../constants';
import styles from './styles.module.scss';

import addOnImg from '../../assets/images/right-arrow.png';

import warn_slight_url from '../../assets/sounds/warn-slight.wav';
import warn_medium_url from '../../assets/sounds/warn-medium.wav';
import warn_high_url from '../../assets/sounds/warn-high.wav';
import other_notification_url from '../../assets/sounds/notification.wav';
import other_archieved_url from '../../assets/sounds/goal-archieved.wav';



import test_mp3 from '../../assets/sounds/test-sound.mp3';
import local_yodel from '../../assets/sounds/local-yodel.mp3';



const AdminDashboard = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // console.log(warn_slight_url);
        fetchWithUrl('https://s3-us-west-2.amazonaws.com/s.cdpn.io/123941/Yodel_Sound_Effect.mp3')
        fetchWithUrl(local_yodel)
    }, [])

    const fetchWithUrl = async (url = warn_slight_url) => {
    
        let response = await fetch(url);
        let arrayBuffer = await response.arrayBuffer();

        console.log(arrayBuffer);
    }

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
    }

    return (
        <div className={styles.container}>
            <legend>～選擇您的操作～</legend>
            <fieldset>
                <TileWithIconAndAction
                    icon={<TeamOutlined />}
                    label="騎乘者設定"
                    action={goUserList}
                />

                <TileWithIconAndAction
                    icon={<SlidersOutlined />}
                    label="騎乘關卡設定"
                    action={goDifficulityList}
                />

                <TileWithIconAndAction
                    icon={<ProfileOutlined />}
                    label="騎乘紀錄查詢"
                    action={goRecordList}
                />

                <TileWithIconAndAction
                    icon={<RocketOutlined />}
                    label="開始騎乘作業"
                    action={goPrepareWorkout}
                />
            </fieldset>
        </div>
    );
};

const TileWithIconAndAction = ({ icon, label, action }) => (
    <span className={styles.tile} onClick={action}>
        <span
            className={styles.addOn}
            style={{ backgroundImage: `url(${addOnImg})` }}
        ></span>
        <span className={styles.tileIcon}>{icon}</span>
        <span className={styles.tileLabel}>{label}</span>
    </span>
);

export default AdminDashboard;
