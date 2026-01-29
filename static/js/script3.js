// ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ И КОНСТАНТЫ =====

// Константы пагинации
const ROWS_PER_PAGE = 20;

// Состояние приложения
let currentPage = 1;
let filteredStudents = [];
let totalPages = 1;
let expandedRowId = null;
let currentSortColumn = 'total';
let currentSortDirection = 'desc';

// Состояние фильтров
let selectedItems1 = new Set();
let selectedItems2 = new Set();
let selectedItems3 = new Set();

// Данные для выпадающих списков
let dropdownItems = [];
let dropdownItems2 = [];
let dropdownItems3 = [];

// Данные студентов
const allStudents = [
    {
        id: 1,
        fio: "Иванов Иван Иваныч",
        group: "ИВТ-301",
        institute: "Инженерно-экономический институт",
        course: 3,
        studyDetails: {
            performance: [{name: "хорошо и отлично", value: 1}],
            olympiads: [],
            additionalPrograms: []
        },
        researchDetails: {
            scienceCompetitions: [
                { name: "Международные", value: 3 },
                { name: "Российские, областные", value: 4 }
            ],
            publications: [{ name: "прочие", value: 1 }],
            conferences: []
        },
        creativeDetails: { competitions: [] },
        sportDetails: { membership: "Член Сборной России - 8", achievements: [] },
        socialDetails: {
            roles: [
                { name: "Староста", value: 2 },
                { name: "Профсоюзная работа, студенческий совет", value: 2 },
                { name: "Волонтерская деятельность", value: 2 }
            ]
        },
        certificatesLink: "https://example.com/certificates/1"
    },
    {
        id: 2,
        fio: "Петров Петр Петрович",
        group: "ИВТ-302",
        institute: "Строительный институт",
        course: 4,
        studyDetails: {
            performance: [{name: "отлично", value: 2}],
            olympiads: [{ name: "Вузовские (1 место)", value: 3 }],
            additionalPrograms: [{ name: "Дополнительная программа", value: 1 }]
        },
        researchDetails: {
            scienceCompetitions: [{ name: "Вузовские (2 место)", value: 2 }],
            publications: [],
            conferences: [{ name: "Участие в конференции", value: 1 }]
        },
        creativeDetails: { competitions: [{ name: "Вузовские (3 место)", value: 1 }] },
        sportDetails: {
            membership: "",
            achievements: [{ name: "Чемпионат области (призер)", value: 4 }]
        },
        socialDetails: {
            roles: [
                { name: "Волонтерская деятельность", value: 2 },
                { name: "Профориентационная работа", value: 2 }
            ]
        },
        certificatesLink: "https://example.com/certificates/2"
    },
    {
        id: 3,
        fio: "Сидорова Анна Сергеевна",
        group: "ИВТ-301",
        institute: "Институт лесного комплекса",
        course: 3,
        studyDetails: {
            performance: [{name: "отлично", value: 2}],
            olympiads: [
                { name: "Российские, областные (1 место)", value: 4 },
                { name: "Вузовские (2 место)", value: 2 }
            ],
            additionalPrograms: []
        },
        researchDetails: {
            scienceCompetitions: [
                { name: "Международные (3 место)", value: 3 },
                { name: "Российские, областные (2 место)", value: 3 }
            ],
            publications: [{ name: "ВАК, РИНЦ", value: 3 }],
            conferences: []
        },
        creativeDetails: { competitions: [{ name: "Международные (1 место)", value: 6 }] },
        sportDetails: { membership: "", achievements: [] },
        socialDetails: {
            roles: [
                { name: "Староста", value: 2 },
                { name: "Профсоюзная работа", value: 2 },
                { name: "Волонтерская деятельность", value: 2 },
                { name: "Профориентационная работа", value: 2 }
            ]
        },
        certificatesLink: "https://example.com/certificates/3"
    },
    {
        id: 4,
        fio: "Кузнецова Елена Викторовна",
        group: "ИВТ-201",
        institute: "Инженерно-экономический институт",
        course: 2,
        studyDetails: {
            performance: [{name: "отлично", value: 2}],
            olympiads: [{ name: "Вузовские (2 место)", value: 2 }],
            additionalPrograms: []
        },
        researchDetails: {
            scienceCompetitions: [{ name: "Вузовские (3 место)", value: 1 }],
            publications: [],
            conferences: [{ name: "Студенческая конференция", value: 1 }]
        },
        creativeDetails: { competitions: [{ name: "Областные (2 место)", value: 3 }] },
        sportDetails: { membership: "", achievements: [] },
        socialDetails: {
            roles: [{ name: "Профориентационная работа", value: 2 }]
        },
        certificatesLink: "https://example.com/certificates/4"
    },
    {
        id: 5,
        fio: "Смирнов Алексей Дмитриевич",
        group: "ИВТ-401",
        institute: "Строительный институт",
        course: 4,
        studyDetails: {
            performance: [{name: "хорошо", value: 1}],
            olympiads: [],
            additionalPrograms: [{ name: "Курс английского языка", value: 1 }]
        },
        researchDetails: {
            scienceCompetitions: [
                { name: "Российские, областные (1 место)", value: 4 },
                { name: "Международные (2 место)", value: 4 }
            ],
            publications: [{ name: "ВАК", value: 3 }],
            conferences: []
        },
        creativeDetails: { competitions: [] },
        sportDetails: {
            membership: "",
            achievements: [
                { name: "Чемпионат вуза (1 место)", value: 3 },
                { name: "Спартакиада (2 место)", value: 2 }
            ]
        },
        socialDetails: {
            roles: [
                { name: "Староста", value: 2 },
                { name: "Волонтерская деятельность", value: 2 }
            ]
        },
        certificatesLink: "https://example.com/certificates/5"
    },
    {
        id: 6,
        fio: "Федорова Мария Игоревна",
        group: "ИВТ-101",
        institute: "Институт лесного комплекса",
        course: 1,
        studyDetails: {
            performance: [{name: "отлично", value: 2}],
            olympiads: [{ name: "Вузовские (1 место)", value: 3 }],
            additionalPrograms: []
        },
        researchDetails: {
            scienceCompetitions: [],
            publications: [],
            conferences: []
        },
        creativeDetails: {
            competitions: [
                { name: "Вузовские (1 место)", value: 3 },
                { name: "Областные (2 место)", value: 3 }
            ]
        },
        sportDetails: { membership: "", achievements: [] },
        socialDetails: {
            roles: [
                { name: "Профсоюзная работа", value: 2 },
                { name: "Волонтерская деятельность", value: 2 }
            ]
        },
        certificatesLink: "https://example.com/certificates/6"
    },
    {
        id: 7,
        fio: "Новиков Денис Сергеевич",
        group: "ИВТ-302",
        institute: "Инженерно-экономический институт",
        course: 3,
        studyDetails: {
            performance: [{name: "хорошо и отлично", value: 1}],
            olympiads: [],
            additionalPrograms: []
        },
        researchDetails: {
            scienceCompetitions: [{ name: "Вузовские (3 место)", value: 1 }],
            publications: [{ name: "РИНЦ", value: 2 }],
            conferences: []
        },
        creativeDetails: { competitions: [] },
        sportDetails: {
            membership: "Член сборной вуза - 5",
            achievements: [{ name: "Городские соревнования (призер)", value: 3 }]
        },
        socialDetails: {
            roles: [{ name: "Профориентационная работа", value: 2 }]
        },
        certificatesLink: "https://example.com/certificates/7"
    },
    {
        id: 8,
        fio: "Волкова Ольга Павловна",
        group: "ИВТ-201",
        institute: "Строительный институт",
        course: 2,
        studyDetails: {
            performance: [{name: "отлично", value: 2}],
            olympiads: [{ name: "Вузовские (2 место)", value: 2 }],
            additionalPrograms: [{ name: "Курс программирования", value: 2 }]
        },
        researchDetails: {
            scienceCompetitions: [],
            publications: [],
            conferences: []
        },
        creativeDetails: { competitions: [{ name: "Вузовские (3 место)", value: 1 }] },
        sportDetails: { membership: "", achievements: [] },
        socialDetails: {
            roles: [
                { name: "Староста", value: 2 },
                { name: "Волонтерская деятельность", value: 2 },
                { name: "Студенческий совет", value: 3 }
            ]
        },
        certificatesLink: "https://example.com/certificates/8"
    },
    {
        id: 9,
        fio: "Лебедев Артем Андреевич",
        group: "ИВТ-401",
        institute: "Институт лесного комплекса",
        course: 4,
        studyDetails: {
            performance: [{name: "хорошо", value: 1}],
            olympiads: [],
            additionalPrograms: []
        },
        researchDetails: {
            scienceCompetitions: [
                { name: "Международные (1 место)", value: 6 },
                { name: "Российские, областные (1 место)", value: 4 }
            ],
            publications: [
                { name: "ВАК", value: 3 },
                { name: "Scopus", value: 5 }
            ],
            conferences: [{ name: "Международная конференция", value: 2 }]
        },
        creativeDetails: { competitions: [] },
        sportDetails: { membership: "", achievements: [] },
        socialDetails: {
            roles: [{ name: "Профсоюзная работа", value: 2 }]
        },
        certificatesLink: "https://example.com/certificates/9"
    },
    {
        id: 10,
        fio: "Григорьева Татьяна Владимировна",
        group: "ИВТ-101",
        institute: "Инженерно-экономический институт",
        course: 1,
        studyDetails: {
            performance: [{name: "отлично", value: 2}],
            olympiads: [],
            additionalPrograms: []
        },
        researchDetails: {
            scienceCompetitions: [],
            publications: [],
            conferences: []
        },
        creativeDetails: {
            competitions: [
                { name: "Вузовские (1 место)", value: 3 },
                { name: "Городские (1 место)", value: 4 }
            ]
        },
        sportDetails: { membership: "", achievements: [] },
        socialDetails: {
            roles: [
                { name: "Волонтерская деятельность", value: 2 },
                { name: "Профориентационная работа", value: 2 }
            ]
        },
        certificatesLink: "https://example.com/certificates/10"
    },
    {
        id: 11,
        fio: "Козлов Илья Максимович",
        group: "ИВТ-301",
        institute: "Строительный институт",
        course: 3,
        studyDetails: {
            performance: [{name: "хорошо и отлично", value: 1}],
            olympiads: [{ name: "Областные (3 место)", value: 2 }],
            additionalPrograms: []
        },
        researchDetails: {
            scienceCompetitions: [{ name: "Вузовские (2 место)", value: 2 }],
            publications: [{ name: "РИНЦ", value: 2 }],
            conferences: []
        },
        creativeDetails: { competitions: [] },
        sportDetails: {
            membership: "Член сборной области - 6",
            achievements: [{ name: "Областные соревнования (1 место)", value: 4 }]
        },
        socialDetails: { roles: [] },
        certificatesLink: "https://example.com/certificates/11"
    },
    {
        id: 12,
        fio: "Захарова Юлия Александровна",
        group: "ИВТ-202",
        institute: "Институт лесного комплекса",
        course: 2,
        studyDetails: {
            performance: [{name: "отлично", value: 2}],
            olympiads: [
                { name: "Вузовские (1 место)", value: 3 },
                { name: "Российские (2 место)", value: 3 }
            ],
            additionalPrograms: [{ name: "Сертификат CAD", value: 2 }]
        },
        researchDetails: {
            scienceCompetitions: [{ name: "Вузовские (3 место)", value: 1 }],
            publications: [],
            conferences: []
        },
        creativeDetails: { competitions: [{ name: "Городские (2 место)", value: 3 }] },
        sportDetails: { membership: "", achievements: [] },
        socialDetails: {
            roles: [
                { name: "Староста", value: 2 },
                { name: "Студенческий совет", value: 3 }
            ]
        },
        certificatesLink: "https://example.com/certificates/12"
    }
];

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

