/* eslint-disable prettier/prettier */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useEffect, useRef, useState } from 'react';
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
import useAudio from '../../util/useAudio';

import audio2 from '../../assets/sounds/goal-archieved.wav';
import audio3 from '../../assets/sounds/notification.wav';
import audio4 from '../../assets/sounds/warn-medium.wav';

// const audioSrc =
// 'data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';

// let audio;

const AdminDashboard = () => {
    const navigate = useNavigate();
    const audioRef = useRef();
    const [audioSrc, setAudioSrc] = useState(audio2);

    // const { getAudioPermission } = useAudio();

    const [isPressed, setIsPressed] = useState(false);

    useEffect(() => {
        // window.addEventListener('touchstart', () => {
        //     document.getElementById('beep').muted = false;
        //     document.getElementById('beep').play();
        // });
        // console.log(audioRef.current);
        // window.addEventListener('load', initMusic);
        // setTimeout(() => {
        //     setAudioSrc(audio3);
        //     setIsPressed(true);
        //     setTimeout(() => {
        //         setIsPressed(false);
        //     }, 1000);
        // }, 5000)
    }, []);

    const goUserList = () => {
        navigate(ROUTE_PATH.user_list);
    };

    const goDifficulityList = () => {
        navigate(ROUTE_PATH.difficulty_list);
    };

    const goRecordList = () => {
        // navigate(`${ROUTE_PATH.record_list}/123`);
        // getAudioPermission();

        const audio = document.getElementById('audio');
        audio.muted = false;
        audio.src = audio3;
        audio.play();

        // setAudioSrc(audio3);
        setIsPressed(true);

        setTimeout(() => {
            setIsPressed(false);
        }, 3000);

        // setTimeout(() => {
        //     setAudioSrc(audio3);
        //     setIsPressed(true);
        // }, 8000);

        // setTimeout(() => {
        //     setIsPressed(false);
        // }, 9000);
    };

    const onEnd = () => {

    }

    const goPrepareWorkout = () => {
        navigate(ROUTE_PATH.prepare_workout);
        // getAudioPermission();
        // navigate(ROUTE_PATH.prepare_workout, { replace: true }); // 若要防止左滑上一頁

        // playSound();

        setAudioSrc(audio2);
        setIsPressed(true);

        setTimeout(() => {
            setIsPressed(false);
        }, 3000);
    };

    const initMusic = () => {
        let audio = document.createElement('audio');
        audio.setAttribute('id', 'audio');
        audio.setAttribute('autoplay', 'autoplay');
        audio.setAttribute('loop', 'loop');
        audio.innerHTML = "<source src='assets/sounds/goal-archieved.wav'>";

        document.body.appendChild(audio);
        audio.load();

        audio.play();
        audio.pause();

        document.addEventListener('touchstart', () => {
            document.getElementById('audio').play();
        });

        // audioRef.current.muted = false;
    };

    const playSound = async () => {
        // audio = document.createElement('audio');
        // audio.setAttribute('id', 'audio');
        // audio.setAttribute('autoplay', 'autoplay');
        // audio.setAttribute('loop', 'loop');
        // audio.innerHTML =
        //     '<source src="https://github.com/yuchehsieh/assets-repo/blob/main/sounds/goal-archieved.wav">';
        // document.body.appendChild(audio);
        // audio.load();
        // audio.play();
        // audio.pause();
        // audioRef.current.muted = false;
        // audio.muted = false;
        // audio.src =
        //     'https://github.com/yuchehsieh/assets-repo/blob/main/sounds/goal-archieved.wav';
        // audioRef.current.load();
        // await audioRef.current.play();
        // document.getElementById('audio').src = 'https://github.com/yuchehsieh/assets-repo/blob/main/sounds/goal-archieved.wav'
    };

    return (
        <div className={styles.container}>
            <legend>～選擇您的操作～</legend>
            <audio id="audio" src={audioSrc} muted></audio>
            {/* {isPressed && <audio src={audioSrc} autoPlay></audio>} */}
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
