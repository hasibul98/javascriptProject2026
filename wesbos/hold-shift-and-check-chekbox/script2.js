const checkboxes = document.querySelectorAll('.inbox input[type="checkbox"]');

let lastChecked = null;

function updateColor(checkbox) {
    checkbox.nextElementSibling.style.color = checkbox.checked ? 'red' : 'black';
}

function handleCheck(e) {
    // Shift + Click logic
    if (e.shiftKey && lastChecked) {
        const boxes = [...checkboxes];
        const start = boxes.indexOf(this);
        const end = boxes.indexOf(lastChecked);

        const [min, max] = [Math.min(start, end), Math.max(start, end)];

        boxes.slice(min, max + 1).forEach(box => {
            box.checked = this.checked;
            updateColor(box);
        });
    }

    updateColor(this);
    lastChecked = this;
}

// single event binding
checkboxes.forEach(checkbox => {
    checkbox.addEventListener('click', handleCheck);
});