// ===== УТИЛИТЫ =====

/**
 * Получение параметра из URL
 */
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

/**
 * Расчет баллов для одного студента
 */
function calculateStudentScores(student) {
    // Расчет баллов для учебной деятельности
    const studyScore = 
        student.studyDetails.performance.reduce((sum, item) => sum + item.value, 0) +
        student.studyDetails.olympiads.reduce((sum, item) => sum + item.value, 0) +
        student.studyDetails.additionalPrograms.reduce((sum, item) => sum + item.value, 0);
    
    // Расчет баллов для научно-исследовательской деятельности
    const researchScore = 
        student.researchDetails.scienceCompetitions.reduce((sum, item) => sum + item.value, 0) +
        student.researchDetails.publications.reduce((sum, item) => sum + item.value, 0) +
        student.researchDetails.conferences.reduce((sum, item) => sum + item.value, 0);
    
    // Расчет баллов для творческих конкурсов
    const creativeScore = 
        student.creativeDetails.competitions.reduce((sum, item) => sum + item.value, 0);
    
    // Расчет баллов для спорта
    const sportScore = 
        (student.sportDetails.membership ? parseInt(student.sportDetails.membership.split('-').pop().trim()) || 0 : 0) +
        student.sportDetails.achievements.reduce((sum, item) => sum + item.value, 0);
    
    // Расчет баллов для общественной работы
    const socialScore = 
        student.socialDetails.roles.reduce((sum, item) => sum + item.value, 0);
    
    // Общий балл
    const totalScore = studyScore + researchScore + creativeScore + sportScore + socialScore;
    
    return {
        study: studyScore,
        research: researchScore,
        creative: creativeScore,
        sport: sportScore,
        social: socialScore,
        total: totalScore
    };
}

