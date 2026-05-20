(function(){
    const element = document.querySelector('.move');
    if(!element) return;

    const movementStrength  = 50;

    let elementWidth, elementHeight;

    function updateElementSize(){
        const rect = element.getBoundingClientRect();
        elementWidth = rect.width;
        elementHeight = rect.height;
    }

    function onMouseMove(e){
        console.clear();
        let mouseX = e.clientX;
        let mouseY = e.clientY;
        console.log(' mouseX: ' + mouseX + ' mouseY: ' + mouseY )

        const rect = element.getBoundingClientRect();
        const relativeX = (mouseX - rect.left) / rect.width;
        const relativeY = (mouseY - rect.top) / rect.height;

        console.log('relativeX: ' + relativeX + ' relativeY: ' + relativeY )


        const clampedX = Math.min(1, Math.max(0, relativeX));
        const clampedY = Math.min(1, Math.max(0, relativeY));

        console.log('clampedX: ' + clampedX + ' clampedY: ' + clampedY )

        const offsetX = (clampedX - 0.5) * movementStrength ;
        const offsetY = (clampedY - 0.5) * movementStrength ;

        console.log('offsetX: ' + offsetX + ' offsetY: ' + offsetY )

        element.style.backgroundPosition = `calc(50% + ${offsetX}px) calc(50% + ${offsetY}px)`;
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('resize', function(){
        
        element.style.backgroundPosition = 'center';
    });
})()