const projects = [
    { id: 1, category: "Text Effects", title: "Glowing Text Animation", description: "Create glowing neon text animation." },
    { id: 2, category: "Text Effects", title: "Typing Text Effect", description: "Typing and deleting text animation." },
    { id: 3, category: "Scroll Effects", title: "Parallax Effect", description: "Smooth parallax scrolling website." },
    { id: 4, category: "Interactive", title: "Expandable Card", description: "Click to expand card animation." },
    { id: 5, category: "Navigation", title: "Scroll Spy Menu", description: "Navbar section highlight on scroll." },
    { id: 6, category: "Visual Effects", title: "3D Cube Animation", description: "Rotating 3D cube using JS." },
    { id: 7, category: "Scroll Effects", title: "Fade Scroll", description: "Fade-in elements on scroll." },
    { id: 8, category: "Interactive", title: "Image Hover Zoom", description: "Zoom animation on hover." },
    { id: 9, category: "Navigation", title: "Sticky Navbar", description: "Navbar shrink on scroll." },
    { id: 10, category: "Text Effects", title: "Letter Split Animation", description: "Split letters using JS." },
    { id: 11, category: "Visual Effects", title: "Particle Background", description: "Animated particles." },
    { id: 12, category: "Scroll Effects", title: "Horizontal Scroll", description: "Scroll horizontally." },
    { id: 13, category: "Interactive", title: "Drag & Drop", description: "Draggable items." },
    { id: 14, category: "Visual Effects", title: "Glassmorphism", description: "Glass blur effect." },
    { id: 15, category: "Navigation", title: "Sidebar Menu", description: "Animated sidebar." },
    { id: 16, category: "Interactive", title: "Like Button", description: "Heart animation." },
    { id: 17, category: "Text Effects", title: "Wave Text", description: "Wave style text." },
    { id: 18, category: "Scroll Effects", title: "Image Reveal", description: "Scroll reveal animation." },
    { id: 19, category: "Visual Effects", title: "Smoke Text", description: "Smoke disappearing text." },
    { id: 20, category: "Interactive", title: "Ripple Button", description: "Ripple effect on click." },
    { id: 21, category: "Navigation", title: "Hamburger Menu", description: "Animated menu." },
    { id: 22, category: "Text Effects", title: "Gradient Text", description: "Animated gradient." },
    { id: 23, category: "Scroll Effects", title: "Zoom Scroll", description: "Zoom animation." },
    { id: 24, category: "Visual Effects", title: "Firefly Background", description: "Firefly particles." },
    { id: 25, category: "Interactive", title: "Music Visualizer", description: "Visualizer bars." },
    { id: 26, category: "Navigation", title: "Section Indicator", description: "Scroll indicator." },
    { id: 27, category: "Scroll Effects", title: "Progress Bar", description: "Page scroll progress." },
    { id: 28, category: "Interactive", title: "Custom Cursor", description: "Animated cursor." },
    { id: 29, category: "Visual Effects", title: "Glitch Text", description: "Glitch animation." },
    { id: 30, category: "Text Effects", title: "Split Reveal", description: "Clip-reveal text." }
];

const projectList = document.getElementById('projectList');
const searchInput = document.getElementById('searchInput');
const filterButtons = document.querySelectorAll('.filter-btn');


function displayProjects(lists) {
    projectList.innerHTML = '';

    lists.forEach((list, i) => {
        projectList.innerHTML += `
            <div class="project-card">
                <h2>Project #${list.id}  — ${list.title}</h2>
                <p>${list.description}</p>
                <a href='#' class='view-btn'>View Project</a>
            </div>
        `;
    });
}

displayProjects(projects)


// search function

searchInput.addEventListener('input', () => {
    const text = searchInput.value.toLowerCase();

    const filtered = projects.filter(p => 
        p.title.toLowerCase().includes(text) || p.category.toLowerCase().includes(text)
    )

    displayProjects(filtered)
})


// category filter

filterButtons.forEach(btn => {
    btn.addEventListener('click', ()=> {
        document.querySelector('.filter-btn.active').classList.remove('active');
    btn.classList.add('active')

    const filter = btn.dataset.filter;

    if(filter === 'All'){
        displayProjects(projects)
    } else{
        const filtered = projects.filter(p => p.category === filter);
        console.log(filtered)
        displayProjects(filtered);
    }
    })


    

})