/**
 * Инициализация баллов всех студентов
 */
function initializeStudentScores() {
    allStudents.forEach(student => {
        const scores = calculateStudentScores(student);
        
        // Добавляем рассчитанные баллы в объект студента
        student.study = scores.study;
        student.research = scores.research;
        student.creative = scores.creative;
        student.sport = scores.sport;
        student.social = scores.social;
        student.total = scores.total;
    });
}

/**
 * Сортировка данных
 */
function sortData(data, column, direction) {
    return [...data].sort((a, b) => {
        let valueA = a[column];
        let valueB = b[column];
        
        // Для числовых колонок преобразуем в числа
        if (column !== 'fio' && column !== 'group') {
            valueA = Number(valueA);
            valueB = Number(valueB);
        }
        
        // Для строковых значений (ФИО и группа) сортируем без учета регистра
        if (typeof valueA === 'string') {
            valueA = valueA.toLowerCase();
            valueB = valueB.toLowerCase();
        }
        
        if (valueA < valueB) {
            return direction === 'asc' ? -1 : 1;
        }
        if (valueA > valueB) {
            return direction === 'asc' ? 1 : -1;
        }
        return 0;
    });
}

/**
 * Обновление индикаторов сортировки в заголовках таблицы
 */
function updateSortIndicators() {
    // Убираем все классы сортировки
    tableHeaders.forEach(header => {
        header.classList.remove('sorted-asc', 'sorted-desc');
    });
    
    // Добавляем классы к активному заголовку
    const activeHeader = document.querySelector(`th[data-sort="${currentSortColumn}"]`);
    if (activeHeader) {
        if (currentSortDirection === 'asc') {
            activeHeader.classList.add('sorted-asc');
        } else {
            activeHeader.classList.add('sorted-desc');
        }
    }
}

