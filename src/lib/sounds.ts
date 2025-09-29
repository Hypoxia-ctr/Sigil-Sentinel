// lib/sounds.ts

let audioContext: AudioContext | null = null;
let isAudioEnabled = true;

const initializeAudio = () => {
    if (typeof window !== 'undefined' && !audioContext) {
        try {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            console.error("Web Audio API is not supported in this browser.");
            isAudioEnabled = false;
        }

        // Check for reduced motion preference
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (mediaQuery.matches) {
            isAudioEnabled = false;
        }
        mediaQuery.addEventListener('change', (e) => {
            isAudioEnabled = !e.matches;
        });
    }
};

export const playSound = (type: 'click' | 'confirm' | 'hover') => {
    initializeAudio();
    if (!audioContext || !isAudioEnabled) return;

    // Resume context on user gesture if needed
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);

    switch (type) {
        case 'click':
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.05, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.1);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
            break;
        case 'confirm':
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(1046.50, audioContext.currentTime); // C6
            gainNode.gain.exponentialRampToValueAtTime(0.04, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.2);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
            break;
        case 'hover':
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(1500, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.02, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.05);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.05);
            break;
    }
};