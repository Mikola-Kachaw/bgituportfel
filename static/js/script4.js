        // Глобальные переменные
        let selectedFiles = [];

        // Функции для работы с модальными окнами
        function toggleDropdown() {
            document.getElementById("dropdown-menu").classList.toggle("show");
        }

        function closeModal(modalId) {
            document.getElementById(modalId).style.display = 'none';
            document.body.style.overflow = 'auto';
        }

        function openModal(modalId) {
            document.getElementById(modalId).style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }

        // Просмотр грамоты
        function showCertificateModal(certId, title, description, fileUrl) {
            document.getElementById('viewCertificateTitle').textContent = title;
            document.getElementById('viewCertificateDescription').textContent = description || 'Нет описания';

            const imageContainer = document.getElementById('viewCertificateImageContainer');
            const pdfContainer = document.getElementById('viewCertificatePdfContainer');
            const pdfViewer = document.getElementById('pdfViewer');

            // Очищаем контейнеры
            imageContainer.innerHTML = '';
            pdfContainer.style.display = 'none';

            // Проверяем тип файла
            const isPdf = fileUrl.toLowerCase().endsWith('.pdf');

            if (isPdf) {
                // Для PDF файлов
                pdfViewer.src = fileUrl + '#toolbar=0&navpanes=0&scrollbar=0';
                pdfContainer.style.display = 'block';
            } else {
                // Для изображений
                if (fileUrl && fileUrl !== 'None') {
                    const img = document.createElement('img');
                    img.src = fileUrl;
                    img.style.maxWidth = '100%';
                    img.style.maxHeight = '500px';
                    img.style.borderRadius = '10px';
                    img.style.objectFit = 'contain';
                    imageContainer.appendChild(img);
                } else {
                    imageContainer.innerHTML = '<p style="color: #666;">Изображение не загружено</p>';
                }
            }

            openModal('viewCertificateModal');
        }

        // Редактирование грамоты
        function openEditCertificateModal(certId, title, description) {
            document.getElementById('editCertificateId').value = certId;
            document.getElementById('editCertificateTitle').value = title;
            document.getElementById('editCertificateDescription').value = description || '';
            openModal('editCertificateModal');
        }

        // Добавление грамоты
        function openAddCertificateModal() {
            openModal('addCertificateModal');
            resetAddCertificateForm();
        }

        function closeAddCertificateModal() {
            closeModal('addCertificateModal');
            resetAddCertificateForm();
        }

        function resetAddCertificateForm() {
            document.getElementById('addCertificateForm').reset();
            selectedFiles = [];
            updateFilePreview();
            hideAllPreviews();
        }

        // Скрыть все предпросмотры
        function hideAllPreviews() {
            document.getElementById('imagePreview').style.display = 'none';
            document.getElementById('pdfPreview').style.display = 'none';
        }

        // Работа с файлами
        document.getElementById('dropArea').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });

        document.getElementById('fileInput').addEventListener('change', function(e) {
            handleFiles(e.target.files);
        });

        document.getElementById('dropArea').addEventListener('dragover', (e) => {
            e.preventDefault();
            document.getElementById('dropArea').classList.add('dragover');
        });

        document.getElementById('dropArea').addEventListener('dragleave', () => {
            document.getElementById('dropArea').classList.remove('dragover');
        });

        document.getElementById('dropArea').addEventListener('drop', (e) => {
            e.preventDefault();
            document.getElementById('dropArea').classList.remove('dragover');
            handleFiles(e.dataTransfer.files);
        });

        function handleFiles(files) {
            const validTypes = [
                'image/jpeg',
                'image/jpg',
                'image/png',
                'image/gif',
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ];

            // Очищаем предыдущие файлы
            selectedFiles = [];

            Array.from(files).forEach(file => {
                if (validTypes.includes(file.type) ||
                    file.name.toLowerCase().endsWith('.pdf') ||
                    file.name.toLowerCase().endsWith('.doc') ||
                    file.name.toLowerCase().endsWith('.docx')) {

                    selectedFiles.push(file);
                }
            });

            updateFilePreview();

            // Показываем предпросмотр первого файла
            if (selectedFiles.length > 0) {
                previewFile(selectedFiles[0]);
            }
        }

        function removeFile(index) {
            selectedFiles.splice(index, 1);
            updateFilePreview();

            // Показываем предпросмотр нового первого файла, если есть
            if (selectedFiles.length > 0) {
                previewFile(selectedFiles[0]);
            } else {
                hideAllPreviews();
            }
        }

        function updateFilePreview() {
            const previewList = document.getElementById('filePreviewList');
            const previewContainer = document.getElementById('filePreviewContainer');

            previewList.innerHTML = '';

            if (selectedFiles.length === 0) {
                previewContainer.style.display = 'none';
                return;
            }

            previewContainer.style.display = 'block';

            selectedFiles.forEach((file, index) => {
                const fileItem = document.createElement('div');
                fileItem.className = 'file-preview-item';

                const isImage = file.type.startsWith('image/');
                const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
                const isWord = file.type.includes('word') || file.name.toLowerCase().endsWith('.doc') || file.name.toLowerCase().endsWith('.docx');

                let icon = '📄';
                if (isImage) icon = '🖼️';
                if (isPDF) icon = '📕';
                if (isWord) icon = '📝';

                fileItem.innerHTML = `
                    <div class="file-preview-icon">${icon}</div>
                    <div class="file-preview-info">
                        <div class="file-preview-name">${file.name}</div>
                        <div class="file-preview-size">${formatFileSize(file.size)}</div>
                    </div>
                    <button class="file-preview-remove" onclick="removeFile(${index})">&times;</button>
                `;

                // Клик по файлу показывает его предпросмотр
                fileItem.style.cursor = 'pointer';
                fileItem.addEventListener('click', (e) => {
                    e.stopPropagation();
                    previewFile(file);
                });

                previewList.appendChild(fileItem);
            });
        }

        function previewFile(file) {
            const isImage = file.type.startsWith('image/');
            const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

            hideAllPreviews();

            if (isImage) {
                const imagePreview = document.getElementById('imagePreview');
                const previewImage = document.getElementById('previewImage');

                const reader = new FileReader();
                reader.onload = function(e) {
                    previewImage.src = e.target.result;
                    imagePreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            } else if (isPDF) {
                const pdfPreview = document.getElementById('pdfPreview');
                const pdfPreviewFrame = document.getElementById('pdfPreviewFrame');

                const reader = new FileReader();
                reader.onload = function(e) {
                    // Создаем Blob URL для PDF
                    const blob = new Blob([e.target.result], {type: 'application/pdf'});
                    const blobUrl = URL.createObjectURL(blob);
                    pdfPreviewFrame.src = blobUrl + '#toolbar=0&navpanes=0&scrollbar=0';
                    pdfPreview.style.display = 'block';
                };
                reader.readAsArrayBuffer(file);
            } else {
                // Для других типов файлов показываем сообщение
                const imagePreview = document.getElementById('imagePreview');
                imagePreview.innerHTML = `
                    <div style="text-align: center; padding: 40px;">
                        <div style="font-size: 48px; margin-bottom: 20px;">📄</div>
                        <h3 style="color: #1867AA;">${file.name}</h3>
                        <p style="color: #666;">Предпросмотр недоступен для этого типа файла</p>
                    </div>
                `;
                imagePreview.style.display = 'block';
            }
        }

        function formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

        // Обработка формы добавления грамоты
        document.getElementById('addCertificateForm').addEventListener('submit', function(e) {
            const title = document.getElementById('certificateTitle').value.trim();
            const fileInput = document.getElementById('fileInput');

            if (!title) {
                e.preventDefault();
                alert('Пожалуйста, введите название грамоты');
                return;
            }

            if (selectedFiles.length === 0 && fileInput.files.length === 0) {
                e.preventDefault();
                alert('Пожалуйста, выберите файл грамоты');
                return;
            }

            // Освобождаем Blob URLs при отправке формы
            const pdfPreviewFrame = document.getElementById('pdfPreviewFrame');
            if (pdfPreviewFrame.src && pdfPreviewFrame.src.startsWith('blob:')) {
                URL.revokeObjectURL(pdfPreviewFrame.src);
            }
        });

        // Обновление статуса заявки
        function updateApplicationStatus(applicationId, status) {
            if (!confirm('Вы уверены, что хотите изменить статус заявки?')) {
                return;
            }

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
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Произошла ошибка при обновлении статуса');
            });
        }

        // Закрытие модальных окон при клике вне контента
        window.addEventListener('click', function(event) {
            const modals = ['viewCertificateModal', 'editCertificateModal'];
            modals.forEach(modalId => {
                const modal = document.getElementById(modalId);
                if (modal && event.target === modal) {
                    closeModal(modalId);
                }
            });

            const addModal = document.getElementById('addCertificateModal');
            if (addModal && event.target === addModal) {
                closeAddCertificateModal();
            }
        });

        // Закрытие модальных окон при нажатии Escape
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                closeModal('viewCertificateModal');
                closeModal('editCertificateModal');
                closeAddCertificateModal();
            }
        });

        // Инициализация при загрузке страницы
        document.addEventListener('DOMContentLoaded', function() {
            // Закрытие выпадающего меню при клике вне его
            window.onclick = function(event) {
                if (!event.target.matches('button')) {
                    const dropdowns = document.getElementsByClassName("dropdown-content");
                    for (let i = 0; i < dropdowns.length; i++) {
                        const openDropdown = dropdowns[i];
                        if (openDropdown.classList.contains('show')) {
                            openDropdown.classList.remove('show');
                        }
                    }
                }
            };

            // Освобождаем Blob URLs при закрытии страницы
            window.addEventListener('beforeunload', function() {
                const pdfPreviewFrame = document.getElementById('pdfPreviewFrame');
                const pdfViewer = document.getElementById('pdfViewer');

                [pdfPreviewFrame, pdfViewer].forEach(iframe => {
                    if (iframe.src && iframe.src.startsWith('blob:')) {
                        URL.revokeObjectURL(iframe.src);
                    }
                });
            });
        });