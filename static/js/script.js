document.addEventListener('DOMContentLoaded', function() {
    // Обработка drag and drop для всех областей
    document.querySelectorAll('.drop-area').forEach(dropArea => {
        const fileInput = dropArea.querySelector('input[type="file"]');

        // Обработка клика по области
        dropArea.addEventListener('click', () => {
            fileInput.click();
        });

        // Обработка drag and drop
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, unhighlight, false);
        });

        function highlight() {
            dropArea.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
        }

        function unhighlight() {
            dropArea.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        }

        // Обработка загруженного файла
        dropArea.addEventListener('drop', handleDrop, false);
        fileInput.addEventListener('change', handleFiles);

        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            handleFiles({ target: { files } });
        }

        function handleFiles(e) {
        const files = e.target.files;
        if (files.length) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const preview = dropArea.querySelector('.preview') || document.createElement('div');
                    preview.className = 'preview';
                    preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;

                    const existingPreview = dropArea.querySelector('.preview');
                    if (existingPreview) {
                        dropArea.replaceChild(preview, existingPreview);
                    } else {
                        const textElements = dropArea.querySelectorAll('.drop-text, .drop-icon');
                        textElements.forEach(el => el.style.display = 'none');
                        dropArea.appendChild(preview);
                    }
                };
                reader.readAsDataURL(file);
            }
        }
    }
    });

    // Обработка переключения видимости пароля
    document.querySelectorAll('.toggle-password').forEach(toggle => {
        const passwordInput = toggle.closest('.input-group').querySelector('input[type="password"], input[type="text"]');
        const eyeIcon = toggle.querySelector('.eye-icon');
        const eyeClosedIcon = toggle.querySelector('.eye-closed-icon');
        
        toggle.addEventListener('click', function() {
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
            
            if (eyeIcon) eyeIcon.style.display = isPassword ? 'none' : 'block';
            if (eyeClosedIcon) eyeClosedIcon.style.display = isPassword ? 'block' : 'none';
        });
    });

    // Обработка счетчика символов
    const descriptionInput = document.querySelector('.description-input');
    if (descriptionInput) {
        const charCount = document.getElementById('char-count');
        
        descriptionInput.addEventListener('input', function() {
            const currentLength = this.value.length;
            if (charCount) {
                charCount.textContent = currentLength;
                
                if (currentLength > 480) {
                    charCount.style.color = '#f44336';
                } else {
                    charCount.style.color = '#1867AA';
                }
            }
        });
    }

    // Обновление приветствия в зависимости от времени суток
    const greetingElement = document.getElementById('greeting');
    if (greetingElement) {
        const hour = new Date().getHours();
        let greeting;
        
        if (hour < 6) greeting = 'Доброй ночи';
        else if (hour < 12) greeting = 'Доброе утро';
        else if (hour < 18) greeting = 'Добрый день';
        else greeting = 'Добрый вечер';
        
        greetingElement.textContent = greeting;
    }
});

// Функция для отображения сообщений об ошибках
function showError(message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'alert alert-danger';
    errorElement.textContent = message;
    
    const container = document.querySelector('.container') || document.body;
    container.prepend(errorElement);
    
    setTimeout(() => {
        errorElement.remove();
    }, 5000);
}

document.addEventListener('DOMContentLoaded', function() {
    // Обработка переключения видимости пароля
    document.querySelectorAll('.toggle-password').forEach(toggle => {
        const passwordInput = toggle.closest('.password-input').querySelector('input');
        const eyeIcon = toggle.querySelector('.eye-icon');
        const eyeClosedIcon = toggle.querySelector('.eye-closed-icon');

        toggle.addEventListener('click', function() {
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';

            if (eyeIcon) eyeIcon.style.display = isPassword ? 'none' : 'block';
            if (eyeClosedIcon) eyeClosedIcon.style.display = isPassword ? 'block' : 'none';
        });
    });
});
// Modal functionality
function showRegistrationModal() {
    document.getElementById('registration-modal').style.display = 'block';
    document.getElementById('first-part').style.display = 'block';
}

function closeRegistrationModal() {
    document.getElementById('registration-modal').style.display = 'none';
}

// Check URL for registration success parameter
window.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('registration') === 'success') {
        showRegistrationModal();
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
});

// Modal form handling
document.addEventListener('DOMContentLoaded', function() {
    const nextButton = document.getElementById('next-button');
    const firstPart = document.getElementById('first-part');
    const secondPart = document.getElementById('second-part');
    const form = document.getElementById('first-form');
    const inputs = form.querySelectorAll('input, select');

    function validateForm() {
        let isValid = true;

        inputs.forEach(input => {
            const errorElement = document.getElementById(`${input.id}-error`);

            if (!input.value.trim()) {
                errorElement.textContent = 'Это поле обязательно для заполнения';
                errorElement.style.display = 'block';
                input.style.borderColor = '#f44336';
                isValid = false;
            } else {
                errorElement.style.display = 'none';
                input.style.borderColor = '#ddd';
            }
        });

        return isValid;
    }

    nextButton.addEventListener('click', function() {
        if (validateForm()) {
            firstPart.style.display = 'none';
            secondPart.style.display = 'block';
        }
    });

    inputs.forEach(input => {
        input.addEventListener('input', function() {
            const errorElement = document.getElementById(`${input.id}-error`);
            errorElement.style.display = 'none';
            input.style.borderColor = '#ddd';
        });
    });

    const categoryButtons = document.querySelectorAll('.category-btn');
    const submitButton = document.getElementById('submit-categories');
    const errorMessage = document.getElementById('categories-error');
    let selectedCategories = [];

    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            const category = this.getAttribute('data-category');

            if (this.classList.contains('selected')) {
                this.classList.remove('selected');
                selectedCategories = selectedCategories.filter(item => item !== category);
            } else {
                this.classList.add('selected');
                selectedCategories.push(category);
            }

            errorMessage.textContent = '';
        });
    });

    submitButton.addEventListener('click', function() {
        if (selectedCategories.length === 0) {
            errorMessage.textContent = 'Пожалуйста, выберите хотя бы одну категорию';
            return;
        }

        secondPart.style.display = 'none';
        document.getElementById('third-part').style.display = 'block';
    });

    document.getElementById('home-button').addEventListener('click', function() {
        closeRegistrationModal();
    });

    // Close modal when clicking outside
    document.getElementById('registration-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeRegistrationModal();
        }
    });
});