const sections = document.querySelectorAll('section');
const menus = document.querySelectorAll('.menu');

window.addEventListener('scroll', ()=> {
    let current = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        

        if(scrollY >= sectionTop - 200){
            current = section.getAttribute('id');
        }
    });

    menus.forEach(menu => {
        menu.classList.remove('active');

        if(menu.getAttribute('href') === '#' + current){
            menu.classList.add('active');
        }
    })
})









