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
    { id: '#seventh', start: 4000, end: 4300 },
    { id: '#last', start: 4300, end: 4663 },
];

const debug = true;

const BThreshold = window.innerHeight * 0.15;
const TThreshold = window.innerHeight * 0.85;

elements.forEach(({ id, start, end }) => {
    const newStart = start + window.innerHeight;
    const newEnd = end + window.innerHeight;
    console.log('window.innerHeight:', window.innerHeight);
    console.log('newStart:', newStart);
    console.log('newEnd:', newEnd);
    animate(id, {
        keyframes: [
            { x: -200, opacity: 1 },
            { x: -200, opacity: 1 },
            { x: -200, opacity: 0},
        ],
        // translateX: -200,
        easing: 'linear',
        loop: false,
        alternate: true,
        background: '#0000ff',
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
