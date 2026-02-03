// ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ И КОНСТАНТЫ =====

const ROWS_PER_PAGE = 20;
let currentPage = 1;
let totalPages = 1;
let totalStudents = 0;
let expandedRowId = null;
let currentSortColumn = 'total';
let currentSortDirection = 'desc';

// Состояние фильтров
let selectedInstitutes = new Set();
let selectedCourses = new Set();
let selectedGroups = new Set();

// DOM элементы
const tableBody = document.getElementById('tableBody');
const pageNumbers = document.getElementById('pageNumbers');
const paginationInfo = document.getElementById('paginationInfo');
const searchInput = document.getElementById('searchInput');
const firstPageBtn = document.getElementById('firstPageBtn');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const lastPageBtn = document.getElementById('lastPageBtn');
const gotoInput = document.getElementById('gotoInput');
const gotoBtn = document.getElementById('gotoBtn');
const tableHeaders = document.querySelectorAll('th[data-sort]');

// Элементы выпадающих списков
const dropdownHeader = document.getElementById('dropdownHeader');
const selectedItemsPreview = document.getElementById('selectedItemsPreview');
const dropdownArrow = document.getElementById('dropdownArrow');
const dropdownList = document.getElementById('dropdownList');

const dropdownHeader2 = document.getElementById('dropdownHeader2');
const selectedItemsPreview2 = document.getElementById('selectedItemsPreview2');
const dropdownArrow2 = document.getElementById('dropdownArrow2');
const dropdownList2 = document.getElementById('dropdownList2');

const dropdownHeader3 = document.getElementById('dropdownHeader3');
const selectedItemsPreview3 = document.getElementById('selectedItemsPreview3');
const dropdownArrow3 = document.getElementById('dropdownArrow3');
const dropdownList3 = document.getElementById('dropdownList3');

// ===== ФУНКЦИИ ДЛЯ ВХОДА И ВЫПАДАЮЩЕГО МЕНЮ =====

/**
 * Функция переключения выпадающего меню пользователя
 */
function toggleDropdown() {
    const dropdownMenu = document.getElementById("dropdown-menu");
    if (dropdownMenu) {
        dropdownMenu.classList.toggle("show");
    }
}

/**
 * Закрытие выпадающих меню при клике вне их области
 */
function setupDropdownCloseListeners() {
    document.addEventListener('click', function(event) {
        // Закрытие навигационного dropdown
        const dropdownMenu = document.getElementById("dropdown-menu");
        const dropdownButton = document.querySelector('.dropdown button');

        if (dropdownMenu && dropdownButton) {
            if (!dropdownButton.contains(event.target) && !dropdownMenu.contains(event.target)) {
                dropdownMenu.classList.remove("show");
            }
        }

        // Закрытие фильтров dropdown
        const dropdownElements = [
            { header: dropdownHeader, list: dropdownList },
            { header: dropdownHeader2, list: dropdownList2 },
            { header: dropdownHeader3, list: dropdownList3 }
        ];

        dropdownElements.forEach((dropdown, index) => {
            if (dropdown.header && dropdown.list) {
                if (!dropdown.header.contains(event.target) && !dropdown.list.contains(event.target)) {
                    dropdown.list.classList.remove('show');
                    dropdown.header.classList.remove('active');
                    const arrows = [dropdownArrow, dropdownArrow2, dropdownArrow3];
                    if (arrows[index]) {
                        arrows[index].classList.remove('up');
                    }
                }
            }
        });
    });
}

/**
 * Обновление приветствия
 */
function updateGreeting() {
    const hour = new Date().getHours();
    let greeting;

    if (hour < 6) greeting = 'Доброй ночи';
    else if (hour < 12) greeting = 'Доброе утро';
    else if (hour < 18) greeting = 'Добрый день';
    else greeting = 'Добрый вечер';

    const greetingElement = document.getElementById('greeting');
    if (greetingElement) {
        greetingElement.textContent = greeting;
    }
}

// ===== API ФУНКЦИИ =====

/**
 * Загрузка данных студентов с сервера
 */
