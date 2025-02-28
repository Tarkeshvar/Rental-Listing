// Example starter JavaScript for disabling form submissions if there are invalid fields
(function () {
    'use strict'
  
    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    var forms = document.querySelectorAll('.needs-validation')
  
    // Loop over them and prevent submission
    Array.prototype.slice.call(forms)
      .forEach(function (form) {
        form.addEventListener('submit', function (event) {
          if (!form.checkValidity()) {
            event.preventDefault()
            event.stopPropagation()
          }
  
          form.classList.add('was-validated')
        }, false)
      })
  })()

// // Script for lg page
// const wrapper = document.querySelector('.wrapper');
// const registerLink = document.querySelector('.register-link');
// const loginLink = document.querySelector('.login-link');

// registerLink.onclick = () => {
//     wrapper.classList.add('active'); // Adds "active" class on register click
// };

// loginLink.onclick = () => {
//     wrapper.classList.remove('active'); // Removes "active" class on login click
// };

// script for sg page
const container = document.querySelector('.container');
const registerBtn = document.querySelector('.register-btn');
const loginBtn = document.querySelector('.login-btn');

registerBtn.addEventListener("click", ()=>{
    container.classList.add("active");
});


loginBtn.addEventListener("click", ()=>{
    container.classList.remove("active");
});
