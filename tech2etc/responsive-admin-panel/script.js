let menu = document.getElementById('menu');
let menuBtn = document.getElementById('menu-btn');

menuBtn.addEventListener('click', function(){
    menu.classList.toggle('active');
});

document.addEventListener('click', function(e){
    const clickedInsideMenu = menu.contains(e.target);
    const clickedOnMenuBtn = menuBtn.contains(e.target);
    
    if (!clickedInsideMenu && !clickedOnMenuBtn && menu.classList.contains('active')) {
        menu.classList.remove('active');
    }
}); 