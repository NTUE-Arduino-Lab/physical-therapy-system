import { useState } from 'react';
import { WARN } from '../constants/index';
import warn_slight_url from '../assets/sounds/warn-slight.wav';
import warn_medium_url from '../assets/sounds/warn-medium.wav';
import warn_high_url from '../assets/sounds/warn-high.mp3';
import other_notification_url from '../assets/sounds/notification.mp3';
import other_archieved_url from '../assets/sounds/goal-archieved.wav';

const OTHER_SOUND = {
    Notification: 'notification',
    Archieved: 'goal-archieved',
};

const useAudio = () => {
    const [warn_slight] = useState(new Audio(warn_slight_url));
    const [warn_medium] = useState(new Audio(warn_medium_url));
    const [warn_high] = useState(new Audio(warn_high_url));
    const [other_notification] = useState(new Audio(other_notification_url));
    const [other_archieved] = useState(new Audio(other_archieved_url));

    const playWarnSound = (warn) => {
        switch (warn) {
            case WARN.Slight:
                warn_slight.play();
                break;
            case WARN.Medium:
                warn_medium.play();
                break;
            case WARN.High:
                warn_high.play();
                break;
        }
    };

    const playOtherSound = (sound) => {
        switch (sound) {
            case OTHER_SOUND.Archieved:
                other_archieved.play();
                break;
            case OTHER_SOUND.Notification:
                other_notification.play();
                break;
        }
    };

    return { playWarnSound, playOtherSound, OTHER_SOUND };
};

export default useAudio;
