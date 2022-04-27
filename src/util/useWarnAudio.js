import { useState } from 'react';
import { WARN } from '../constants/index';
import slight_url from '../assets/sounds/warn-slight.wav';
import medium_url from '../assets/sounds/warn-medium.wav';
import high_url from '../assets/sounds/warn-high.mp3';

const useWarnAudio = () => {
    const [audio_slight] = useState(new Audio(slight_url));
    const [audio_medium] = useState(new Audio(medium_url));
    const [audio_high] = useState(new Audio(high_url));

    const playWarnSound = (warn) => {
        switch (warn) {
            case WARN.Slight:
                audio_slight.play();
                break;
            case WARN.Medium:
                audio_medium.play();
                break;
            case WARN.High:
                audio_high.play();
                break;
        }
    };

    return [playWarnSound];
};

export default useWarnAudio;
