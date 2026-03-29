/* Typing Animation */

const codeText = `class Developer {

  name = "Hasibul Hossain Emon"

  skills = [
    React,
    javaScript
  ]

  status = "Available for hire"
}
`;

let i = 0;

function type(){
    if(i < codeText.length){
        document.getElementById('code').textContent += codeText.charAt(i);

        i++;
        setTimeout(type, 35);

    }
}

type();

console.log(codeText.charAt(6))

const tags = document.querySelectorAll('.tag');

tags.forEach(tag => {
    let radius = 15 + Math.random() * 8;
    let angle = Math.random() * Math.PI * 2;
    let speed = 0.002 + Math.random() * 0.002;

    function animate(){
        angle += speed;
        let x = Math.cos(angle) * radius;
        let y = Math.sin(angle) * radius;
        tag.style.transform = `translate(${x}px, ${y}px)`;
        requestAnimationFrame(animate);
    }
    animate();
})







