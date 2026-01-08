const clickSound = new Audio('./Sounds/Click.mp3');
clickSound.preload = 'auto';
const buttons = document.querySelectorAll('.menu');
buttons.forEach(button => {
  button.addEventListener('click', () => {
    clickSound.currentTime = 0;
    clickSound.play();
  });
});