// ===== ФОРМАТИРОВАНИЕ ДЕТАЛЬНОЙ ИНФОРМАЦИИ =====

/**
 * Форматирование учебной деятельности
 */
function formatStudyDetails(details) {
    let html = '';
    details.performance.forEach(item => {
        html += `<div class="detail-item">
            <span class="label">Успеваемость:</span>
            <span class="value">${item.name} - ${item.value}</span>
        </div>`;
    });
    details.olympiads.forEach(item => {
        html += `<div class="detail-item">
            <span class="label">${item.name}:</span>
            <span class="value">${item.value}</span>
        </div>`;
    });
    details.additionalPrograms.forEach(item => {
        html += `<div class="detail-item">
            <span class="label">${item.name}:</span>
            <span class="value">${item.value}</span>
        </div>`;
    });
    return html;
}

/**
 * Форматирование научно-исследовательской деятельности
 */
function formatResearchDetails(details) {
    let html = '';
    details.scienceCompetitions.forEach(item => {
        html += `<div class="detail-item">
            <span class="label">${item.name}:</span>
            <span class="value">${item.value}</span>
        </div>`;
    });
    details.publications.forEach(item => {
        html += `<div class="detail-item">
            <span class="label">Публикации (${item.name}):</span>
            <span class="value">${item.value}</span>
        </div>`;
    });
    details.conferences.forEach(item => {
        html += `<div class="detail-item">
            <span class="label">${item.name}:</span>
            <span class="value">${item.value}</span>
        </div>`;
    });
    return html;
}

/**
 * Форматирование творческих конкурсов
 */
function formatCreativeDetails(details) {
    let html = '';
    details.competitions.forEach(item => {
        html += `<div class="detail-item">
            <span class="label">${item.name}:</span>
            <span class="value">${item.value}</span>
        </div>`;
    });
    return html;
}

/**
 * Форматирование спорта
 */
function formatSportDetails(details) {
    let html = '';
    if (details.membership) {
        html += `<div class="detail-item">
            <span class="label">Членство:</span>
            <span class="value">${details.membership}</span>
        </div>`;
    }
    details.achievements.forEach(item => {
        html += `<div class="detail-item">
            <span class="label">${item.name}:</span>
            <span class="value">${item.value}</span>
        </div>`;
    });
    return html;
}

/**
 * Форматирование общественной работы
 */
function formatSocialDetails(details) {
    let html = '';
    details.roles.forEach(item => {
        html += `<div class="detail-item">
            <span class="label">${item.name}:</span>
            <span class="value">${item.value}</span>
        </div>`;
    });
    return html;
}

/**
 * Создание детальной информации студента
 */
