const checkboxes = document.querySelectorAll('.inbox input[type="checkbox"]');

let lastChecked = null;

function updateColor(checkbox) {
    checkbox.nextElementSibling.style.color = checkbox.checked ? 'red' : 'black';
}

function handleCheck(e) {
    // Shift + Click logic
    let boxes = [...checkboxes];
    if (e.shiftKey && lastChecked) {
        const boxes = [...checkboxes];
        const start = boxes.indexOf(this);
        console.log('start',start);
        const end = boxes.indexOf(lastChecked);
        console.log('end', end)

        const [min, max] = [Math.min(start, end), Math.max(start, end)];

        boxes.slice(min, max + 1).forEach(box => {
            box.checked = this.checked;
            updateColor(box);
        });
    }
    // console.log('start', boxes.indexOf(this))
    // console.log('end', boxes.indexOf(lastChecked))

    updateColor(this);
    lastChecked = this;
    console.log('last checked',lastChecked)
}

// single event binding
checkboxes.forEach(checkbox => {
    checkbox.addEventListener('click', handleCheck);
});