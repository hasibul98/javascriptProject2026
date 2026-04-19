let checkboxes = document.querySelectorAll('.inbox input[type = "checkbox"]')

let lastChecked;

function handleCheck(e){

    // console.log(this)

     if (e.shiftKey && lastChecked) {
        const startIndex = [...checkboxes].indexOf(this);
        const endIndex = [...checkboxes].indexOf(lastChecked);
        
        const start = Math.min(startIndex, endIndex);
        const end = Math.max(startIndex, endIndex);

        for (let i = start; i <= end; i++) {
            const checkbox = checkboxes[i];
            checkbox.checked = this.checked;
            if(this.checked){
                checkbox.nextElementSibling.style.color = 'red';
            } else {
                checkbox.nextElementSibling.style.color = 'black';
            }
        }
   
    }

    lastChecked = this;


  
}



checkboxes.forEach(checkbox =>{
   
    checkbox.addEventListener('click', ()=> {
       
       

        if(checkbox.checked == true){
            checkbox.nextElementSibling.style.color= 'red'
           
            
        } else{
            checkbox.nextElementSibling.style.color= 'black'
        }

       
        
        
        
    })
})




checkboxes.forEach(checkbox => checkbox.addEventListener('click', handleCheck));