async function loadStudentsData() {
    try {
        showLoading();

        // Формируем параметры запроса
        const params = new URLSearchParams({
            page: currentPage,
            per_page: ROWS_PER_PAGE,
            sort_by: currentSortColumn,
            sort_order: currentSortDirection,
            search: searchInput.value.trim()
        });

        // Добавляем фильтры по институтам
        if (selectedInstitutes.size > 0) {
            Array.from(selectedInstitutes).forEach(inst => {
                params.append('institute', inst);
            });
        }

        // Добавляем фильтры по курсам
        if (selectedCourses.size > 0) {
            Array.from(selectedCourses).forEach(course => {
                params.append('course', course);
            });
        }

        // Добавляем фильтры по группам
        if (selectedGroups.size > 0) {
            Array.from(selectedGroups).forEach(group => {
                params.append('group', group);
            });
        }

        const response = await fetch(`/api/students?${params}`);

        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        const data = await response.json();

        totalStudents = data.total;
        totalPages = data.total_pages;

        // Если текущая страница больше общего количества страниц
        if (currentPage > totalPages && totalPages > 0) {
            currentPage = totalPages;
            return await loadStudentsData(); // Рекурсивно загружаем снова
        }

        hideLoading();
        return data.students;

    } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
        hideLoading();
        showError('Ошибка при загрузке данных');
        return [];
    }
}

/**
 * Загрузка детальной информации о студенте
 */
async function loadStudentDetails(studentId) {
    try {
        const response = await fetch(`/api/student/${studentId}/details`);

        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        return await response.json();

    } catch (error) {
        console.error('Ошибка при загрузке детальной информации:', error);
        return null;
    }
}

/**
 * Загрузка данных для выпадающих списков
 */
