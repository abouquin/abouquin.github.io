import {
  animate,
  stagger,
  utils,
  onScroll,
  createTimer,
  createTimeline
} from './lib/anime.esm.js';

const [container] = utils.$('.scroll-container');
const debug = true;
const newWidth = window.innerWidth - 400;
// animate('.square', {
//   x: newWidth,
//   rotate: { from: -180 },
//   duration: 1250,
//   delay: stagger(65, { from: 'center' }),
//   ease: 'inOutQuint',
//   loop: true,
//   alternate: true,
//   background: '#0000ff'
// });

animate('.square', {
  keyframes: [
    { x: newWidth },
    { x: newWidth },  // Hold position
    { x: newWidth },
    { x: 0 }
  ],
  // rotate: '1turn',
  // duration: 1000,
  // delay: 700,
  ease: 'linear',
  loop: false,
  alternate: true,
  background: '#0000ff',
  opacity: 1,
  autoplay: onScroll({
    container,
    enter: 'bottom-=100 top',
    leave: 'top+=100 bottom',
    sync: true,
    debug
  })
});

// const [$timer] = utils.$('.timer');

// createTimer({
//   duration: 2000,
//   alternate: true,
//   loop: true,
//   onUpdate: self => {
//     $timer.innerHTML = self.iterationCurrentTime
//   },
//   autoplay: onScroll({
//     target: $timer.parentNode,
//     container,
//     debug
//   })
// });

// // Timeline

const circles = utils.$('.circle');

createTimeline({
  alternate: true,
  loop: true,
  autoplay: onScroll({
    target: circles[0],
    container,
    enter: 'bottom-=200 top',
    leave: 'top+=200 bottom',
    debug
  })
})
  .add(circles[2], { x: '9rem' })
  .add(circles[1], { x: '9rem' })
  .add(circles[0], { x: '9rem' });