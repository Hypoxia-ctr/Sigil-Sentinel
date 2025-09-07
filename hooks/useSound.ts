import { useCallback } from 'react';
import { playSound } from '../lib/sounds';

export const useSound = () => {
    const playClick = useCallback(() => playSound('click'), []);
    const playConfirm = useCallback(() => playSound('confirm'), []);
    const playHover = useCallback(() => playSound('hover'), []);

    return { playClick, playConfirm, playHover };
};
