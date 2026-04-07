(function(){

    const customerImage = document.querySelector('#customer-img');
    const customerName = document.querySelector('#customer-name');
    const customerText = document.querySelector('#customer-text');
    const btn = document.querySelectorAll('.btn');

    let index = 0;
    const customers = [];

    function Customer(img, name, text){
        this.img = img;
        this.name = name;
        this.text = text;
    }

    // Create all customers
    function createCustomer(img, name, text){
        let Img = `./img/${img}.avif`;
        let customer = new Customer(Img, name, text);
        customers.push(customer);
    }

    // Add all customers to the array
    createCustomer(0, 'john', '000000 Lorem ipsum dolor sit amet consectetur adipisicing elit. Optio impedit dolorem voluptate quam quia dolore, esse ad ipsa unde corporis.');
    createCustomer(1, 'amy', '1111 Lorem ipsum dolor sit amet consectetur adipisicing elit. Optio impedit dolorem voluptate quam quia dolore, esse ad ipsa unde corporis.');
    createCustomer(2, 'shila', '2222 Lorem ipsum dolor sit amet consectetur adipisicing elit. Optio impedit dolorem voluptate quam quia dolore, esse ad ipsa unde corporis.');
    createCustomer(3, 'nila', '333 Lorem ipsum dolor sit amet consectetur adipisicing elit. Optio impedit dolorem voluptate quam quia dolore, esse ad ipsa unde corporis.');
    createCustomer(4, 'comola', '444 Lorem ipsum dolor sit amet consectetur adipisicing elit. Optio impedit dolorem voluptate quam quia dolore, esse ad ipsa unde corporis.');
    createCustomer(5, 'lubina', '555 Lorem ipsum dolor sit amet consectetur adipisicing elit. Optio impedit dolorem voluptate quam quia dolore, esse ad ipsa unde corporis.');

    // Add event listeners to buttons
    btn.forEach(function(button){
        button.addEventListener('click', function(e){
            e.preventDefault(); // Prevent default anchor click behavior
            
            // Check if prev button was clicked
            if(e.target.parentElement.classList.contains('prevBtn') || e.target.classList.contains('prevBtn')){
                if(index === 0){
                    index = customers.length;
                }
                index--;
                customerImage.src = customers[index].img;
                customerName.textContent = customers[index].name;
                customerText.textContent = customers[index].text;
            }

            // Check if next button was clicked
            if(e.target.parentElement.classList.contains('nextBtn') || e.target.classList.contains('nextBtn')){
                index++;
                if(index === customers.length){
                    index = 0;
                }
                
                customerImage.src = customers[index].img;
                customerName.textContent = customers[index].name;
                customerText.textContent = customers[index].text;
            }
        })
    })

})();