async function loadDropdownData() {
    try {
        const response = await fetch('/api/dropdown-data');

        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        return await response.json();

    } catch (error) {
        console.error('Ошибка при загрузке данных выпадающих списков:', error);
        return { institutes: [], courses: [], groups: [] };
    }
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====

function showLoading() {
    tableBody.innerHTML = `
        <tr>
            <td colspan="8" style="text-align: center; padding: 40px;">
                <div style="display: inline-block; padding: 20px;">
                    <div class="loading-spinner"></div>
                    <p style="margin-top: 10px; color: #1867AA;">Загрузка данных...</p>
                </div>
            </td>
        </tr>
    `;
}

function hideLoading() {
    // Функция скрытия загрузки
}

function showError(message) {
    tableBody.innerHTML = `
        <tr>
            <td colspan="8" style="text-align: center; padding: 40px; color: #ff4444;">
                <div style="display: inline-block; padding: 20px;">
                    <svg style="width: 40px; height: 40px; margin-bottom: 10px;" fill="#ff4444" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                    <p>${message}</p>
                    <button onclick="renderTable()" class="retry-button">
                        Попробовать снова
                    </button>
                </div>
            </td>
        </tr>
    `;
}

/**
 * Обновление индикаторов сортировки
 */
function updateSortIndicators() {
    tableHeaders.forEach(header => {
        header.classList.remove('sorted-asc', 'sorted-desc');
    });

    const activeHeader = document.querySelector(`th[data-sort="${currentSortColumn}"]`);
    if (activeHeader) {
        if (currentSortDirection === 'asc') {
            activeHeader.classList.add('sorted-asc');
        } else {
            activeHeader.classList.add('sorted-desc');
        }
    }
}

/**
 * Форматирование детальной информации
 */
function formatStudyDetails(details) {
    if (!details) return '';
    let html = '';

    details.performance?.forEach(item => {
        html += `<div class="detail-item">
            <span class="label">Успеваемость:</span>
            <span class="value">${item.name} - ${item.value}</span>
        </div>`;
    });

    details.olympiads?.forEach(item => {
        html += `<div class="detail-item">
            <span class="label">${item.name}:</span>
            <span class="value">${item.value}</span>
        </div>`;
    });

    details.additionalPrograms?.forEach(item => {
        html += `<div class="detail-item">
            <span class="label">${item.name}:</span>
            <span class="value">${item.value}</span>
        </div>`;
    });

    return html;
}

function formatResearchDetails(details) {
    if (!details) return '';
    let html = '';

    details.scienceCompetitions?.forEach(item => {
        html += `<div class="detail-item">
            <span class="label">${item.name}:</span>
            <span class="value">${item.value}</span>
        </div>`;
    });

    details.publications?.forEach(item => {
        html += `<div class="detail-item">
            <span class="label">Публикации (${item.name}):</span>
            <span class="value">${item.value}</span>
        </div>`;
    });

    details.conferences?.forEach(item => {
        html += `<div class="detail-item">
            <span class="label">${item.name}:</span>
            <span class="value">${item.value}</span>
        </div>`;
    });

    return html;
}

function formatCreativeDetails(details) {
    if (!details) return '';
    let html = '';

    details.competitions?.forEach(item => {
        html += `<div class="detail-item">
            <span class="label">${item.name}:</span>
            <span class="value">${item.value}</span>
        </div>`;
    });

    return html;
}

function formatSportDetails(details) {
    if (!details) return '';
    let html = '';

    if (details.membership) {
        html += `<div class="detail-item">
            <span class="label">Членство:</span>
            <span class="value">${details.membership}</span>
        </div>`;
    }

    details.achievements?.forEach(item => {
        html += `<div class="detail-item">
            <span class="label">${item.name}:</span>
            <span class="value">${item.value}</span>
        </div>`;
    });

    return html;
}

function formatSocialDetails(details) {
    if (!details) return '';
    let html = '';

    details.roles?.forEach(item => {
        html += `<div class="detail-item">
            <span class="label">${item.name}:</span>
            <span class="value">${item.value}</span>
        </div>`;
    });

    return html;
}

/**
 * Создание детального контента
 */
function createDetailContent(student, details) {
    const detailFlex = document.createElement('div');
    detailFlex.className = 'detail-flex';

    // Получаем ширины колонок
    const headerCells = document.querySelectorAll('thead th');
    const columnWidths = Array.from(headerCells).map(th => th.offsetWidth);

    const cellContents = [
        // Институт и курс
        `<div class="detail-item">
            <span class="label">Институт:</span>
            <span class="value">${student.institute || 'Не указано'}</span>
        </div>
        <div class="detail-item">
            <span class="label">Курс:</span>
            <span class="value">${student.course_number || 'Не указан'}</span>
        </div>`,

        // Пустая ячейка для группы
        '',

        // Учебная деятельность
        formatStudyDetails(details?.studyDetails),

        // Научно-исследовательская деятельность
        formatResearchDetails(details?.researchDetails),

        // Творческие конкурсы
        formatCreativeDetails(details?.creativeDetails),

        // Спорт
        formatSportDetails(details?.sportDetails),

        // Общественная работа
        formatSocialDetails(details?.socialDetails),

        // Грамоты
        `<a href="${details?.certificatesLink || '#'}" target="_blank" class="certificates-btn">
            Посмотреть грамоты
        </a>`
    ];

    // Создаем ячейки
    for (let i = 0; i < 8; i++) {
        const cell = document.createElement('div');
        cell.className = 'detail-cell';
        if (columnWidths[i]) {
            cell.style.width = `${columnWidths[i]}px`;
            cell.style.minWidth = `${columnWidths[i]}px`;
            cell.style.maxWidth = `${columnWidths[i]}px`;
            cell.style.flex = `0 0 ${columnWidths[i]}px`;
        }

        if (i === 7) {
            cell.classList.add('certificates-cell');
        }

        cell.innerHTML = cellContents[i];
        detailFlex.appendChild(cell);
    }

    return detailFlex;
}

// ===== ОТОБРАЖЕНИЕ ТАБЛИЦЫ =====

/**
 * Отображение таблицы
 */
async function renderTable() {
    try {
        const students = await loadStudentsData();

        if (students.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 40px;">
                        <div style="display: inline-block; padding: 20px;">
                            <svg style="width: 40px; height: 40px; margin-bottom: 10px; opacity: 0.5;" fill="#1867AA" viewBox="0 0 24 24">
                                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
                                <path d="M7 12h10v2H7zm0-4h10v2H7z"/>
                            </svg>
                            <p style="color: #666;">Нет данных для отображения</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = '';

        const headerCells = document.querySelectorAll('thead th');
        const columnWidths = Array.from(headerCells).map(th => th.offsetWidth);

        for (const student of students) {
            const studentId = student.user_id;

            // Основная строка
            const mainRow = document.createElement('tr');
            mainRow.className = `main-row ${expandedRowId === studentId ? 'expanded' : ''}`;
            mainRow.dataset.studentId = studentId;

            mainRow.innerHTML = `
                <td class="fio-column">
                    <a style="color:#1867AA" href="/profile/${studentId}">
                        ${student.fio}
                    </a>
                </td>
                <td class="group-column">${student.group_name || 'Не указана'}</td>
                <td>${student.study || 0}</td>
                <td>${student.research || 0}</td>
                <td>${student.creative || 0}</td>
                <td>${student.sport || 0}</td>
                <td>${student.social || 0}</td>
                <td class="total-column">${student.total || 0}</td>
            `;

            tableBody.appendChild(mainRow);

            // Детальная строка
            const detailRow = document.createElement('tr');
            detailRow.className = `detail-row ${expandedRowId === studentId ? 'expanded' : ''}`;
            detailRow.dataset.studentId = studentId;

            const detailCell = document.createElement('td');
            detailCell.colSpan = 8;
            detailCell.className = 'detail-content';

            // Если строка раскрыта, загружаем детальную информацию
            if (expandedRowId === studentId) {
                const details = await loadStudentDetails(studentId);
                detailCell.appendChild(createDetailContent(student, details));
            } else {
                detailCell.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">Загрузка...</div>';
            }

            detailRow.appendChild(detailCell);
            tableBody.appendChild(detailRow);

            // Обработчик клика по основной строке
            mainRow.addEventListener('click', async (e) => {
                if (e.target.tagName === 'A') return;

                const clickedStudentId = parseInt(mainRow.dataset.studentId);

                if (expandedRowId === clickedStudentId) {
                    expandedRowId = null;
                } else {
                    expandedRowId = clickedStudentId;
                }

                // Перерисовываем таблицу
                await renderTable();
            });
        }

        updateSortIndicators();
        updatePaginationInfo();

    } catch (error) {
        console.error('Ошибка при отображении таблицы:', error);
        showError('Ошибка при загрузке данных');
    }
}

function updatePaginationInfo() {
    const startIndex = (currentPage - 1) * ROWS_PER_PAGE + 1;
    const endIndex = Math.min(currentPage * ROWS_PER_PAGE, totalStudents);

    paginationInfo.textContent = `Показано ${startIndex}-${endIndex} из ${totalStudents} записей`;
}

// ===== ПАГИНАЦИЯ =====

function renderPageNumbers() {
    pageNumbers.innerHTML = '';

    if (totalPages <= 1) return;

    addPageNumber(1);

    if (currentPage > 3) {
        addEllipsis();
    }

    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        addPageNumber(i);
    }

    if (currentPage < totalPages - 2) {
        addEllipsis();
    }

    if (totalPages > 1) {
        addPageNumber(totalPages);
    }

    firstPageBtn.disabled = currentPage === 1;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
    lastPageBtn.disabled = currentPage === totalPages;

    gotoInput.value = currentPage;
    gotoInput.max = totalPages;
}

function addPageNumber(page) {
    const pageElement = document.createElement('span');
    pageElement.className = `page-number ${page === currentPage ? 'active' : ''}`;
    pageElement.textContent = page;
    pageElement.addEventListener('click', () => goToPage(page));
    pageNumbers.appendChild(pageElement);
}

function addEllipsis() {
    const ellipsis = document.createElement('span');
    ellipsis.className = 'page-number ellipsis';
    ellipsis.textContent = '...';
    pageNumbers.appendChild(ellipsis);
}

async function goToPage(page) {
    if (page < 1 || page > totalPages || page === currentPage) return;

    currentPage = page;
    expandedRowId = null;
    await renderTable();
    renderPageNumbers();
}

function goToFirstPage() {
    goToPage(1);
}

function goToPrevPage() {
    goToPage(currentPage - 1);
}

function goToNextPage() {
    goToPage(currentPage + 1);
}

function goToLastPage() {
    goToPage(totalPages);
}

// ===== ВЫПАДАЮЩИЕ СПИСКИ =====

async function initDropdowns() {
    try {
        const data = await loadDropdownData();

        // Инициализация первого списка (институты)
        initDropdownList(dropdownList, data.institutes, selectedInstitutes,
                        selectedItemsPreview, updateFilterAndRender);

        // Инициализация второго списка (курсы)
        initDropdownList(dropdownList2, data.courses, selectedCourses,
                        selectedItemsPreview2, updateFilterAndRender);

        // Инициализация третьего списка (группы)
        initDropdownList(dropdownList3, data.groups, selectedGroups,
                        selectedItemsPreview3, updateFilterAndRender);

    } catch (error) {
        console.error('Ошибка при инициализации выпадающих списков:', error);
    }
}

function initDropdownList(dropdownElement, items, selectedSet, previewElement, onChangeCallback) {
    dropdownElement.innerHTML = '';

    items.forEach(item => {
        const dropdownItem = document.createElement('div');
        dropdownItem.className = 'dropdown-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `filter-${item}`;
        checkbox.checked = selectedSet.has(item);

        const label = document.createElement('label');
        label.htmlFor = `filter-${item}`;
        label.textContent = item;

        dropdownItem.appendChild(checkbox);
        dropdownItem.appendChild(label);
        dropdownElement.appendChild(dropdownItem);

        dropdownItem.addEventListener('click', (e) => {
            if (e.target.tagName !== 'INPUT') {
                checkbox.checked = !checkbox.checked;
            }

            if (checkbox.checked) {
                selectedSet.add(item);
            } else {
                selectedSet.delete(item);
            }

            updatePreview(previewElement, selectedSet);
            if (onChangeCallback) onChangeCallback();
        });
    });
}

function updatePreview(previewElement, selectedSet) {
    if (selectedSet.size === 0) {
        previewElement.textContent = '';
    } else {
        previewElement.textContent = Array.from(selectedSet).join(', ');
    }
}

async function updateFilterAndRender() {
    currentPage = 1;
    expandedRowId = null;
    await renderTable();
    renderPageNumbers();
}

function resetFilters() {
    selectedInstitutes.clear();
    selectedCourses.clear();
    selectedGroups.clear();
    searchInput.value = '';

    updatePreview(selectedItemsPreview, selectedInstitutes);
    updatePreview(selectedItemsPreview2, selectedCourses);
    updatePreview(selectedItemsPreview3, selectedGroups);

    currentPage = 1;
    expandedRowId = null;

    // Закрываем выпадающие списки
    [dropdownList, dropdownList2, dropdownList3].forEach(list => {
        if (list) list.classList.remove('show');
    });

    [dropdownArrow, dropdownArrow2, dropdownArrow3].forEach(arrow => {
        if (arrow) arrow.classList.remove('up');
    });

    updateFilterAndRender();
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====

function handleHeaderClick(event) {
    const header = event.currentTarget;
    const column = header.getAttribute('data-sort');

    if (column === currentSortColumn) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortColumn = column;
        currentSortDirection = (column === 'fio' || column === 'group_name') ? 'asc' : 'desc';
    }

    currentPage = 1;
    expandedRowId = null;

    renderTable();
    renderPageNumbers();
}

// ===== ИНИЦИАЛИЗАЦИЯ =====

async function init() {
    // Настройка выпадающего меню пользователя
    setupDropdownCloseListeners();

    // Обновление приветствия
    updateGreeting();
    setInterval(updateGreeting, 60000);

    // Инициализация выпадающих списков фильтров
    await initDropdowns();

    // Инициализация кнопки сброса фильтров
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', resetFilters);
    }

    // Назначение обработчиков событий для сортировки
    tableHeaders.forEach(header => {
        header.addEventListener('click', handleHeaderClick);
    });

    // Пагинация
    searchInput.addEventListener('input', debounce(updateFilterAndRender, 300));
    firstPageBtn.addEventListener('click', goToFirstPage);
    prevPageBtn.addEventListener('click', goToPrevPage);
    nextPageBtn.addEventListener('click', goToNextPage);
    lastPageBtn.addEventListener('click', goToLastPage);

    gotoBtn.addEventListener('click', function() {
        const page = parseInt(gotoInput.value);
        if (page >= 1 && page <= totalPages) {
            goToPage(page);
        } else {
            alert(`Введите номер страницы от 1 до ${totalPages}`);
        }
    });

    gotoInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            gotoBtn.click();
        }
    });

    // Выпадающие списки фильтров
    [dropdownHeader, dropdownHeader2, dropdownHeader3].forEach((header, index) => {
        if (header) {
            header.addEventListener('click', () => {
                const lists = [dropdownList, dropdownList2, dropdownList3];
                const arrows = [dropdownArrow, dropdownArrow2, dropdownArrow3];

                if (lists[index]) lists[index].classList.toggle('show');
                if (header) header.classList.toggle('active');
                if (arrows[index]) arrows[index].classList.toggle('up');
            });
        }
    });

    // Обработчик изменения размера окна
    let resizeTimer;
    window.addEventListener('resize', function() {
        if (expandedRowId !== null) {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                renderTable();
            }, 250);
        }
    });

    // Загрузка начальных данных
    await renderTable();
    renderPageNumbers();
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Запуск при загрузке страницы
document.addEventListener('DOMContentLoaded', init);