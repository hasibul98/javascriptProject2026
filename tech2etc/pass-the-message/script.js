(function(){

const message = document.querySelector('#message')
const feedback = document.querySelector('.feedback');
const messageContent = document.querySelector('.message-content')

messageContent.textContent = '';


const form = document.querySelector('#message-form');

form.addEventListener('submit', function(e){
    e.preventDefault();


    if(message.value.trim() === ''){
        feedback.classList.add('show');
        setTimeout(function(){
            feedback.classList.remove('show');
        }, 2000)
    } else{
        messageContent.textContent = message.value;
        message.value = '';
    }
})








})()