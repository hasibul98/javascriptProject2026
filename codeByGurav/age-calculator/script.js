const dateInput = document.getElementById('date-input');
const calculateBtn = document.getElementById('calculateBtn');
const years = document.getElementById('years');
const months = document.getElementById('months');
const days = document.getElementById('days');


calculateBtn.addEventListener('click', ()=> {
    let inpDate = dateInput.value;
    if(!inpDate){
        alert('please select a date first!');
        return;
    }
    calculateAge(inpDate)
})


const calculateAge = (dob) => {
    let currentDate = new Date();
    let userDob = new Date(dob);
    let year = currentDate.getFullYear() - userDob.getFullYear();
    let month = currentDate.getMonth() - userDob.getMonth();
    let day = currentDate.getDate() - userDob.getDate();

    if(day < 0){
        month--;
        day += new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();
    }
    if(month < 0){
        year--;
        month += 12;
    }
    years.innerText = year;
    months.innerText = month;
    days.innerText = day;

}








