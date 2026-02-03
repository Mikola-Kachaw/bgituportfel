import psycopg2
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash


class Database:
    def __init__(self):
        self.conn = self._connect_to_db()

    def _connect_to_db(self):
        """Установка соединения с базой данных"""
        try:
            conn = psycopg2.connect(
                dbname="agrigator",
                user="practika",
                password="bgitu_practika",
                host="127.0.0.1",
                client_encoding="UTF8"
            )
            print("Подключение к базе данных установлено")
            return conn
        except psycopg2.Error as e:
            print(f"Ошибка подключения к базе данных: {e}")
            raise

    def __del__(self):
        """Закрытие соединения при удалении объекта"""
        if hasattr(self, 'conn') and self.conn:
            self.conn.close()
            print("Соединение с базой данных закрыто")

    def get_connection(self):
        """Возвращает соединение с базой данных"""
        if not self.conn or self.conn.closed:
            self.conn = self._connect_to_db()
        return self.conn

    def create_tables(self):
        """Создание всех необходимых таблиц с хэшированными паролями"""
        try:
            with self.conn.cursor() as cursor:
                self.conn.autocommit = True

                # Создаём таблицу roles
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS roles (
                        role_id SERIAL PRIMARY KEY, 
                        name VARCHAR(50) NOT NULL, 
                        description TEXT
                    )
                """)

                # Добавляем стандартные роли
                cursor.execute("""
                    INSERT INTO roles (role_id, name, description)
                    VALUES 
                        (1, 'admin', 'Администратор системы'),
                        (2, 'user', 'Обычный пользователь'),
                        (3, 'organizer', 'Организатор мероприятий')
                    ON CONFLICT (role_id) DO NOTHING
                """)

                # Создаём таблицу users с дополнительными полями
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS users (
                        user_id SERIAL PRIMARY KEY,
                        last_name VARCHAR(100) NOT NULL,
                        first_name VARCHAR(100) NOT NULL,
                        patronymic VARCHAR(100) NOT NULL,
                        login VARCHAR(50) NOT NULL UNIQUE, 
                        email VARCHAR(100) NOT NULL UNIQUE, 
                        role_id INT NOT NULL,
                        password VARCHAR(255) NOT NULL,
                        gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
                        education_level VARCHAR(50) CHECK (education_level IN ('bachelor', 'master', 'postgraduate')),
                        course_number INT CHECK (course_number BETWEEN 1 AND 5),
                        group_name VARCHAR(50),
                        institute VARCHAR(100),
                        avatar_url VARCHAR(255),
                        registration_date TIMESTAMP DEFAULT NOW(),
                        FOREIGN KEY (role_id) REFERENCES roles(role_id)
                    )
                """)

                # Хэшируем пароли перед сохранением
                admin_password = generate_password_hash('admin123')
                organizer_password = generate_password_hash('organizer123')
                user_password = generate_password_hash('user123')

                # Создаём тестовых пользователей
                cursor.execute("""
                    INSERT INTO users (
                        login, password, email, role_id, 
                        last_name, first_name, patronymic,
                        gender, education_level, course_number, group_name
                    )
                    SELECT 
                        'admin', %s, 'admin@example.com', 1,
                        'Иванов', 'Иван', 'Иванович', 'male', NULL, NULL, NULL
                    WHERE NOT EXISTS (SELECT 1 FROM users WHERE login = 'admin')
                """, (admin_password,))

                cursor.execute("""
                    INSERT INTO users (
                        login, password, email, role_id,
                        last_name, first_name, patronymic,
                        gender, education_level, course_number, group_name
                    )
                    SELECT 
                        'organizer', %s, 'organizer@example.com', 3,
                        'Петрова', 'Мария', 'Сергеевна', 'female', NULL, NULL, NULL
                    WHERE NOT EXISTS (SELECT 1 FROM users WHERE login = 'organizer')
                """, (organizer_password,))

                cursor.execute("""
                    INSERT INTO users (
                        login, password, email, role_id,
                        last_name, first_name, patronymic,
                        gender, education_level, course_number, group_name
                    )
                    SELECT 
                        'user', %s, 'user@example.com', 2,
                        'Сидоров', 'Алексей', 'Дмитриевич', 'male', 'bachelor', 2, 'ИВТ-201'
                    WHERE NOT EXISTS (SELECT 1 FROM users WHERE login = 'user')
                """, (user_password,))

                # Таблица для хранения грамот пользователей
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS user_certificates (
                        certificate_id SERIAL PRIMARY KEY,
                        user_id INT NOT NULL,
                        title VARCHAR(255) NOT NULL,
                        description TEXT,
                        image_url VARCHAR(255) NOT NULL,
                        upload_date TIMESTAMP DEFAULT NOW(),
                        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
                    )
                """)

                # Таблица категорий мероприятий
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS categories (
                        category_id SERIAL PRIMARY KEY,
                        name VARCHAR(100) NOT NULL UNIQUE
                    )
                """)

                # Добавляем стандартные категории
                cursor.execute("""
                    INSERT INTO categories (name)
                    VALUES 
                        ('Программирование'),
                        ('Литература'),
                        ('Спорт'),
                        ('Актив'),
                        ('Другое')
                    ON CONFLICT (name) DO NOTHING
                """)

                # Таблица организаторов (расширенная информация)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS organizers (
                        organizer_id SERIAL PRIMARY KEY,
                        user_id INT NOT NULL UNIQUE,
                        organization VARCHAR(255),
                        position VARCHAR(100),
                        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
                    )
                """)

                # Таблица объявлений/мероприятий
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS advertisements (
                        ad_id SERIAL PRIMARY KEY,
                        title VARCHAR(255) NOT NULL,
                        description TEXT NOT NULL,
                        requirements TEXT,
                        rewards TEXT,
                        event_date TIMESTAMP NOT NULL,
                        created_at TIMESTAMP DEFAULT NOW(),
                        category_id INT NOT NULL,
                        organizer_id INT NOT NULL,
                        image_url VARCHAR(255),
                        FOREIGN KEY (category_id) REFERENCES categories(category_id),
                        FOREIGN KEY (organizer_id) REFERENCES organizers(organizer_id)
                    )
                """)

                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS advertisement_images (
                        image_id SERIAL PRIMARY KEY,
                        ad_id INT NOT NULL,
                        image_url VARCHAR(255) NOT NULL,
                        FOREIGN KEY (ad_id) REFERENCES advertisements(ad_id) ON DELETE CASCADE
                    )
                """)

                # Таблица заявок на участие в мероприятиях
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS event_applications (
                        application_id SERIAL PRIMARY KEY,
                        ad_id INT NOT NULL,
                        user_id INT NOT NULL,
                        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
                        application_date TIMESTAMP DEFAULT NOW(),
                        message TEXT,
                        FOREIGN KEY (ad_id) REFERENCES advertisements(ad_id) ON DELETE CASCADE,
                        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                        UNIQUE (ad_id, user_id)
                    )
                """)

                # Таблица для связи организаторов и пользователей (кто кого добавил)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS organizer_assignments (
                        assignment_id SERIAL PRIMARY KEY,
                        admin_id INT NOT NULL,
                        user_id INT NOT NULL,
                        assignment_date TIMESTAMP DEFAULT NOW(),
                        FOREIGN KEY (admin_id) REFERENCES users(user_id),
                        FOREIGN KEY (user_id) REFERENCES users(user_id),
                        UNIQUE (user_id)
                    )
                """)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS user_categories (
                        user_id INT NOT NULL,
                        category_id INT NOT NULL,
                        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                        FOREIGN KEY (category_id) REFERENCES categories(category_id),
                        PRIMARY KEY (user_id, category_id)
                    )
                """)

                cursor.execute("""
                               CREATE TABLE IF NOT EXISTS student_points (
                                   point_id SERIAL PRIMARY KEY,
                                   user_id INT NOT NULL,
                                   category_type VARCHAR(50) NOT NULL,
                                   subcategory VARCHAR(100),
                                   points INT NOT NULL,
                                   description TEXT,
                                   date_awarded TIMESTAMP DEFAULT NOW(),
                                   verified BOOLEAN DEFAULT TRUE,
                                   FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
                               )
                           """)

                # Таблица для категорий баллов
                cursor.execute("""
                               CREATE TABLE IF NOT EXISTS point_categories (
                                   category_id SERIAL PRIMARY KEY,
                                   name VARCHAR(100) NOT NULL UNIQUE,
                                   description TEXT,
                                   max_points INT
                               )
                           """)

                # Добавляем стандартные категории баллов
                cursor.execute("""
                               INSERT INTO point_categories (name, description, max_points)
                               VALUES 
                                   ('study', 'Учебная деятельность', NULL),
                                   ('research', 'Научно-исследовательская деятельность', NULL),
                                   ('creative', 'Творческие конкурсы', NULL),
                                   ('sport', 'Спорт', NULL),
                                   ('social', 'Общественная работа', NULL)
                               ON CONFLICT (name) DO NOTHING
                           """)
                # Таблица для хранения заявок на стипендию
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS scholarship_applications (
                        application_id SERIAL PRIMARY KEY,
                        user_id INT NOT NULL,
                        application_date TIMESTAMP DEFAULT NOW(),
                        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'under_review')),
                        total_points INT DEFAULT 0,
                        study_points INT DEFAULT 0,
                        research_points INT DEFAULT 0,
                        creative_points INT DEFAULT 0,
                        sport_points INT DEFAULT 0,
                        social_points INT DEFAULT 0,
                        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
                    )
                """)

                # Таблица для подкатегорий заявки
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS application_subcategories (
                        subcategory_id SERIAL PRIMARY KEY,
                        application_id INT NOT NULL,
                        category_type VARCHAR(50) NOT NULL,
                        subcategory_name VARCHAR(100) NOT NULL,
                        place INT,
                        description TEXT,
                        points INT DEFAULT 0,
                        FOREIGN KEY (application_id) REFERENCES scholarship_applications(application_id) ON DELETE CASCADE
                    )
                """)

                # Таблица для файлов грамот
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS application_certificates (
                        certificate_id SERIAL PRIMARY KEY,
                        application_id INT NOT NULL,
                        subcategory_id INT,
                        file_path VARCHAR(255) NOT NULL,
                        original_filename VARCHAR(255) NOT NULL,
                        upload_date TIMESTAMP DEFAULT NOW(),
                        FOREIGN KEY (application_id) REFERENCES scholarship_applications(application_id) ON DELETE CASCADE,
                        FOREIGN KEY (subcategory_id) REFERENCES application_subcategories(subcategory_id) ON DELETE CASCADE
                    )
                """)

                self.conn.commit()
                print("Таблицы успешно созданы")
        except psycopg2.Error as e:
            self.conn.rollback()
            print(f"Ошибка при создании таблиц: {e}")
            raise

    def update_user_categories(self, user_id, categories):
        try:
            with self.conn.cursor() as cursor:
                # 1. Удаляем старые категории пользователя
                cursor.execute("DELETE FROM user_categories WHERE user_id = %s", (user_id,))
                print(f"Удалены старые категории для user_id={user_id}")

                # 2. Добавляем новые категории
                for category_name in categories:
                    # Получаем ID категории
                    cursor.execute("""
                        SELECT category_id FROM categories 
                        WHERE name = %s
                    """, (category_name,))
                    category_id = cursor.fetchone()

                    if category_id:
                        # Вставляем правильные столбцы: user_id и category_id
                        cursor.execute("""
                            INSERT INTO user_categories (user_id, category_id)
                            VALUES (%s, %s)
                        """, (user_id, category_id[0]))
                        print(f"Добавлена категория: {category_name} (id={category_id[0]})")
                    else:
                        print(f"Категория не найдена: {category_name}")

                self.conn.commit()
                print("Категории успешно обновлены")
                return True
        except psycopg2.Error as e:
            self.conn.rollback()
            error_msg = f"ОШИБКА БД при обновлении категорий: {e}"
            print(error_msg)
            raise ValueError(error_msg)

    def register_user(self, login: str, password: str, email: str, last_name: str,
                      first_name: str, patronymic: str, gender: str,
                      education_level: str, avatar_url: str = None,
                      role_id: int = 2):
        """Регистрация нового пользователя с хэшированием пароля"""
        try:
            with self.conn.cursor() as cursor:
                print(f"Проверка на существование пользователя с логином: {login} и email: {email}")
                cursor.execute("SELECT user_id FROM users WHERE email = %s OR login = %s", (email, login))
                if cursor.fetchone():
                    raise ValueError("Email или логин уже заняты")

                hashed_password = generate_password_hash(password)
                cursor.execute(
                    """INSERT INTO users 
                    (login, password, email, role_id, last_name, first_name, patronymic,
                     gender, education_level, avatar_url)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING user_id""",
                    (login, hashed_password, email, role_id, last_name, first_name,
                     patronymic, gender, education_level, avatar_url)
                )
                user_id = cursor.fetchone()[0]
                self.conn.commit()
                return user_id
        except psycopg2.Error as e:
            self.conn.rollback()
            raise ValueError(f"Ошибка базы данных: {e}")

    def authenticate_user(self, login: str, password: str):
        """Аутентификация пользователя с проверкой хэша пароля"""
        try:
            with self.conn.cursor() as cursor:
                cursor.execute(
                    "SELECT user_id, password, role_id FROM users WHERE login = %s",
                    (login,)
                )
                user = cursor.fetchone()
                if not user:
                    raise ValueError("Неверный логин или пароль")

                user_id, hashed_password, role_id = user
                if not check_password_hash(hashed_password, password):
                    raise ValueError("Неверный логин или пароль")

                return {"user_id": user_id, "role_id": role_id}
        except psycopg2.Error as e:
            raise ValueError(f"Ошибка базы данных: {e}")

    def get_user_profile(self, user_id: int):
        """Получение данных пользователя"""
        try:
            with self.conn.cursor() as cursor:
                cursor.execute("""
                    SELECT user_id, login, email, last_name, first_name, patronymic,
                           gender, education_level, course_number, group_name,
                           avatar_url, registration_date, role_id
                    FROM users WHERE user_id = %s
                """, (user_id,))
                user_data = cursor.fetchone()
                if not user_data:
                    return None
                columns = [desc[0] for desc in cursor.description]
                return dict(zip(columns, user_data))
        except psycopg2.Error as e:
            raise ValueError(f"Ошибка при получении профиля: {e}")

    def get_advertisement_by_id(self, ad_id):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                # Получаем основную информацию об объявлении
                cursor.execute("""
                    SELECT 
                        a.ad_id, a.title, a.description, a.requirements, a.rewards,
                        a.event_date, a.created_at,
                        c.name as category,
                        u.user_id as organizer_user_id,
                        u.last_name || ' ' || u.first_name as organizer_name,
                        u.avatar_url as organizer_avatar
                    FROM advertisements a
                    JOIN categories c ON a.category_id = c.category_id
                    JOIN organizers o ON a.organizer_id = o.organizer_id
                    JOIN users u ON o.user_id = u.user_id
                    WHERE a.ad_id = %s
                """, (ad_id,))

                ad_data = cursor.fetchone()
                if not ad_data:
                    return None

                columns = [desc[0] for desc in cursor.description]
                ad = dict(zip(columns, ad_data))

                # Получаем ВСЕ изображения объявления из отдельной таблицы
                cursor.execute("""
                    SELECT image_id, image_url 
                    FROM advertisement_images 
                    WHERE ad_id = %s
                    ORDER BY image_id
                """, (ad_id,))

                ad['images'] = [dict(zip(['image_id', 'image_url'], row)) for row in cursor.fetchall()]

                # Для совместимости со старым кодом оставляем image_url
                if ad['images']:
                    ad['image_url'] = ad['images'][0]['image_url']
                else:
                    ad['image_url'] = None

                return ad

    def get_user_application_for_ad(self, user_id, ad_id):
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT * FROM event_applications 
                    WHERE user_id = %s AND ad_id = %s
                """, (user_id, ad_id))
                result = cursor.fetchone()
                if result:
                    columns = [desc[0] for desc in cursor.description]
                    return dict(zip(columns, result))
        return None

    def create_scholarship_application(self, user_id, data):
        """Создание новой заявки на стипендию"""
        try:
            with self.conn.cursor() as cursor:
                # Вставляем основную заявку
                cursor.execute("""
                    INSERT INTO scholarship_applications 
                    (user_id, total_points, study_points, research_points, 
                     creative_points, sport_points, social_points)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    RETURNING application_id
                """, (
                    user_id,
                    data.get('total_points', 0),
                    data.get('study_points', 0),
                    data.get('research_points', 0),
                    data.get('creative_points', 0),
                    data.get('sport_points', 0),
                    data.get('social_points', 0)
                ))

                application_id = cursor.fetchone()[0]

                self.conn.commit()
                return application_id

        except Exception as e:
            self.conn.rollback()
            raise ValueError(f"Ошибка при создании заявки: {e}")

    def add_application(self, user_id: int, ad_id: int, message: str = None):
        """Добавление заявки на участие в мероприятии"""
        try:
            with self.conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO event_applications 
                    (user_id, ad_id, message, application_date)
                    VALUES (%s, %s, %s, %s)
                """, (user_id, ad_id, message, datetime.now()))
                self.conn.commit()
                return True
        except psycopg2.Error as e:
            self.conn.rollback()
            raise ValueError(f"Ошибка при добавлении заявки: {e}")

    def update_application_status(self, application_id: int, status: str):
        """Обновление статуса заявки"""
        try:
            with self.conn.cursor() as cursor:
                cursor.execute("""
                    UPDATE event_applications 
                    SET status = %s
                    WHERE application_id = %s
                """, (status, application_id))
                self.conn.commit()
                return True
        except psycopg2.Error as e:
            self.conn.rollback()
            raise ValueError(f"Ошибка при обновлении статуса заявки: {e}")

    def create_advertisement(self, title: str, description: str,
                             requirements: str, rewards: str, event_date: datetime,
                             category_id: int, organizer_id: int, image_url: str = None):
        """Создание нового объявления/мероприятия"""
        try:
            with self.conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO advertisements 
                    (title, description, requirements, rewards,
                     event_date, category_id, organizer_id, image_url, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING ad_id
                """, (title, description, requirements, rewards,
                      event_date, category_id, organizer_id, image_url, datetime.now()))
                ad_id = cursor.fetchone()[0]
                self.conn.commit()
                return ad_id
        except psycopg2.Error as e:
            self.conn.rollback()
            raise ValueError(f"Ошибка при создании объявления: {e}")

    def get_user_certificates(self, user_id: int):
        """Получение грамот пользователя"""
        try:
            with self.conn.cursor() as cursor:
                cursor.execute("""
                    SELECT certificate_id, title, description, image_url, upload_date
                    FROM user_certificates
                    WHERE user_id = %s
                    ORDER BY upload_date DESC
                """, (user_id,))

                result = cursor.fetchall()
                if result:
                    columns = [desc[0] for desc in cursor.description]
                    return [dict(zip(columns, row)) for row in result]
                return []
        except Exception as e:
            print(f"Ошибка при получении грамот: {e}")
            return []

    def add_certificate(self, user_id: int, title: str, description: str, image_url: str):
        """Добавление грамоты пользователя с поддержкой нескольких файлов"""
        try:
            with self.conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO user_certificates 
                    (user_id, title, description, image_url)
                    VALUES (%s, %s, %s, %s)
                    RETURNING certificate_id
                """, (user_id, title, description, image_url))

                certificate_id = cursor.fetchone()[0]

                self.conn.commit()
                return True
        except psycopg2.Error as e:
            self.conn.rollback()
            raise ValueError(f"Ошибка при добавлении грамоты: {e}")

    def assign_organizer_role(self, admin_id: int, user_id: int):
        """Назначение пользователю роли организатора"""
        try:
            with self.conn.cursor() as cursor:
                # Проверяем, что текущий пользователь - администратор
                cursor.execute("SELECT role_id FROM users WHERE user_id = %s", (admin_id,))
                admin_role = cursor.fetchone()
                if not admin_role or admin_role[0] != 1:
                    raise ValueError("Только администратор может назначать организаторов")

                # Обновляем роль пользователя
                cursor.execute("""
                    UPDATE users SET role_id = 3 WHERE user_id = %s
                """, (user_id,))

                # Добавляем запись о назначении
                cursor.execute("""
                    INSERT INTO organizer_assignments (admin_id, user_id)
                    VALUES (%s, %s)
                """, (admin_id, user_id))

                # Создаем запись в таблице организаторов
                cursor.execute("""
                    INSERT INTO organizers (user_id, organization, position)
                    VALUES (%s, 'Не указано', 'Организатор')
                    ON CONFLICT (user_id) DO NOTHING
                """, (user_id,))

                self.conn.commit()
                return True
        except psycopg2.Error as e:
            self.conn.rollback()
            raise ValueError(f"Ошибка при назначении роли организатора: {e}")

    def get_organizer_ads(self, organizer_id: int):
        """Получение объявлений организатора"""
        try:
            with self.conn.cursor() as cursor:
                cursor.execute("""
                    SELECT a.ad_id, a.title, a.event_date, a.created_at,
                           c.name as category, COUNT(ea.application_id) as applications_count
                    FROM advertisements a
                    JOIN categories c ON a.category_id = c.category_id
                    LEFT JOIN event_applications ea ON a.ad_id = ea.ad_id
                    JOIN organizers o ON a.organizer_id = o.organizer_id
                    WHERE o.user_id = %s
                    GROUP BY a.ad_id, a.title, a.event_date, a.created_at, c.name
                    ORDER BY a.event_date DESC
                """, (organizer_id,))

                result = cursor.fetchall()
                if result:
                    columns = [desc[0] for desc in cursor.description]
                    return [dict(zip(columns, row)) for row in result]
                return []
        except Exception as e:
            print(f"Ошибка при получении объявлений организатора: {e}")
            return []

    def revoke_organizer_role(self, admin_id: int, user_id: int):
        """Отмена роли организатора"""
        try:
            with self.conn.cursor() as cursor:
                # Проверяем, что текущий пользователь - администратор
                cursor.execute("SELECT role_id FROM users WHERE user_id = %s", (admin_id,))
                admin_role = cursor.fetchone()
                if not admin_role or admin_role[0] != 1:
                    raise ValueError("Только администратор может отменять роли организаторов")

                # Обновляем роль пользователя
                cursor.execute("""
                    UPDATE users SET role_id = 2 WHERE user_id = %s
                """, (user_id,))

                # Удаляем запись о назначении
                cursor.execute("""
                    DELETE FROM organizer_assignments WHERE user_id = %s
                """, (user_id,))

                # Удаляем запись из таблицы организаторов
                cursor.execute("""
                    DELETE FROM organizers WHERE user_id = %s
                """, (user_id,))

                self.conn.commit()
                return True
        except psycopg2.Error as e:
            self.conn.rollback()
            raise ValueError(f"Ошибка при отмене роли организатора: {e}")

    def get_all_students_with_points(self):
        """Получение всех студентов с их баллами"""
        try:
            with self.conn.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        u.user_id,
                        u.last_name || ' ' || u.first_name || ' ' || u.patronymic as fio,
                        u.group_name,
                        u.institute,
                        u.course_number,
                        COALESCE(SUM(CASE WHEN sp.category_type = 'study' THEN sp.points ELSE 0 END), 0) as study_points,
                        COALESCE(SUM(CASE WHEN sp.category_type = 'research' THEN sp.points ELSE 0 END), 0) as research_points,
                        COALESCE(SUM(CASE WHEN sp.category_type = 'creative' THEN sp.points ELSE 0 END), 0) as creative_points,
                        COALESCE(SUM(CASE WHEN sp.category_type = 'sport' THEN sp.points ELSE 0 END), 0) as sport_points,
                        COALESCE(SUM(CASE WHEN sp.category_type = 'social' THEN sp.points ELSE 0 END), 0) as social_points,
                        COALESCE(SUM(sp.points), 0) as total_points
                    FROM users u
                    LEFT JOIN student_points sp ON u.user_id = sp.user_id
                    WHERE u.role_id = 2  -- обычные пользователи (студенты)
                    GROUP BY u.user_id, u.last_name, u.first_name, u.patronymic, 
                             u.group_name, u.institute, u.course_number
                    ORDER BY total_points DESC
                """)

                columns = [desc[0] for desc in cursor.description]
                students = []

                for row in cursor.fetchall():
                    student_dict = dict(zip(columns, row))
                    # Преобразуем типы данных
                    student_dict['study'] = int(student_dict['study_points'])
                    student_dict['research'] = int(student_dict['research_points'])
                    student_dict['creative'] = int(student_dict['creative_points'])
                    student_dict['sport'] = int(student_dict['sport_points'])
                    student_dict['social'] = int(student_dict['social_points'])
                    student_dict['total'] = int(student_dict['total_points'])
                    students.append(student_dict)

                return students
        except psycopg2.Error as e:
            print(f"Ошибка при получении студентов: {e}")
            return []

    def get_student_detailed_points(self, user_id):
        """Получение детальной информации о баллах студента"""
        try:
            with self.conn.cursor() as cursor:
                # Основная информация о студенте
                cursor.execute("""
                    SELECT 
                        u.user_id,
                        u.last_name || ' ' || u.first_name || ' ' || u.patronymic as fio,
                        u.group_name,
                        u.institute,
                        u.course_number
                    FROM users u
                    WHERE u.user_id = %s
                """, (user_id,))

                student_info = cursor.fetchone()
                if not student_info:
                    return None

                columns = [desc[0] for desc in cursor.description]
                student = dict(zip(columns, student_info))

                # Детальные баллы
                cursor.execute("""
                    SELECT 
                        category_type,
                        subcategory,
                        points,
                        description,
                        date_awarded
                    FROM student_points
                    WHERE user_id = %s
                    ORDER BY category_type, date_awarded DESC
                """, (user_id,))

                detailed_points = cursor.fetchall()
                point_columns = [desc[0] for desc in cursor.description]

                # Группируем баллы по категориям
                student['studyDetails'] = {
                    'performance': [],
                    'olympiads': [],
                    'additionalPrograms': []
                }
                student['researchDetails'] = {
                    'scienceCompetitions': [],
                    'publications': [],
                    'conferences': []
                }
                student['creativeDetails'] = {
                    'competitions': []
                }
                student['sportDetails'] = {
                    'membership': '',
                    'achievements': []
                }
                student['socialDetails'] = {
                    'roles': []
                }

                for point in detailed_points:
                    point_dict = dict(zip(point_columns, point))
                    category = point_dict['category_type']
                    subcategory = point_dict['subcategory'] or ''

                    # Добавляем баллы в соответствующие категории
                    if category == 'study':
                        if 'олимпиад' in subcategory.lower():
                            student['studyDetails']['olympiads'].append({
                                'name': subcategory,
                                'value': point_dict['points']
                            })
                        elif 'успеваемость' in subcategory.lower():
                            student['studyDetails']['performance'].append({
                                'name': subcategory,
                                'value': point_dict['points']
                            })
                        else:
                            student['studyDetails']['additionalPrograms'].append({
                                'name': subcategory,
                                'value': point_dict['points']
                            })
                    elif category == 'research':
                        if 'конкурс' in subcategory.lower():
                            student['researchDetails']['scienceCompetitions'].append({
                                'name': subcategory,
                                'value': point_dict['points']
                            })
                        elif 'публикация' in subcategory.lower():
                            student['researchDetails']['publications'].append({
                                'name': subcategory,
                                'value': point_dict['points']
                            })
                        elif 'конференция' in subcategory.lower():
                            student['researchDetails']['conferences'].append({
                                'name': subcategory,
                                'value': point_dict['points']
                            })
                    elif category == 'creative':
                        student['creativeDetails']['competitions'].append({
                            'name': subcategory,
                            'value': point_dict['points']
                        })
                    elif category == 'sport':
                        if 'член' in subcategory.lower():
                            student['sportDetails']['membership'] = subcategory
                        else:
                            student['sportDetails']['achievements'].append({
                                'name': subcategory,
                                'value': point_dict['points']
                            })
                    elif category == 'social':
                        student['socialDetails']['roles'].append({
                            'name': subcategory,
                            'value': point_dict['points']
                        })

                return student
        except psycopg2.Error as e:
            print(f"Ошибка при получении детальной информации: {e}")
            return None

    def add_student_points(self, user_id, category_type, subcategory, points, description=None):
        """Добавление баллов студенту"""
        try:
            with self.conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO student_points 
                    (user_id, category_type, subcategory, points, description)
                    VALUES (%s, %s, %s, %s, %s)
                """, (user_id, category_type, subcategory, points, description))
                self.conn.commit()
                return True
        except psycopg2.Error as e:
            self.conn.rollback()
            print(f"Ошибка при добавлении баллов: {e}")
            return False