function createDetailContent(student, columnWidths = []) {
    const detailFlex = document.createElement('div');
    detailFlex.className = 'detail-flex';
    
    // Если нет ширин, используем значения по умолчанию
    const widths = columnWidths.length === 8 ? columnWidths : [200, 111, 167, 188, 167, 167, 167, 167];
    
    // Содержимое для каждой ячейки
    const cellContents = [
        // 1. Институт (вместо ФИО)
        `<div class="detail-item">
            <span class="label">Институт:</span>
            <span class="value">${student.institute}</span>
        </div>
        <div class="detail-item">
            <span class="label">Курс:</span>
            <span class="value">${student.course}</span>
        </div>`,
        
        // 2. Пустая ячейка для группы
        '',
        
        // 3. Учебная деятельность
        formatStudyDetails(student.studyDetails),
        
        // 4. Научно-исследовательская деятельность
        formatResearchDetails(student.researchDetails),
        
        // 5. Творческие конкурсы
        formatCreativeDetails(student.creativeDetails),
        
        // 6. Спорт
        formatSportDetails(student.sportDetails),
        
        // 7. Общественная работа
        formatSocialDetails(student.socialDetails),
        
        // 8. Грамоты
        `<a href="${student.certificatesLink}" target="_blank" class="certificates-btn">
            Посмотреть грамоты
        </a>`
    ];
    
    // Создаем ячейки с точными ширинами
    for (let i = 0; i < 8; i++) {
        const cell = document.createElement('div');
        cell.className = 'detail-cell';
        cell.style.width = `${widths[i]}px`;
        cell.style.minWidth = `${widths[i]}px`;
        cell.style.maxWidth = `${widths[i]}px`;
        cell.style.flex = `0 0 ${widths[i]}px`;
        
        // Для ячейки с грамотами
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
 * Отображение таблицы студентов
 */
function renderTable() {
    // Сортируем данные
    const sortedStudents = sortData(filteredStudents, currentSortColumn, currentSortDirection);
    
    // Очищаем таблицу
    tableBody.innerHTML = '';
    
    // Получаем ширины заголовков
    const headerCells = document.querySelectorAll('thead th');
    const columnWidths = Array.from(headerCells).map(th => th.offsetWidth);
    
    // Рассчитываем начальный и конечный индексы для текущей страницы
    const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
    const endIndex = Math.min(startIndex + ROWS_PER_PAGE, sortedStudents.length);
    
    // Отображаем строки для текущей страницы
    for (let i = startIndex; i < endIndex; i++) {
        const student = sortedStudents[i];

        // Основная строка
        const mainRow = document.createElement('tr');
        mainRow.className = `main-row ${expandedRowId === student.id ? 'expanded' : ''}`;
        mainRow.dataset.studentId = student.id;
        
        mainRow.innerHTML = `
            <td class="fio-column">${student.fio}</td>
            <td class="group-column">${student.group}</td>
            <td>${student.study}</td>
            <td>${student.research}</td>
            <td>${student.creative}</td>
            <td>${student.sport}</td>
            <td>${student.social}</td>
            <td class="total-column">${student.total}</td>
        `;
        
        tableBody.appendChild(mainRow);
        
        // Детальная строка
        const detailRow = document.createElement('tr');
        detailRow.className = `detail-row ${expandedRowId === student.id ? 'expanded' : ''}`;
        detailRow.dataset.studentId = student.id;
        
        const detailCell = document.createElement('td');
        detailCell.colSpan = 8;
        detailCell.className = 'detail-content';
        
        // Передаем ширины колонок в функцию создания деталей
        detailCell.appendChild(createDetailContent(student, columnWidths));
        detailRow.appendChild(detailCell);
        
        tableBody.appendChild(detailRow);
        
        // Обработчик клика по основной строке
        mainRow.addEventListener('click', (e) => {
            // Игнорируем клики по ссылкам
            if (e.target.tagName === 'A') return;
            
            const studentId = parseInt(mainRow.dataset.studentId);
            
            // Закрываем все остальные строки
            if (expandedRowId !== studentId) {
                expandedRowId = studentId;
            } else {
                expandedRowId = null;
            }
            
            // Перерисовываем таблицу
            renderTable();
        });
    }

    // Обновляем индикаторы сортировки
    updateSortIndicators();
    
    // Обновляем информацию о пагинации
    updatePaginationInfo();
}

/**
 * Обновление информации о пагинации
 */
function updatePaginationInfo() {
    const startIndex = (currentPage - 1) * ROWS_PER_PAGE + 1;
    const endIndex = Math.min(currentPage * ROWS_PER_PAGE, filteredStudents.length);
    
    paginationInfo.textContent = `Показано ${startIndex}-${endIndex} из ${filteredStudents.length} записей`;
}

// ===== ПАГИНАЦИЯ =====

/**
 * Отображение номеров страниц
 */
function renderPageNumbers() {
    pageNumbers.innerHTML = '';
    
    // Всегда показываем первую страницу
    addPageNumber(1);
    
    // Показываем многоточие если нужно
    if (currentPage > 3) {
        addEllipsis();
    }
    
    // Показываем страницы вокруг текущей
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        addPageNumber(i);
    }
    
    // Показываем многоточие если нужно
    if (currentPage < totalPages - 2) {
        addEllipsis();
    }
    
    // Всегда показываем последнюю страницу если она не первая
    if (totalPages > 1) {
        addPageNumber(totalPages);
    }
    
    // Обновляем состояние кнопок
    firstPageBtn.disabled = currentPage === 1;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
    lastPageBtn.disabled = currentPage === totalPages;
    
    // Обновляем поле ввода для перехода
    gotoInput.value = currentPage;
    gotoInput.max = totalPages;
}

/**
 * Добавление номера страницы
 */
function addPageNumber(page) {
    const pageElement = document.createElement('span');
    pageElement.className = `page-number ${page === currentPage ? 'active' : ''}`;
    pageElement.textContent = page;
    pageElement.addEventListener('click', () => goToPage(page));
    pageNumbers.appendChild(pageElement);
}

/**
 * Добавление многоточия в пагинации
 */
function addEllipsis() {
    const ellipsis = document.createElement('span');
    ellipsis.className = 'page-number ellipsis';
    ellipsis.textContent = '...';
    pageNumbers.appendChild(ellipsis);
}

/**
 * Переход на страницу
 */
function goToPage(page) {
    if (page < 1 || page > totalPages || page === currentPage) return;
    
    currentPage = page;
    renderTable();
    renderPageNumbers();
}

/**
 * Переход на первую страницу
 */
function goToFirstPage() {
    goToPage(1);
}

/**
 * Переход на предыдущую страницу
 */
function goToPrevPage() {
    goToPage(currentPage - 1);
}

/**
 * Переход на следующую страницу
 */
function goToNextPage() {
    goToPage(currentPage + 1);
}

/**
 * Переход на последнюю страницу
 */
function goToLastPage() {
    goToPage(totalPages);
}

// ===== ФИЛЬТРАЦИЯ =====

/**
 * Фильтрация студентов по выбранным параметрам
 */
function filterStudentsByDropdowns() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    // Получаем выбранные институты
    const selectedInstitutes = [];
    dropdownItems.forEach(item => {
        if (selectedItems1.has(item.id)) {
            selectedInstitutes.push(item.label);
        }
    });
    
    // Получаем выбранные курсы
    const selectedCourses = [];
    dropdownItems2.forEach(item => {
        if (selectedItems2.has(item.id)) {
            selectedCourses.push(parseInt(item.label));
        }
    });
    
    // Получаем выбранные группы
    const selectedGroups = [];
    dropdownItems3.forEach(item => {
        if (selectedItems3.has(item.id)) {
            selectedGroups.push(item.label);
        }
    });
    
    // Фильтруем студентов
    filteredStudents = allStudents.filter(student => {
        // Фильтрация по поиску ФИО
        if (searchTerm && !student.fio.toLowerCase().includes(searchTerm)) {
            return false;
        }
        
        // Фильтрация по институтам
        if (selectedInstitutes.length > 0 && !selectedInstitutes.includes(student.institute)) {
            return false;
        }
        
        // Фильтрация по курсам
        if (selectedCourses.length > 0 && !selectedCourses.includes(student.course)) {
            return false;
        }
        
        // Фильтрация по группам
        if (selectedGroups.length > 0 && !selectedGroups.includes(student.group)) {
            return false;
        }
        
        return true;
    });
    
    // Пересчитываем общее количество страниц
    totalPages = Math.ceil(filteredStudents.length / ROWS_PER_PAGE);
    
    // Если текущая страница больше общего количества страниц, переходим на последнюю страницу
    if (currentPage > totalPages && totalPages > 0) {
        currentPage = totalPages;
    } else if (totalPages === 0) {
        currentPage = 1;
    }

    // Сбрасываем раскрытую строку при фильтрации
    expandedRowId = null;
    
    renderTable();
    renderPageNumbers();
}

