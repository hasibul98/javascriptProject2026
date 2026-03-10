const slider = document.querySelector(".slider");
const cards = document.querySelectorAll(".card");

slider.addEventListener("scroll", () => {
    const center = slider.scrollLeft + slider.offsetWidth / 2;

    cards.forEach(card => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const distance = Math.abs(center - cardCenter);

        card.classList.toggle("active", distance < 130);
    });
});