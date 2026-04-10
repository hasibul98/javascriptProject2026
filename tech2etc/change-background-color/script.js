const button = document.querySelector('button');

const body = document.querySelector('body');
const color = ['red', 'reen', 'blue', 'yellow', 'pink', 'purple'];

body.style.background = 'violet';

button.addEventListener('click', changeB);

function changeB(){
    const colorIndx = parseInt(Math.random()*color.length);
    body.style.background = color[colorIndx];
}