/**
 * Сброс всех фильтров
 */
function resetFilters() {
    // Сбрасываем выбранные элементы
    selectedItems1.clear();
    selectedItems2.clear();
    selectedItems3.clear();
    
    // Сбрасываем поле поиска
    searchInput.value = '';
    
    // Обновляем отображение выпадающих списков
    initDropdown1();
    initDropdown2();
    initDropdown3();
    updateSelectedItemsPreview1();
    updateSelectedItemsPreview2();
    updateSelectedItemsPreview3();
    
    // Применяем фильтрацию (покажет всех студентов)
    filterStudentsByDropdowns();
}

// ===== ВЫПАДАЮЩИЕ СПИСКИ =====

/**
 * Инициализация первого выпадающего списка (институты)
 */
function initDropdown1() {
    dropdownList.innerHTML = '';
    
    dropdownItems.forEach(item => {
        const dropdownItem = document.createElement('div');
        dropdownItem.className = 'dropdown-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = item.id;
        checkbox.checked = selectedItems1.has(item.id);
        
        const label = document.createElement('label');
        label.htmlFor = item.id;
        label.textContent = item.label;
        
        dropdownItem.appendChild(checkbox);
        dropdownItem.appendChild(label);
        dropdownList.appendChild(dropdownItem);
        
        dropdownItem.addEventListener('click', (e) => {
            if (e.target.tagName !== 'INPUT') {
                checkbox.checked = !checkbox.checked;
            }
            
            if (checkbox.checked) {
                selectedItems1.add(item.id);
            } else {
                selectedItems1.delete(item.id);
            }
            
            updateSelectedItemsPreview1();
            filterStudentsByDropdowns();
        });
    });
}

/**
 * Инициализация второго выпадающего списка (курсы)
 */
function initDropdown2() {
    dropdownList2.innerHTML = '';
    
    dropdownItems2.forEach(item => {
        const dropdownItem = document.createElement('div');
        dropdownItem.className = 'dropdown-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = item.id;
        checkbox.checked = selectedItems2.has(item.id);
        
        const label = document.createElement('label');
        label.htmlFor = item.id;
        label.textContent = item.label;
        
        dropdownItem.appendChild(checkbox);
        dropdownItem.appendChild(label);
        dropdownList2.appendChild(dropdownItem);
        
        dropdownItem.addEventListener('click', (e) => {
            if (e.target.tagName !== 'INPUT') {
                checkbox.checked = !checkbox.checked;
            }
            
            if (checkbox.checked) {
                selectedItems2.add(item.id);
            } else {
                selectedItems2.delete(item.id);
            }
            
            updateSelectedItemsPreview2();
            filterStudentsByDropdowns();
        });
    });
}

