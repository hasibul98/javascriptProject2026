window.addEventListener('scroll', function(){
    var scroll = window.pageYoffset || document.documentElement.scrollTop;
    var img = document.querySelector('#zoom img');

    var newWidth = 100 + (scroll / 5);
    img.style.width = newWidth + '%';

});