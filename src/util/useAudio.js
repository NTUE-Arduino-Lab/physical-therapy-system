import { useState } from 'react';
import { WARN } from '../constants/index';
import warn_slight_url from '../assets/sounds/warn-slight.wav';
import warn_medium_url from '../assets/sounds/warn-medium.wav';
import warn_high_url from '../assets/sounds/warn-high.wav';
import other_notification_url from '../assets/sounds/notification.wav';
import other_archieved_url from '../assets/sounds/goal-archieved.wav';

const OTHER_SOUND = {
    Notification: 'notification',
    Archieved: 'goal-archieved',
};

const useAudio = () => {
    const [audioPlayer] = useState(new Audio(other_notification_url));

    const getAudioPermission = () => {
        audioPlayer.play();
    };

    const playWarnSound = (warn) => {
        switch (warn) {
            case WARN.Slight:
                audioPlayer.src = warn_slight_url;
                audioPlayer.play();
                break;
            case WARN.Medium:
                audioPlayer.src = warn_medium_url;
                audioPlayer.play();
                break;
            case WARN.High:
                audioPlayer.src = warn_high_url;
                audioPlayer.play();
                break;
        }
    };

    // const playWarnSound = (warn) => {
    //     switch (warn) {
    //         case WARN.Slight:
    //             warn_slight.play();
    //             break;
    //         case WARN.Medium:
    //             warn_medium.play();
    //             break;
    //         case WARN.High:
    //             warn_high.play();
    //             break;
    //     }
    // };

    const playOtherSound = (sound) => {
        switch (sound) {
            case OTHER_SOUND.Archieved:
                audioPlayer.src = other_archieved_url;
                audioPlayer.play();
                break;
            case OTHER_SOUND.Notification:
                audioPlayer.play();
                break;
        }
    };

    return { getAudioPermission, playWarnSound, playOtherSound, OTHER_SOUND };
};

export default useAudio;
