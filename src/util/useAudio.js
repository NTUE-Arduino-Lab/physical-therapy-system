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

// To Address Safari on iPad issue:
// Checkout: https://stackoverflow.com/questions/31776548/why-cant-javascript-play-audio-files-on-iphone-safari
// ======>> "iOS disables autoplay, instead requiring that
//            play be initiated as part of a user interaction
//           (e.g., you can start playback within a touchstart listener)."
// ======>> 透過只啟動一個 Audio 用更換來源網址達成播放不同聲音！！
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
