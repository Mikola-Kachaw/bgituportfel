        // Подкатегории для каждой категории
        const subcategories = {
            'study': [
                {value: '', text: 'Выберите подкатегорию'},
                {value: 'performance_excellent', text: 'Успеваемость "отлично"'},
                {value: 'performance_good', text: 'Успеваемость "хорошо" и "отлично"'},
                {value: 'olympiads_international', text: 'Олимпиады международные'},
                {value: 'olympiads_russian', text: 'Олимпиады российские/областные'},
                {value: 'olympiads_university', text: 'Олимпиады вузовские'},
                {value: 'additional_programs', text: 'Дополнительные образовательные программы'}
            ],
            'research': [
                {value: '', text: 'Выберите подкатегорию'},
                {value: 'science_competitions_international', text: 'Научные конкурсы международные'},
                {value: 'science_competitions_russian', text: 'Научные конкурсы российские/областные'},
                {value: 'science_competitions_university', text: 'Научные конкурсы вузовские'},
                {value: 'publications_vak', text: 'Публикации ВАК/РИНЦ'},
                {value: 'publications_other', text: 'Публикации прочие'},
                {value: 'conferences', text: 'Участие в научных конференциях'}
            ],
            'creative': [
                {value: '', text: 'Выберите подкатегорию'},
                {value: 'competitions_international', text: 'Конкурсы международные'},
                {value: 'competitions_russian', text: 'Конкурсы российские/областные'},
                {value: 'competitions_university', text: 'Конкурсы вузовские'}
            ],
            'sport': [
                {value: '', text: 'Выберите подкатегорию'},
                {value: 'msmk', text: 'Мастер спорта международного класса'},
                {value: 'team_russia', text: 'Член Сборной России'},
                {value: 'competitions_world', text: 'Чемпионат мира'},
                {value: 'competitions_russia', text: 'Чемпионат России'},
                {value: 'competitions_cfo', text: 'Чемпионат ЦФО'},
                {value: 'competitions_region', text: 'Чемпионат области'},
                {value: 'sport_promo', text: 'Популяризация спорта'}
            ],
            'social': [
                {value: '', text: 'Выберите подкатегорию'},
                {value: 'starosta', text: 'Староста'},
                {value: 'profsoyuz', text: 'Профсоюзная работа/студсовет'},
                {value: 'volunteer', text: 'Волонтерская деятельность'},
                {value: 'proforientation', text: 'Профориентационная работа/летние лагеря'}
            ]
        };

        // Массив выбранных файлов
        let selectedFiles = [];

        // Функции для работы с модальными окнами
        function toggleDropdown() {
            document.getElementById("dropdown-menu").classList.toggle("show");
        }

        function showCertificateModal(title, description, imageUrl) {
            document.getElementById('certificate-title').textContent = title;
            document.getElementById('certificate-description').textContent = description;

            const imageContainer = document.getElementById('certificate-image-container');
            imageContainer.innerHTML = '';
            if (imageUrl) {
                const img = document.createElement('img');
                img.src = '/' + imageUrl;
                img.style.maxWidth = '100%';
                img.style.maxHeight = '400px';
                img.style.borderRadius = '10px';
                img.style.objectFit = 'contain';
                imageContainer.appendChild(img);
            }

            document.getElementById('certificateModal').style.display = 'block';
        }

        function openAddCertificateModal() {
            document.getElementById('addCertificateModal').style.display = 'flex';
            resetForm();
        }

        function closeAddCertificateModal() {
            document.getElementById('addCertificateModal').style.display = 'none';
            resetForm();
        }

        function resetForm() {
            document.getElementById('addCertificateForm').reset();
            selectedFiles = [];
            updateFilePreview();
            updateSubmitButton();
            updateSubcategories();
        }

        // Обновление подкатегорий при изменении категории
        document.getElementById('certificateCategory').addEventListener('change', function() {
            updateSubcategories();
        });

        function updateSubcategories() {
            const category = document.getElementById('certificateCategory').value;
            const subcategorySelect = document.getElementById('certificateSubcategory');

            subcategorySelect.innerHTML = '';

            if (category && subcategories[category]) {
                subcategories[category].forEach(option => {
                    const opt = document.createElement('option');
                    opt.value = option.value;
                    opt.textContent = option.text;
                    subcategorySelect.appendChild(opt);
                });
            } else {
                const opt = document.createElement('option');
                opt.value = '';
                opt.textContent = 'Выберите подкатегорию';
                subcategorySelect.appendChild(opt);
            }
        }

        // Работа с файлами
        const dropArea = document.getElementById('dropArea');
        const fileInput = document.getElementById('fileInput');

        dropArea.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', function(e) {
            handleFiles(e.target.files);
        });

        dropArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropArea.classList.add('dragover');
        });

        dropArea.addEventListener('dragleave', () => {
            dropArea.classList.remove('dragover');
        });

        dropArea.addEventListener('drop', (e) => {
            e.preventDefault();
            dropArea.classList.remove('dragover');

            if (e.dataTransfer.files.length) {
                handleFiles(e.dataTransfer.files);
            }
        });

        function handleFiles(files) {
            const newFiles = Array.from(files).filter(file => {
                // Проверка формата файла
                const validTypes = [
                    'application/pdf',
                    'image/jpeg',
                    'image/jpg',
                    'image/png',
                    'image/gif',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                ];
                return validTypes.includes(file.type) ||
                       file.name.toLowerCase().endsWith('.pdf') ||
                       file.name.toLowerCase().endsWith('.jpg') ||
                       file.name.toLowerCase().endsWith('.jpeg') ||
                       file.name.toLowerCase().endsWith('.png') ||
                       file.name.toLowerCase().endsWith('.doc') ||
                       file.name.toLowerCase().endsWith('.docx');
            });

            // Добавляем только новые файлы
            newFiles.forEach(newFile => {
                const existingFile = selectedFiles.find(f =>
                    f.name === newFile.name && f.size === newFile.size
                );
                if (!existingFile) {
                    selectedFiles.push(newFile);
                }
            });

            updateFilePreview();
            updateSubmitButton();
        }

        function removeFile(index) {
            selectedFiles.splice(index, 1);
            updateFilePreview();
            updateSubmitButton();
        }

        function updateFilePreview() {
            const previewList = document.getElementById('filePreviewList');
            const previewContainer = document.getElementById('filePreviewContainer');
            const imagePreview = document.getElementById('imagePreview');
            const documentPreview = document.getElementById('documentPreview');

            previewList.innerHTML = '';

            if (selectedFiles.length === 0) {
                previewContainer.style.display = 'none';
                imagePreview.style.display = 'none';
                documentPreview.style.display = 'none';
                return;
            }

            previewContainer.style.display = 'block';

            selectedFiles.forEach((file, index) => {
                const fileItem = document.createElement('div');
                fileItem.className = 'file-preview-item';

                const fileExt = file.name.split('.').pop().toLowerCase();
                const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(fileExt);
                const isPDF = fileExt === 'pdf';
                const isWord = ['doc', 'docx'].includes(fileExt);

                let iconText = '📄';
                if (isImage) iconText = '🖼️';
                if (isPDF) iconText = '📕';
                if (isWord) iconText = '📝';

                fileItem.innerHTML = `
                    <div class="file-preview-icon">${iconText}</div>
                    <div class="file-preview-info">
                        <div class="file-preview-name">${file.name}</div>
                        <div class="file-preview-size">${formatFileSize(file.size)}</div>
                    </div>
                    <button class="file-preview-remove" onclick="removeFile(${index})">&times;</button>
                `;

                // Добавляем обработчик для предпросмотра
                if (isImage) {
                    fileItem.style.cursor = 'pointer';
                    fileItem.addEventListener('click', () => previewImage(file));
                } else if (isPDF || isWord) {
                    fileItem.style.cursor = 'pointer';
                    fileItem.addEventListener('click', () => previewDocument(file));
                }

                previewList.appendChild(fileItem);
            });
        }

        function previewImage(file) {
            const imagePreview = document.getElementById('imagePreview');
            const previewImage = document.getElementById('previewImage');
            const documentPreview = document.getElementById('documentPreview');

            documentPreview.style.display = 'none';

            const reader = new FileReader();
            reader.onload = function(e) {
                previewImage.src = e.target.result;
                imagePreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }

        function previewDocument(file) {
            const imagePreview = document.getElementById('imagePreview');
            const documentPreview = document.getElementById('documentPreview');
            const previewDocument = document.getElementById('previewDocument');

            imagePreview.style.display = 'none';

            // Для PDF файлов
            if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    // Создаем объект URL для PDF
                    const pdfUrl = e.target.result;
                    previewDocument.src = pdfUrl;
                    documentPreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
            // Для Word документов - показываем сообщение
            else if (file.type.includes('word') || file.name.toLowerCase().endsWith('.doc') || file.name.toLowerCase().endsWith('.docx')) {
                documentPreview.innerHTML = `
                    <div style="text-align: center; padding: 40px;">
                        <div style="font-size: 48px; margin-bottom: 20px;">📝</div>
                        <h3 style="color: #1867AA;">Документ Word</h3>
                        <p>${file.name}</p>
                        <p style="color: #666; margin-top: 20px;">Для просмотра содержимого необходимо скачать файл</p>
                    </div>
                `;
                documentPreview.style.display = 'block';
            }
        }

        function formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

        function updateSubmitButton() {
            const title = document.getElementById('certificateTitle').value.trim();
            const category = document.getElementById('certificateCategory').value;
            const hasFiles = selectedFiles.length > 0;

            const submitBtn = document.getElementById('submitBtn');
            submitBtn.disabled = !(title && category && hasFiles);
        }

        // Обновление состояния кнопки при вводе
        document.getElementById('certificateTitle').addEventListener('input', updateSubmitButton);
        document.getElementById('certificateCategory').addEventListener('change', updateSubmitButton);

        // Обработка формы
        document.getElementById('addCertificateForm').addEventListener('submit', function(e) {
            e.preventDefault();

            // Проверка обязательных полей
            const title = document.getElementById('certificateTitle').value.trim();
            const category = document.getElementById('certificateCategory').value;

            if (!title) {
                alert('Пожалуйста, введите название грамоты');
                return;
            }

            if (!category) {
                alert('Пожалуйста, выберите категорию');
                return;
            }

            if (selectedFiles.length === 0) {
                alert('Пожалуйста, выберите файл грамоты');
                return;
            }

            // Создаем FormData для отправки
            const formData = new FormData(this);

            // Добавляем все файлы
            selectedFiles.forEach(file => {
                formData.append('files[]', file);
            });

            // Отправляем форму
            fetch(this.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => {
                if (response.redirected) {
                    window.location.href = response.url;
                } else {
                    return response.json();
                }
            })
            .then(data => {
                if (data && data.success) {
                    closeAddCertificateModal();
                    location.reload();
                } else if (data && data.error) {
                    alert('Ошибка: ' + data.error);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Произошла ошибка при отправке формы');
            });
        });

        // Закрытие модальных окон
        window.addEventListener('click', function(event) {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
            }
            if (event.target.id === 'addCertificateModal') {
                closeAddCertificateModal();
            }
        });

        // Обновление статуса заявки
        function updateApplicationStatus(applicationId, status) {
            fetch("{{ url_for('update_application_status') }}", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `application_id=${applicationId}&status=${status}`
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    location.reload();
                } else {
                    alert('Ошибка: ' + data.error);
                }
            });
        }

        // Инициализация при загрузке
        document.addEventListener('DOMContentLoaded', function() {
            updateSubcategories();
        });
