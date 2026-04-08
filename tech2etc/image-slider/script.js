(function(){
    const pictures = ['https://images.unsplash.com/photo-1552922554-429f5005fe04?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 'https://plus.unsplash.com/premium_photo-1663036520394-93886cdb9735?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 'https://images.unsplash.com/photo-1613299749143-9761571f0b1b?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 'https://images.unsplash.com/photo-1651667765580-f393a9b70af1?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 'https://images.unsplash.com/photo-1766944695286-8e7c18f0fda9?q=80&w=714&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D']

    

const buttons = document.querySelectorAll('.btn');
const imgDiv = document.querySelector('.img-container');

let counter = 0;

imgDiv.style.background = `url(${pictures[0]})`;

buttons.forEach(function(button){
    button.addEventListener('click', function(e){
        if(button.classList.contains('btn-left')){
            counter--;

            if(counter < 0){
                counter = pictures.length - 1;
            }

            imgDiv.style.background = `url(${pictures[counter]}) center/cover fixed no-repeat`;
            
        }

        // button left end

        if(button.classList.contains('btn-right')){
            counter++;

            if(counter > pictures.length - 1){
                counter = 0;
            }

            imgDiv.style.background = `url(${pictures[counter]}) center/cover fixed no-repeat`;
            
        }
    })
})








})()