/**
 * Инициализация третьего выпадающего списка (группы)
 */
function initDropdown3() {
    dropdownList3.innerHTML = '';
    
    dropdownItems3.forEach(item => {
        const dropdownItem = document.createElement('div');
        dropdownItem.className = 'dropdown-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = item.id;
        checkbox.checked = selectedItems3.has(item.id);
        
        const label = document.createElement('label');
        label.htmlFor = item.id;
        label.textContent = item.label;
        
        dropdownItem.appendChild(checkbox);
        dropdownItem.appendChild(label);
        dropdownList3.appendChild(dropdownItem);
        
        dropdownItem.addEventListener('click', (e) => {
            if (e.target.tagName !== 'INPUT') {
                checkbox.checked = !checkbox.checked;
            }
            
            if (checkbox.checked) {
                selectedItems3.add(item.id);
            } else {
                selectedItems3.delete(item.id);
            }
            
            updateSelectedItemsPreview3();
            filterStudentsByDropdowns();
        });
    });
}

/**
 * Обновление предварительного просмотра для первого меню
 */
function updateSelectedItemsPreview1() {
    if (selectedItems1.size === 0) {
        selectedItemsPreview.textContent = '';
        return;
    }
    
    const selectedLabels = [];
    dropdownItems.forEach(item => {
        if (selectedItems1.has(item.id)) {
            selectedLabels.push(item.label);
        }
    });
    
    selectedItemsPreview.textContent = selectedLabels.join(', ');
}

/**
 * Обновление предварительного просмотра для второго меню
 */
function updateSelectedItemsPreview2() {
    if (selectedItems2.size === 0) {
        selectedItemsPreview2.textContent = '';
        return;
    }
    
    const selectedLabels = [];
    dropdownItems2.forEach(item => {
        if (selectedItems2.has(item.id)) {
            selectedLabels.push(item.label);
        }
    });
    
    selectedItemsPreview2.textContent = selectedLabels.join(', ');
}

/**
 * Обновление предварительного просмотра для третьего меню
 */
function updateSelectedItemsPreview3() {
    if (selectedItems3.size === 0) {
        selectedItemsPreview3.textContent = '';
        return;
    }
    
    const selectedLabels = [];
    dropdownItems3.forEach(item => {
        if (selectedItems3.has(item.id)) {
            selectedLabels.push(item.label);
        }
    });
    
    selectedItemsPreview3.textContent = selectedLabels.join(', ');
}

/**
 * Инициализация выпадающих списков
 */
function initDropdowns() {
    // Инициализируем данные для выпадающих списков
    const institutes = [...new Set(allStudents.map(student => student.institute))].sort();
    dropdownItems = institutes.map((institute, index) => ({
        id: `inst${index + 1}`,
        label: institute
    }));

    const courses = [...new Set(allStudents.map(student => student.course.toString()))].sort();
    dropdownItems2 = courses.map((course, index) => ({
        id: `course${index + 1}`,
        label: course
    }));

    const groups = [...new Set(allStudents.map(student => student.group))].sort();
    dropdownItems3 = groups.map((group, index) => ({
        id: `group${index + 1}`,
        label: group
    }));

    // Инициализируем выпадающие списки
    initDropdown1();
    initDropdown2();
    initDropdown3();
    updateSelectedItemsPreview1();
    updateSelectedItemsPreview2();
    updateSelectedItemsPreview3();
}

// ===== МОДАЛЬНОЕ ОКНО =====

/**
 * Валидация формы
 */
function validateForm() {
    const form = document.getElementById('first-form');
    const inputs = form.querySelectorAll('input, select');
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

/**
 * Обработчик сортировки таблицы
 */
function handleHeaderClick(event) {
    const header = event.currentTarget;
    const column = header.getAttribute('data-sort');
    
    // Если кликнули по уже активному столбцу, меняем направление сортировки
    if (column === currentSortColumn) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        // Если кликнули по новому столбцу, устанавливаем его как активный
        currentSortColumn = column;
        currentSortDirection = (column === 'fio' || column === 'group') ? 'asc' : 'desc';
    }
    
    // Сбрасываем на первую страницу и закрываем раскрытые строки
    currentPage = 1;
    expandedRowId = null;
    
    // Перерисовываем таблицу
    renderTable();
    renderPageNumbers();
}

// ===== ИНИЦИАЛИЗАЦИЯ =====

/**
 * Основная функция инициализации
 */
