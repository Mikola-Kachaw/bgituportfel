        // Конфигурация баллов из Excel
        const POINTS_CONFIG = {
            study: {
                performance_excellent: 2,
                performance_good: 1,
                olympiads_international: {1: 6, 2: 5, 3: 3},
                olympiads_russian: {1: 4, 2: 3, 3: 2},
                olympiads_university: {1: 3, 2: 2, 3: 1},
                additional_programs: 1
            },
            research: {
                science_competitions_international: {1: 6, 2: 5, 3: 3},
                science_competitions_russian: {1: 4, 2: 3, 3: 2},
                science_competitions_university: {1: 3, 2: 2, 3: 1},
                publications_vak: 3,
                publications_other: 1,
                conferences: 1
            },
            creative: {
                competitions_international: {1: 6, 2: 5, 3: 3},
                competitions_russian: {1: 4, 2: 3, 3: 2},
                competitions_university: {1: 3, 2: 2, 3: 1}
            },
            sport: {
                msmk: 8,
                team_russia: 8,
                world_winner: 8,
                russia_winner: 6,
                cfo_winner: 5,
                region_winner: 4,
                world_prize: 4,
                russia_prize: 3,
                cfo_prize: 2,
                region_prize: 1,
                promo: 1
            },
            social: {
                starosta: 2,
                profsoyuz: 2,
                volunteer: 2,
                proforientation: 2
            }
        };

        // Максимальные баллы по категориям (расчет из Excel)
        const MAX_POINTS = {
            study: 14,    // 2 + 6 + 4 + 3 + 1? (учитываем только основные категории)
            research: 23,  // 6 + 4 + 3 + 3 + 1 + 1?
            creative: 15,  // 6 + 4 + 3 + 2?
            sport: 25,     // 8 + 8 + 8 + 6 + 5 + 4 + 4 + 1
            social: 8      // 2 + 2 + 2 + 2
        };

        // Текущие баллы пользователя
        let userPoints = {
            study: 0,
            research: 0,
            creative: 0,
            sport: 0,
            social: 0,
            total: 0
        };

        // Инициализация максимальных баллов
        document.getElementById('studyMaxPoints').textContent = MAX_POINTS.study;
        document.getElementById('researchMaxPoints').textContent = MAX_POINTS.research;
        document.getElementById('creativeMaxPoints').textContent = MAX_POINTS.creative;
        document.getElementById('sportMaxPoints').textContent = MAX_POINTS.sport;
        document.getElementById('socialMaxPoints').textContent = MAX_POINTS.social;

        // Функция для расчета баллов
        function calculatePoints() {
            // Сброс баллов
            userPoints = {
                study: 0,
                research: 0,
                creative: 0,
                sport: 0,
                social: 0,
                total: 0
            };

            // Учебная деятельность
            // Успеваемость
            const performance = document.querySelector('input[name="study_performance"]:checked');
            if (performance) {
                userPoints.study += parseInt(performance.dataset.points);
            }

            // Олимпиады
            const olympiadsInternational = document.querySelector('select[name="olympiads_international"]');
            const olympiadsRussian = document.querySelector('select[name="olympiads_russian"]');
            const olympiadsUniversity = document.querySelector('select[name="olympiads_university"]');

            [olympiadsInternational, olympiadsRussian, olympiadsUniversity].forEach((select, index) => {
                if (select && select.value !== '0') {
                    const place = parseInt(select.value);
                    let points = 0;

                    if (index === 0) points = POINTS_CONFIG.study.olympiads_international[place];
                    else if (index === 1) points = POINTS_CONFIG.study.olympiads_russian[place];
                    else if (index === 2) points = POINTS_CONFIG.study.olympiads_university[place];

                    userPoints.study += points;
                }
            });

            // Дополнительные программы
            const additionalPrograms = document.querySelector('input[name="additional_programs_count"]');
            if (additionalPrograms && additionalPrograms.value > 0) {
                userPoints.study += parseInt(additionalPrograms.value) * POINTS_CONFIG.study.additional_programs;
            }

            // Научно-исследовательская деятельность
            // Научные конкурсы
            const sciCompInternational = document.querySelector('select[name="science_competitions_international"]');
            const sciCompRussian = document.querySelector('select[name="science_competitions_russian"]');
            const sciCompUniversity = document.querySelector('select[name="science_competitions_university"]');

            [sciCompInternational, sciCompRussian, sciCompUniversity].forEach((select, index) => {
                if (select && select.value !== '0') {
                    const place = parseInt(select.value);
                    let points = 0;

                    if (index === 0) points = POINTS_CONFIG.research.science_competitions_international[place];
                    else if (index === 1) points = POINTS_CONFIG.research.science_competitions_russian[place];
                    else if (index === 2) points = POINTS_CONFIG.research.science_competitions_university[place];

                    userPoints.research += points;
                }
            });

            // Публикации
            const publicationsVak = document.querySelector('input[name="publications_vak_count"]');
            const publicationsOther = document.querySelector('input[name="publications_other_count"]');

            if (publicationsVak && publicationsVak.value > 0) {
                userPoints.research += parseInt(publicationsVak.value) * POINTS_CONFIG.research.publications_vak;
            }

            if (publicationsOther && publicationsOther.value > 0) {
                userPoints.research += parseInt(publicationsOther.value) * POINTS_CONFIG.research.publications_other;
            }

            // Конференции
            const conferences = document.querySelector('input[name="conferences_count"]');
            if (conferences && conferences.value > 0) {
                userPoints.research += parseInt(conferences.value) * POINTS_CONFIG.research.conferences;
            }

            // Творческие конкурсы
            const creativeInternational = document.querySelector('select[name="creative_competitions_international"]');
            const creativeRussian = document.querySelector('select[name="creative_competitions_russian"]');
            const creativeUniversity = document.querySelector('select[name="creative_competitions_university"]');

            [creativeInternational, creativeRussian, creativeUniversity].forEach((select, index) => {
                if (select && select.value !== '0') {
                    const place = parseInt(select.value);
                    let points = 0;

                    if (index === 0) points = POINTS_CONFIG.creative.competitions_international[place];
                    else if (index === 1) points = POINTS_CONFIG.creative.competitions_russian[place];
                    else if (index === 2) points = POINTS_CONFIG.creative.competitions_university[place];

                    userPoints.creative += points;
                }
            });

            // Спорт
            // Чекбоксы
            const sportMsmk = document.querySelector('input[name="sport_msmk"]');
            const sportTeamRussia = document.querySelector('input[name="sport_team_russia"]');

            if (sportMsmk && sportMsmk.checked) userPoints.sport += POINTS_CONFIG.sport.msmk;
            if (sportTeamRussia && sportTeamRussia.checked) userPoints.sport += POINTS_CONFIG.sport.team_russia;

            // Победители
            const sportWorldWinner = document.querySelector('select[name="sport_world_winner"]');
            const sportRussiaWinner = document.querySelector('select[name="sport_russia_winner"]');
            const sportCfoWinner = document.querySelector('select[name="sport_cfo_winner"]');
            const sportRegionWinner = document.querySelector('select[name="sport_region_winner"]');

            if (sportWorldWinner && sportWorldWinner.value !== '0') userPoints.sport += POINTS_CONFIG.sport.world_winner;
            if (sportRussiaWinner && sportRussiaWinner.value !== '0') userPoints.sport += POINTS_CONFIG.sport.russia_winner;
            if (sportCfoWinner && sportCfoWinner.value !== '0') userPoints.sport += POINTS_CONFIG.sport.cfo_winner;
            if (sportRegionWinner && sportRegionWinner.value !== '0') userPoints.sport += POINTS_CONFIG.sport.region_winner;

            // Призеры
            const sportWorldPrize = document.querySelector('select[name="sport_world_prize"]');
            const sportRussiaPrize = document.querySelector('select[name="sport_russia_prize"]');
            const sportCfoPrize = document.querySelector('select[name="sport_cfo_prize"]');
            const sportRegionPrize = document.querySelector('select[name="sport_region_prize"]');

            if (sportWorldPrize && sportWorldPrize.value !== '0') userPoints.sport += POINTS_CONFIG.sport.world_prize;
            if (sportRussiaPrize && sportRussiaPrize.value !== '0') userPoints.sport += POINTS_CONFIG.sport.russia_prize;
            if (sportCfoPrize && sportCfoPrize.value !== '0') userPoints.sport += POINTS_CONFIG.sport.cfo_prize;
            if (sportRegionPrize && sportRegionPrize.value !== '0') userPoints.sport += POINTS_CONFIG.sport.region_prize;

            // Популяризация спорта
            const sportPromo = document.querySelector('input[name="sport_promo"]');
            if (sportPromo && sportPromo.checked) userPoints.sport += POINTS_CONFIG.sport.promo;

            // Общественная работа
            const socialStarosta = document.querySelector('input[name="social_starosta"]');
            const socialProfsoyuz = document.querySelector('input[name="social_profsoyuz"]');
            const socialVolunteer = document.querySelector('input[name="social_volunteer"]');
            const socialProforientation = document.querySelector('input[name="social_proforientation"]');

            if (socialStarosta && socialStarosta.checked) userPoints.social += POINTS_CONFIG.social.starosta;
            if (socialProfsoyuz && socialProfsoyuz.checked) userPoints.social += POINTS_CONFIG.social.profsoyuz;
            if (socialVolunteer && socialVolunteer.checked) userPoints.social += POINTS_CONFIG.social.volunteer;
            if (socialProforientation && socialProforientation.checked) userPoints.social += POINTS_CONFIG.social.proforientation;

            // Общий итог
            userPoints.total = userPoints.study + userPoints.research + userPoints.creative + userPoints.sport + userPoints.social;

            // Обновление интерфейса
            updateUI();
        }

        // Функция обновления интерфейса
        function updateUI() {
            // Обновление отображения баллов
            document.getElementById('studyUserPoints').textContent = userPoints.study;
            document.getElementById('researchUserPoints').textContent = userPoints.research;
            document.getElementById('creativeUserPoints').textContent = userPoints.creative;
            document.getElementById('sportUserPoints').textContent = userPoints.sport;
            document.getElementById('socialUserPoints').textContent = userPoints.social;

            // Обновление скрытых полей
            document.getElementById('studyPointsInput').value = userPoints.study;
            document.getElementById('researchPointsInput').value = userPoints.research;
            document.getElementById('creativePointsInput').value = userPoints.creative;
            document.getElementById('sportPointsInput').value = userPoints.sport;
            document.getElementById('socialPointsInput').value = userPoints.social;
            document.getElementById('totalPointsInput').value = userPoints.total;

            // Обновление сводки
            document.getElementById('studySummary').textContent = `${userPoints.study} / ${MAX_POINTS.study}`;
            document.getElementById('researchSummary').textContent = `${userPoints.research} / ${MAX_POINTS.research}`;
            document.getElementById('creativeSummary').textContent = `${userPoints.creative} / ${MAX_POINTS.creative}`;
            document.getElementById('sportSummary').textContent = `${userPoints.sport} / ${MAX_POINTS.sport}`;
            document.getElementById('socialSummary').textContent = `${userPoints.social} / ${MAX_POINTS.social}`;
            document.getElementById('totalSummary').textContent = `${userPoints.total} / ${MAX_POINTS.study + MAX_POINTS.research + MAX_POINTS.creative + MAX_POINTS.sport + MAX_POINTS.social}`;
        }

        // Добавление обработчиков событий
        function setupEventListeners() {
            // Обработчики для всех элементов ввода
            const inputs = document.querySelectorAll('input, select');
            inputs.forEach(input => {
                input.addEventListener('change', calculatePoints);
                input.addEventListener('input', calculatePoints);
            });

            // Обработчик для выбора файлов
            const fileInput = document.getElementById('fileInput');
            const fileList = document.getElementById('fileList');

            fileInput.addEventListener('change', function() {
                fileList.innerHTML = '';
                if (this.files.length > 0) {
                    for (let i = 0; i < this.files.length; i++) {
                        const file = this.files[i];
                        const fileItem = document.createElement('div');
                        fileItem.style.marginBottom = '5px';
                        fileItem.innerHTML = `
                            <span>${file.name} (${(file.size / 1024).toFixed(1)} KB)</span>
                        `;
                        fileList.appendChild(fileItem);
                    }
                }
            });

            // Drag and drop для файлов
            const dropArea = document.getElementById('dropArea');
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
                    fileInput.files = e.dataTransfer.files;
                    fileInput.dispatchEvent(new Event('change'));
                }
            });

            dropArea.addEventListener('click', () => fileInput.click());
        }

        // Валидация формы
        function setupFormValidation() {
            const form = document.getElementById('scholarshipForm');

            form.addEventListener('submit', function(event) {
                let isValid = true;
                let errorMessage = '';

                // Проверка наличия файлов грамот
                const fileInput = document.getElementById('fileInput');
                if (fileInput.files.length === 0) {
                    isValid = false;
                    errorMessage = 'Пожалуйста, прикрепите хотя бы одну грамоту или подтверждающий документ';
                }

                // Проверка, что хотя бы в одной категории есть баллы
                if (userPoints.total === 0) {
                    isValid = false;
                    errorMessage = 'Для подачи заявки необходимо указать хотя бы одно достижение';
                }

                if (!isValid) {
                    event.preventDefault();
                    alert(errorMessage);
                }
            });
        }

        // Инициализация при загрузке страницы
        document.addEventListener('DOMContentLoaded', function() {
            setupEventListeners();
            setupFormValidation();
            calculatePoints(); // Первоначальный расчет

            // Инициализация dropdown меню
            window.toggleDropdown = function() {
                document.getElementById("dropdown-menu").classList.toggle("show");
            };

            window.onclick = function(event) {
                if (!event.target.closest('.dropdown')) {
                    document.getElementById("dropdown-menu").classList.remove("show");
                }
            };
        });