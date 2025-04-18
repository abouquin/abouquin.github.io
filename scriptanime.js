import {
    animate,
    stagger,
    utils,
    onScroll,
    createTimer,
    createTimeline
} from './animejs/lib/anime.esm.js';

console.log(document.querySelector('.svg-grid-bg'));

animate('.svg-grid-bg', {
    // translateX: [-30, 30],
    translateY: [-10, 10],
    opacity: [0, 0.2],
    duration: 4000,
    delay: stagger(100),
    alternate: true,
    easing: 'easeInOutSine',
    loop: true,
});