function init() {
    // Инициализируем баллы студентов
    initializeStudentScores();
    
    // Инициализируем выпадающие списки
    initDropdowns();
    
    // Инициализация кнопки сброса фильтров
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', resetFilters);
    }
    
    // Устанавливаем начальные значения
    filteredStudents = [...allStudents];
    totalPages = Math.ceil(filteredStudents.length / ROWS_PER_PAGE);
    
    // Отображаем начальные данные
    renderTable();
    renderPageNumbers();
    
    // Назначаем обработчики событий для заголовков таблицы
    tableHeaders.forEach(header => {
        header.addEventListener('click', handleHeaderClick);
    });
    
    // Обработчики пагинации
    searchInput.addEventListener('input', filterStudentsByDropdowns);
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
    
    // Обработчики выпадающих списков
    dropdownHeader.addEventListener('click', () => {
        dropdownList.classList.toggle('show');
        dropdownHeader.classList.toggle('active');
        dropdownArrow.classList.toggle('up');
    });
    
    dropdownHeader2.addEventListener('click', () => {
        dropdownList2.classList.toggle('show');
        dropdownHeader2.classList.toggle('active');
        dropdownArrow2.classList.toggle('up');
    });
    
    dropdownHeader3.addEventListener('click', () => {
        dropdownList3.classList.toggle('show');
        dropdownHeader3.classList.toggle('active');
        dropdownArrow3.classList.toggle('up');
    });
    
    // Закрытие выпадающего списка при клике вне его
    document.addEventListener('click', (e) => {
        if (!dropdownHeader.contains(e.target) && !dropdownList.contains(e.target)) {
            dropdownList.classList.remove('show');
            dropdownHeader.classList.remove('active');
            dropdownArrow.classList.remove('up');
        }
        
        if (!dropdownHeader2.contains(e.target) && !dropdownList2.contains(e.target)) {
            dropdownList2.classList.remove('show');
            dropdownHeader2.classList.remove('active');
            dropdownArrow2.classList.remove('up');
        }
        
        if (!dropdownHeader3.contains(e.target) && !dropdownList3.contains(e.target)) {
            dropdownList3.classList.remove('show');
            dropdownHeader3.classList.remove('active');
            dropdownArrow3.classList.remove('up');
        }
    });
    
    // Обработчик изменения размера окна
    function handleResize() {
        if (expandedRowId !== null) {
            clearTimeout(window.resizeTimer);
            window.resizeTimer = setTimeout(() => {
                renderTable();
            }, 250);
        }
    }
    
    window.addEventListener('resize', handleResize);
}

// ===== МОДАЛЬНОЕ ОКНО (ФОРМА) =====

/**
 * Функция переключения выпадающего меню (для навигации)
 */
function toggleDropdown() {
    document.getElementById("dropdown-menu").classList.toggle("show");
}

/**
 * Обработчики для модального окна
 */
function initModal() {
    // Проверка параметра showModal
    window.onload = function() {
        const shouldShowModal = getQueryParam('showModal');
        if (shouldShowModal === 'true') {
            document.getElementById('myModal').style.display = 'block';
        }
        
        // Закрытие по нажатию на крестик
        document.querySelector('.close').onclick = function() {
            document.getElementById('myModal').style.display = 'none';
        };
        
        // Закрытие по клику вне модального окна
        window.onclick = function(event) {
            const modal = document.getElementById('myModal');
            if (event.target === modal) {
                modal.style.display = 'none';
            }
            
            // Закрытие навигационного dropdown
            if (!event.target.closest('.dropdown')) {
                document.getElementById("dropdown-menu").classList.remove("show");
            }
        };
    };
}

/**
 * Инициализация формы модального окна
 */
function initForm() {
    const nextButton = document.getElementById('next-button');
    const firstPart = document.getElementById('first-part');
    const secondPart = document.getElementById('second-part');
    const form = document.getElementById('first-form');
    const inputs = form.querySelectorAll('input, select');
    
    // Обработчик кнопки "Далее"
    nextButton.addEventListener('click', function() {
        if (validateForm()) {
            firstPart.style.display = 'none';
            secondPart.style.display = 'block';
        }
    });
    
    // Убираем ошибку при вводе
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            const errorElement = document.getElementById(`${input.id}-error`);
            errorElement.style.display = 'none';
            input.style.borderColor = '#ddd';
        });
    });
    
    // Выбор категорий
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
            
            // Сбрасываем сообщение об ошибке при выборе
            errorMessage.textContent = '';
        });
    });
    
    // Обработчик кнопки "Готово"
    submitButton.addEventListener('click', function() {
        if (selectedCategories.length === 0) {
            errorMessage.textContent = 'Пожалуйста, выберите хотя бы одну категорию';
            return;
        }
        
        // Переход к третьей части
        secondPart.style.display = 'none';
        document.getElementById('third-part').style.display = 'block';
    });
    
    // Обработчик кнопки "На главную"
    document.getElementById('home-button').addEventListener('click', function() {
        document.getElementById('myModal').style.display = 'none';
        window.location.href = 'spreadsheet.html';
    });
}

// ===== ТОЧКА ВХОДА =====

/**
 * Основная функция запуска при загрузке страницы
 */
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация модального окна и формы
    initModal();
    initForm();
    
    // Инициализация основной таблицы
    init();
});