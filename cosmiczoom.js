import {
    animate,
    stagger,
    utils,
    onScroll,
    createTimer,
    createTimeline
} from './animejs/lib/anime.esm.js';

// Global Variables
let frame = 0;
let totalFrames = 0;
let scrollY = 0;
let maxScroll = 0;
let scrollFraction = 0;
let currentPower = null;

// Scale Elements
const scaleElements = [
    { power: 6, start: 0, end: 600 },
    { power: 7, start: 600, end: 910 },
    { power: 8, start: 910, end: 1120 },
    { power: 9, start: 1120, end: 1310 },
    { power: 10, start: 1310, end: 1510 },
    { power: 11, start: 1510, end: 1700 },
    { power: 12, start: 1700, end: 1900 },
    { power: 13, start: 1900, end: 2100 },
    { power: 14, start: 2100, end: 2300 },
    { power: 15, start: 2300, end: 2510 },
    { power: 16, start: 2510, end: 2710 },
    { power: 17, start: 2710, end: 2910 },
    { power: 18, start: 2910, end: 3100 },
    { power: 19, start: 3100, end: 3300 },
    { power: 20, start: 3300, end: 3500 },
    { power: 21, start: 3500, end: 3700 },
    { power: 22, start: 3700, end: 3900 },
    { power: 23, start: 3900, end: 4080 },
    { power: 24, start: 4080, end: 4280 },
    { power: 25, start: 4280, end: 4480 },
    { power: 26, start: 4480, end: 5500 },
]


// VIDEO SCRUBBER
const video = document.getElementById('zoomVideo');
const fps = 60;

video.addEventListener('loadedmetadata', () => {
    const duration = video.duration;

    totalFrames = Math.round(duration * fps);

    const scrollableHeight = totalFrames;

    // Set scroll height via .content div
    const content = document.querySelector('.content');
    content.style.height = `${scrollableHeight + window.innerHeight}px`;
    console.log(`innerHeight:${window.innerHeight}, scrollableHeight:${scrollableHeight}`);

    // Scroll to top on load
    window.scrollTo(0, 0);

    let lastFrame = -1;

    function scrubVideo() {
        scrollY = window.scrollY;
        maxScroll = document.body.scrollHeight - window.innerHeight;
        scrollFraction = Math.min(scrollY / maxScroll, 1);
        frame = Math.floor(scrollFraction * totalFrames);

        const time = frame / fps;

        if (frame !== lastFrame && video.readyState >= 2) {
            video.currentTime = time;
            lastFrame = frame;
            console.log(`[SCRUB] Frame: ${frame}, Time: ${time.toFixed(2)}`);
        }

        // Update the scale display when the frame enters a new range
        const matching = scaleElements.slice().reverse().find(({ start }) => frame >= start);
        if (matching && matching.power !== currentPower) {
            currentPower = matching.power;
            document.getElementById('scaleval').innerHTML = `scale: 10<sup>${currentPower}</sup> m`;
        }

        // Log the scroll height and position
        console.log(`[SCROLL] ScrollY: ${scrollY}, Max Scroll: ${maxScroll}`);
    }

    // Add scroll event
    window.addEventListener('scroll', scrubVideo);

    // Also call on load in case scroll is already non-zero
    scrubVideo();

});

// Ensure the video is seekable
video.load();  // This helps guarantee the metadata and seek info are available


// ANIMATION

const elements = [
    { id: '#first', start: 300, end: 500 },
    { id: '#scale', start: 500, end: 700 },
    { id: '#second', start: 800, end: 1000 },
    { id: '#third', start: 1500, end: 2000 },
    { id: '#oort', start: 2100, end: 2400 },
    { id: '#fourth', start: 2500, end: 3000 },
    { id: '#fifth', start: 3200, end: 3400 },
    { id: '#sixth', start: 3500, end: 3800 },
    { id: '#seventh', start: 4000, end: 4200 },
    { id: '#last', start: 4200, end: 4663 },
];

const debug = false;

const BThreshold = window.innerHeight * 0.15;
const TThreshold = window.innerHeight * 0.85;

elements.forEach(({ id, start, end }) => {
    const newStart = start + window.innerHeight;
    const newEnd = end + window.innerHeight;
    // console.log('window.innerHeight:', window.innerHeight);
    // console.log('newStart:', newStart);
    // console.log('newEnd:', newEnd);
    animate(id, {
        keyframes: [
            { x: -200, opacity: 1 },
            { x: -200, opacity: 1 },
            { x: -200, opacity: 0 },
        ],
        // translateX: -200,
        easing: 'linear',
        loop: false,
        alternate: true,
        background: '#ff8800',
        autoplay: onScroll({
            window,
            enter: `bottom-=${BThreshold} top+=${newStart}`,
            leave: `top+=${TThreshold} bottom+=${newEnd}`,
            sync: true,
            debug
        })
    });
});

const labelBThreshold = window.innerHeight * 0.55;
const labelTThreshold = window.innerHeight * 0.1;

animate('.label', {
    ease: 'linear',
    loop: false,
    alternate: true,
    background: '#0000ff',
    opacity: 0,
    autoplay: onScroll({
        window,
        enter: `bottom-=${labelBThreshold} top`,
        leave: `top+=${labelTThreshold} bottom`,
        sync: true,
        debug
    })
});


function frameToScrollY(frame, totalFrames) {
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    return (frame / totalFrames) * maxScroll;
}