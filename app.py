from flask import Flask, render_template, request, redirect, url_for, make_response, flash, abort, jsonify, session
from datetime import datetime
from database.database import Database
from functools import wraps
import os
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash
import uuid

UPLOAD_FOLDER = 'static/uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

app = Flask(__name__)
app.secret_key = os.urandom(24).hex()
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

db = Database()


def datetimeformat(value, format='%d.%m.%Y %H:%M'):
    if value is None:
        return ""
    try:
        return value.strftime(format)
    except:
        return ""


app.jinja_env.filters['datetimeformat'] = datetimeformat


def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf'}

    return '.' in filename and \
        filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_id = request.cookies.get('user_id')
        if not user_id or not user_id.isdigit():
            return redirect(url_for('login_page'))
        return f(*args, **kwargs)

    return decorated_function


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        role_id = request.cookies.get('role_id')
        if role_id != "1":
            abort(403)
        return f(*args, **kwargs)

    return decorated_function


def organizer_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        role_id = request.cookies.get('role_id')
        if role_id != "3":
            abort(403)
        return f(*args, **kwargs)

    return decorated_function


@app.route('/')
def show_main_page():
    current_hour = datetime.now().hour
    if 5 <= current_hour < 12:
        greeting = "Доброе утро"
    elif 12 <= current_hour < 18:
        greeting = "Добрый день"
    elif 18 <= current_hour < 23:
        greeting = "Добрый вечер"
    else:
        greeting = "Доброй ночи"
    try:
        user_id = request.cookies.get('user_id')
        user_data = None
        if user_id and user_id.isdigit():
            user_data = db.get_user_profile(int(user_id))

        return render_template('index.html', user=user_data, greeting=greeting)
    except Exception as e:
        return render_template('not_found.html', error=str(e)), 500


@app.route('/register', methods=['GET', 'POST'])
@admin_required
def register_page():
    if request.method == 'POST':
        try:
            # Получаем данные из формы
            login = request.form.get('login')
            password = request.form.get('password')
            email = request.form.get('email')
            last_name = request.form.get('last_name')
            first_name = request.form.get('first_name')
            patronymic = request.form.get('patronymic')
            gender = request.form.get('gender')
            education_level = request.form.get('education_level')

            # Обработка аватара
            avatar_url = None
            if 'avatar' in request.files:
                file = request.files['avatar']
                if file and allowed_file(file.filename):
                    filename = secure_filename(file.filename)
                    file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                    avatar_url = f"uploads/{filename}"

            # Регистрируем пользователя
            db.register_user(
                login=login,
                password=password,
                email=email,
                last_name=last_name,
                first_name=first_name,
                patronymic=patronymic,
                gender=gender,
                education_level=education_level,
                avatar_url=avatar_url
            )

            # Аутентифицируем пользователя
            user = db.authenticate_user(login, password)
            if not user:
                raise ValueError("Ошибка аутентификации после регистрации")

            # Сохраняем user_id в сессии для завершения регистрации
            session['temp_user_id'] = user["user_id"]

            # Перенаправляем на главную с параметром для модального окна
            response = redirect(url_for('show_main_page') + '?registration=success')
            response.set_cookie('user_id', str(user["user_id"]))
            response.set_cookie('role_id', str(user["role_id"]))
            return response

        except Exception as e:
            return render_template("register.html", error=str(e)), 400
    else:
        # GET-запрос: просто отображаем страницу регистрации
        return render_template("register.html")

@app.route('/login', methods=['GET'])
def login_page():
    message = request.args.get('message')
    return render_template("auth.html", message=message)


@app.route('/login', methods=['POST'])
def login_user():
    try:
        login = request.form.get('login')
        password = request.form.get('password')

        if not login or not password:
            return render_template("auth.html", error="Логин и пароль обязательны для заполнения"), 400

        user = db.authenticate_user(login, password)
        if not user:
            return render_template("auth.html", error="Неверный логин или пароль"), 401

        response = redirect(url_for('show_main_page'))
        response.set_cookie('user_id', str(user["user_id"]))
        response.set_cookie('role_id', str(user["role_id"]))
        return response
    except ValueError as e:
        return render_template("auth.html", error=str(e)), 400
    except Exception as e:
        return render_template("auth.html", error="Произошла ошибка при авторизации"), 500


@app.route('/logout')
def logout():
    response = redirect(url_for('show_main_page'))
    response.delete_cookie('user_id')
    response.delete_cookie('role_id')
    return response


@app.route('/profile/<int:user_id>')
def view_user_profile(user_id):
    try:
        # Получаем профиль просматриваемого пользователя
        viewed_user = db.get_user_profile(user_id)
        if not viewed_user:
            abort(404, "Пользователь не найден")

        # Получаем грамоты пользователя
        certificates = db.get_user_certificates(user_id)

        # Получаем данные текущего пользователя из куки
        current_user_id = request.cookies.get('user_id')
        current_user = None
        if current_user_id and current_user_id.isdigit():
            current_user = db.get_user_profile(int(current_user_id))

        return render_template(
            "profile.html",
            user=current_user,  # Передаем текущего пользователя
            viewed_user=viewed_user,  # Передаем просматриваемого пользователя
            certificates=certificates
        )
    except Exception as e:
        abort(500, str(e))


@app.route('/advertisement/<int:ad_id>')
def show_advertisement(ad_id):
    try:
        user_id = request.cookies.get('user_id')
        user = None
        user_application = None

        if user_id and user_id.isdigit():
            user = db.get_user_profile(int(user_id))
            # Получаем заявку пользователя на это объявление
            user_application = db.get_user_application_for_ad(user_id, ad_id)

        ad = db.get_advertisement_by_id(ad_id)
        if not ad:
            return render_template("not_found.html", message="Объявление не найдено", user=user), 404

        return render_template(
            "newsObject.html",
            ad=ad,
            user=user,
            user_application=user_application  # Добавьте это
        )
    except Exception as e:
        app.logger.error(f"Ошибка при загрузке объявления: {str(e)}")
        return render_template("not_found.html", message="Произошла ошибка при загрузке объявления",
                               user=user if 'user' in locals() else None), 500


@app.route('/add-application', methods=['POST'])
@login_required
def add_application():
    user_id = request.cookies.get('user_id')
    if not user_id or not user_id.isdigit():
        abort(403)

    try:
        ad_id = request.form.get('ad_id')
        message = request.form.get('message')

        # Проверяем, есть ли уже заявка от этого пользователя
        with db.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT 1 FROM event_applications 
                    WHERE ad_id = %s AND user_id = %s
                """, (ad_id, user_id))

                if cursor.fetchone():
                    flash('Вы уже подавали заявку на это мероприятие', 'warning')
                    return redirect(url_for('show_advertisement', ad_id=ad_id))

                # Если заявки нет, создаем новую
                cursor.execute("""
                    INSERT INTO event_applications 
                    (user_id, ad_id, message, application_date)
                    VALUES (%s, %s, %s, %s)
                """, (user_id, ad_id, message, datetime.now()))
                conn.commit()

        flash('Заявка успешно подана!', 'success')
        return redirect(url_for('show_advertisement', ad_id=ad_id))
    except Exception as e:
        conn.rollback()
        flash(f'Ошибка при подаче заявки: {str(e)}', 'error')
        return redirect(url_for('show_advertisement', ad_id=ad_id))


@app.route('/admin')
@admin_required
def admin_panel():
    user_id = request.cookies.get('user_id')
    try:
        # Получаем полный профиль текущего пользователя
        current_user = db.get_user_profile(int(user_id)) if user_id and user_id.isdigit() else None

        with db.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT u.user_id, u.login, u.last_name || ' ' || u.first_name as full_name, r.name as role
                    FROM users u
                    JOIN roles r ON u.role_id = r.role_id
                    ORDER BY u.user_id
                    LIMIT 20
                """)
                users = []
                if cursor.description:
                    columns = [desc[0] for desc in cursor.description]
                    users = [dict(zip(columns, row)) for row in cursor.fetchall()]

                cursor.execute("""
                    SELECT a.ad_id, a.title, u.last_name || ' ' || u.first_name as organizer_name
                    FROM advertisements a
                    JOIN organizers o ON a.organizer_id = o.organizer_id
                    JOIN users u ON o.user_id = u.user_id
                    ORDER BY a.created_at DESC
                    LIMIT 20
                """)
                ads = []
                if cursor.description:
                    columns = [desc[0] for desc in cursor.description]
                    ads = [dict(zip(columns, row)) for row in cursor.fetchall()]

        return render_template("admin-panel.html",
                               user=current_user,  # Передаем полный профиль
                               users=users,
                               ads=ads
                               )
    except Exception as e:
        print(f"Ошибка в admin_panel: {str(e)}")
        abort(500, "Внутренняя ошибка сервера")


@app.route('/admin/delete-advertisement', methods=['POST'])
@admin_required
def delete_advertisement():
    try:
        ad_id = request.form.get('ad_id')
        if not ad_id or not ad_id.isdigit():
            return jsonify({"success": False, "error": "Некорректный ID объявления"}), 400

        with db.get_connection() as conn:
            with conn.cursor() as cursor:
                # Проверяем существование объявления
                cursor.execute("SELECT 1 FROM advertisements WHERE ad_id = %s", (ad_id,))
                if not cursor.fetchone():
                    return jsonify({"success": False, "error": "Объявление не найдено"}), 404

                # Удаляем связанные изображения
                cursor.execute("SELECT image_url FROM advertisement_images WHERE ad_id = %s", (ad_id,))
                images = cursor.fetchall()

                # Удаляем файлы изображений
                for image in images:
                    image_path = os.path.join('static', image[0])
                    if os.path.exists(image_path):
                        os.remove(image_path)

                # Удаляем записи из базы данных
                cursor.execute("DELETE FROM advertisement_images WHERE ad_id = %s", (ad_id,))
                cursor.execute("DELETE FROM advertisements WHERE ad_id = %s", (ad_id,))
                conn.commit()

        return redirect(url_for('admin_panel'))
    except Exception as e:
        abort(500, f"Ошибка при удалении объявления: {str(e)}")


@app.route('/admin/delete-user', methods=['POST'])
@admin_required
def delete_user():
    user_id = request.cookies.get('user_id')
    try:
        user_id_to_delete = request.form.get('user_id_to_delete')
        if not user_id_to_delete or not user_id_to_delete.isdigit():
            abort(400, "Некорректный ID пользователя")

        user_id_to_delete_int = int(user_id_to_delete)
        current_user_id = int(user_id)

        if current_user_id == user_id_to_delete_int:
            abort(400, "Нельзя удалить самого себя")

        with db.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT 1 FROM users WHERE user_id = %s",
                    (user_id_to_delete_int,))
                if not cursor.fetchone():
                    abort(404, "Пользователь не найден")

                cursor.execute(
                    "DELETE FROM users WHERE user_id = %s",
                    (user_id_to_delete_int,))
                conn.commit()

        return redirect(url_for('admin_panel'))
    except Exception as e:
        abort(500, f"Ошибка при удалении пользователя: {str(e)}")


@app.route('/admin/assign-organizer', methods=['POST'])
@admin_required
def assign_organizer():
    admin_id = request.cookies.get('user_id')
    try:
        user_id = request.form.get('user_id')
        if not user_id or not user_id.isdigit():
            abort(400, "Некорректный ID пользователя")

        db.assign_organizer_role(int(admin_id), int(user_id))
        flash('Роль организатора успешно назначена')
        return redirect(url_for('admin_panel'))
    except Exception as e:
        abort(500, f"Ошибка при назначении роли: {str(e)}")


@app.route('/admin/revoke-organizer', methods=['POST'])
@admin_required
def revoke_organizer():
    admin_id = request.cookies.get('user_id')
    try:
        user_id = request.form.get('user_id')
        if not user_id or not user_id.isdigit():
            abort(400, "Некорректный ID пользователя")

        db.revoke_organizer_role(int(admin_id), int(user_id))
        flash('Роль организатора успешно отменена')
        return redirect(url_for('admin_panel'))
    except Exception as e:
        abort(500, f"Ошибка при отмене роли: {str(e)}")


@app.route('/create-ad', methods=['GET'])
@login_required
def show_create_ad_page():
    user_id = request.cookies.get('user_id')
    try:
        # Get user data
        user = db.get_user_profile(int(user_id))
        if not user:
            abort(404, "Пользователь не найден")

        return render_template(
            "create-ad.html",
            user=user  # Pass the user data to the template
        )
    except Exception as e:
        abort(500, f"Ошибка при загрузке формы: {str(e)}")


@app.route('/create-ad', methods=['POST'])
@organizer_required
def create_ad():
    user_id = request.cookies.get('user_id')
    if not user_id or not user_id.isdigit():
        abort(403, "Доступ запрещён")

    try:
        user = db.get_user_profile(int(user_id))
        if not user:
            abort(404, "Пользователь не найден")

        # Получаем данные формы
        form_data = {
            'title': request.form.get('title'),
            'description': request.form.get('description'),
            'requirements': request.form.get('requirements', ''),
            'rewards': request.form.get('rewards', ''),
            'event_date': request.form.get('event_date'),
            'category': request.form.get('category')
        }

        # Валидация
        if not all([form_data['title'], form_data['description'], form_data['event_date'], form_data['category']]):
            raise ValueError("Все обязательные поля должны быть заполнены")

        with db.get_connection() as conn:
            with conn.cursor() as cursor:
                # Получаем ID категории
                cursor.execute("SELECT category_id FROM categories WHERE name = %s", (form_data['category'],))
                category_result = cursor.fetchone()
                if not category_result:
                    raise ValueError("Указанная категория не найдена")
                category_id = category_result[0]

                # Проверяем и создаем организатора, если его нет
                cursor.execute("SELECT organizer_id FROM organizers WHERE user_id = %s", (user_id,))
                organizer_result = cursor.fetchone()

                if not organizer_result:
                    # Создаем запись организатора, если её нет
                    cursor.execute("""
                        INSERT INTO organizers (user_id, organization, position)
                        VALUES (%s, 'Не указано', 'Организатор')
                        RETURNING organizer_id
                    """, (user_id,))
                    organizer_id = cursor.fetchone()[0]
                else:
                    organizer_id = organizer_result[0]

                # Создаём объявление
                cursor.execute("""
                    INSERT INTO advertisements 
                    (title, description, requirements, rewards,
                     event_date, category_id, organizer_id, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
                    RETURNING ad_id
                """, (
                    form_data['title'],
                    form_data['description'],
                    form_data['requirements'],
                    form_data['rewards'],
                    form_data['event_date'],
                    category_id,
                    organizer_id
                ))

                ad_id = cursor.fetchone()[0]

                # Обработка фотографий
                if 'images' in request.files:
                    files = request.files.getlist('images')
                    for file in files:
                        if file and allowed_file(file.filename):
                            # Создаем папку для фотографий объявления
                            ad_folder = os.path.join(app.config['UPLOAD_FOLDER'], f'ad-{ad_id}')
                            if not os.path.exists(ad_folder):
                                os.makedirs(ad_folder)

                            filename = secure_filename(f"{uuid.uuid4().hex}_{file.filename}")
                            file_path = os.path.join(ad_folder, filename)
                            file.save(file_path)

                            # Сохраняем относительный путь от static с правильными слешами
                            relative_path = f"uploads/ad-{ad_id}/{filename}"  # Используем прямые слеши
                            cursor.execute("""
                                INSERT INTO advertisement_images (ad_id, image_url)
                                VALUES (%s, %s)
                            """, (ad_id, relative_path))

                conn.commit()

        return redirect(url_for('show_advertisement', ad_id=ad_id))

    except Exception as e:
        app.logger.error(f"Ошибка при создании объявления: {str(e)}")

        # Получаем список категорий для повторного отображения формы
        with db.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT name FROM categories ORDER BY name")
                categories = [row[0] for row in cursor.fetchall()]

        return render_template(
            "create-ad.html",
            user=user,
            categories=categories,
            form_data=form_data,
            error=str(e)
        ), 400


@app.route('/edit-account', methods=['GET'])
@login_required
def edit_account_page():
    user_id = request.cookies.get('user_id')
    try:
        user_profile = db.get_user_profile(int(user_id))
        if not user_profile:
            abort(404, "Пользователь не найден")

        # Получаем список всех категорий
        with db.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT name FROM categories ORDER BY name")
                all_categories = [row[0] for row in cursor.fetchall()]

        return render_template(
            "edit-account.html",
            user=user_profile,
            all_categories=all_categories  # Добавляем список категорий
        )
    except Exception as e:
        abort(500, str(e))


@app.route('/edit-account', methods=['POST'])
@login_required
def update_account():
    user_id = request.cookies.get('user_id')
    try:
        # Get form data
        last_name = request.form.get('last_name')
        first_name = request.form.get('first_name')
        patronymic = request.form.get('patronymic')
        email = request.form.get('email')
        gender = request.form.get('gender')
        education_level = request.form.get('education_level')
        course_number = request.form.get('course_number')
        group_name = request.form.get('group_name')
        new_password = request.form.get('new_password')

        # Validate education level
        valid_education_levels = {'bachelor', 'master', 'postgraduate', None, ''}
        if education_level not in valid_education_levels:
            education_level = None

        # Handle avatar upload
        avatar_url = None
        if 'avatar' in request.files:
            file = request.files['avatar']
            if file and allowed_file(file.filename):
                # Get user login for folder name
                user_profile = db.get_user_profile(int(user_id))
                login = user_profile['login']

                # Delete old avatar if exists
                if user_profile and user_profile.get('avatar_url'):
                    old_avatar_path = os.path.join('static', user_profile['avatar_url'])
                    if os.path.exists(old_avatar_path):
                        os.remove(old_avatar_path)

                # Create user folder if not exists
                user_folder = os.path.join(app.config['UPLOAD_FOLDER'], login)
                if not os.path.exists(user_folder):
                    os.makedirs(user_folder)

                # Save new avatar
                filename = secure_filename(file.filename)
                file.save(os.path.join(user_folder, filename))
                avatar_url = f"uploads/{login}/{filename}"

        # Update user data
        with db.get_connection() as conn:
            with conn.cursor() as cursor:
                # Update password if provided
                if new_password:
                    hashed_password = generate_password_hash(new_password)
                    cursor.execute("""
                        UPDATE users
                        SET last_name = %s, first_name = %s, patronymic = %s,
                            email = %s, gender = %s, education_level = %s,
                            course_number = %s, group_name = %s, password = %s
                        WHERE user_id = %s
                    """, (
                        last_name, first_name, patronymic, email, gender,
                        education_level if education_level else None,
                        course_number if course_number else None,
                        group_name, hashed_password, user_id
                    ))
                else:
                    cursor.execute("""
                        UPDATE users
                        SET last_name = %s, first_name = %s, patronymic = %s,
                            email = %s, gender = %s, education_level = %s,
                            course_number = %s, group_name = %s
                        WHERE user_id = %s
                    """, (
                        last_name, first_name, patronymic, email, gender,
                        education_level if education_level else None,
                        course_number if course_number else None,
                        group_name, user_id
                    ))

                # Update avatar if uploaded
                if avatar_url:
                    cursor.execute("""
                        UPDATE users SET avatar_url = %s WHERE user_id = %s
                    """, (avatar_url, user_id))

                conn.commit()

        flash('Данные успешно обновлены!')
        return redirect(url_for('personal_account'))
    except Exception as e:
        print(f"Error updating account: {str(e)}")
        abort(500, str(e))


@app.route('/personal-account')
@login_required
def personal_account():
    user_id = request.cookies.get('user_id')
    try:
        user_profile = db.get_user_profile(int(user_id))
        if not user_profile:
            abort(404, "Пользователь не найден")

        # Получаем грамоты
        certificates = db.get_user_certificates(user_id)

        # Получаем все заявки для организатора
        applications = []
        with db.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        ea.application_id, ea.status, ea.message, ea.application_date,
                        u.user_id, u.last_name, u.first_name, u.patronymic,
                        u.education_level, u.course_number, u.group_name, u.institute, u.avatar_url,
                        a.title as ad_title, a.ad_id,
                        c.name as category
                    FROM event_applications ea
                    JOIN users u ON ea.user_id = u.user_id
                    JOIN advertisements a ON ea.ad_id = a.ad_id
                    JOIN categories c ON a.category_id = c.category_id
                    JOIN organizers o ON a.organizer_id = o.organizer_id
                    WHERE o.user_id = %s
                    ORDER BY ea.application_date DESC
                """, (user_id,))

                columns = [desc[0] for desc in cursor.description]
                applications = [dict(zip(columns, row)) for row in cursor.fetchall()]

        return render_template(
            "personalAccount.html",
            user=user_profile,
            certificates=certificates,
            applications=applications
        )
    except Exception as e:
        abort(500, str(e))


@app.route('/api/students')
@login_required
def get_students_data():
    """API для получения данных студентов с пагинацией"""
    try:
        user_id = request.cookies.get('user_id')
        if not user_id or not user_id.isdigit():
            abort(403, "Доступ запрещен")

        # Получаем параметры запроса
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '').strip()

        # Получаем данные из базы
        with db.get_connection() as conn:
            with conn.cursor() as cursor:
                # Основной запрос с фильтрацией
                query = """
                    SELECT 
                        u.user_id,
                        u.last_name || ' ' || u.first_name || ' ' || COALESCE(u.patronymic, '') as fio,
                        u.group_name,
                        u.institute,
                        u.course_number,
                        COALESCE(SUM(CASE WHEN sp.category_type = 'study' THEN sp.points ELSE 0 END), 0) as study,
                        COALESCE(SUM(CASE WHEN sp.category_type = 'research' THEN sp.points ELSE 0 END), 0) as research,
                        COALESCE(SUM(CASE WHEN sp.category_type = 'creative' THEN sp.points ELSE 0 END), 0) as creative,
                        COALESCE(SUM(CASE WHEN sp.category_type = 'sport' THEN sp.points ELSE 0 END), 0) as sport,
                        COALESCE(SUM(CASE WHEN sp.category_type = 'social' THEN sp.points ELSE 0 END), 0) as social,
                        COALESCE(SUM(sp.points), 0) as total
                    FROM users u
                    LEFT JOIN student_points sp ON u.user_id = sp.user_id
                    WHERE u.role_id = 2
                """

                params = []

                # Добавляем фильтр по поиску
                if search:
                    query += " AND (u.last_name ILIKE %s OR u.first_name ILIKE %s OR u.patronymic ILIKE %s OR u.group_name ILIKE %s)"
                    search_term = f"%{search}%"
                    params.extend([search_term, search_term, search_term, search_term])

                query += " GROUP BY u.user_id, u.last_name, u.first_name, u.patronymic, u.group_name, u.institute, u.course_number"

                # Сортировка
                sort_by = request.args.get('sort_by', 'total')
                sort_order = request.args.get('sort_order', 'desc')
                if sort_by in ['fio', 'group_name', 'study', 'research', 'creative', 'sport', 'social', 'total']:
                    query += f" ORDER BY {sort_by} {sort_order.upper()}"

                # Получаем общее количество
                count_query = f"SELECT COUNT(*) FROM ({query}) as subquery"
                cursor.execute(count_query, params)
                total = cursor.fetchone()[0]

                # Добавляем пагинацию
                query += " LIMIT %s OFFSET %s"
                params.extend([per_page, (page - 1) * per_page])

                cursor.execute(query, params)

                columns = [desc[0] for desc in cursor.description]
                students = []

                for row in cursor.fetchall():
                    student_dict = dict(zip(columns, row))
                    # Преобразуем числовые значения
                    for key in ['study', 'research', 'creative', 'sport', 'social', 'total']:
                        student_dict[key] = int(student_dict[key]) if student_dict[key] else 0
                    students.append(student_dict)

                return jsonify({
                    'students': students,
                    'total': total,
                    'page': page,
                    'per_page': per_page,
                    'total_pages': (total + per_page - 1) // per_page
                })

    except Exception as e:
        app.logger.error(f"Ошибка при получении данных студентов: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/student/<int:student_id>/details')
@login_required
def get_student_details(student_id):
    """API для получения детальной информации о студенте"""
    try:
        user_id = request.cookies.get('user_id')
        if not user_id or not user_id.isdigit():
            abort(403, "Доступ запрещен")

        # Получаем детальную информацию из базы
        student_details = db.get_student_detailed_points(student_id)

        if not student_details:
            abort(404, "Студент не найден")

        # Формируем ссылку на грамоты
        student_details['certificatesLink'] = url_for('view_user_profile', user_id=student_id, _external=True)

        return jsonify(student_details)

    except Exception as e:
        app.logger.error(f"Ошибка при получении детальной информации: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/dropdown-data')
@login_required
def get_dropdown_data():
    """API для получения данных для выпадающих списков"""
    try:
        user_id = request.cookies.get('user_id')
        if not user_id or not user_id.isdigit():
            abort(403, "Доступ запрещен")

        with db.get_connection() as conn:
            with conn.cursor() as cursor:
                # Институты
                cursor.execute("""
                    SELECT DISTINCT institute 
                    FROM users 
                    WHERE institute IS NOT NULL AND institute != '' 
                    ORDER BY institute
                """)
                institutes = [row[0] for row in cursor.fetchall()]

                # Курсы
                cursor.execute("""
                    SELECT DISTINCT course_number 
                    FROM users 
                    WHERE course_number IS NOT NULL 
                    ORDER BY course_number
                """)
                courses = [str(row[0]) for row in cursor.fetchall()]

                # Группы
                cursor.execute("""
                    SELECT DISTINCT group_name 
                    FROM users 
                    WHERE group_name IS NOT NULL AND group_name != '' 
                    ORDER BY group_name
                """)
                groups = [row[0] for row in cursor.fetchall()]

                return jsonify({
                    'institutes': institutes,
                    'courses': courses,
                    'groups': groups
                })

    except Exception as e:
        app.logger.error(f"Ошибка при получении данных для выпадающих списков: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/update-application-status', methods=['POST'])
@organizer_required
def update_application_status():
    try:
        application_id = request.form.get('application_id')
        status = request.form.get('status')

        db.update_application_status(int(application_id), status)
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/delete-image/<int:image_id>', methods=['DELETE'])
@organizer_required
def delete_image(image_id):
    try:
        user_id = request.cookies.get('user_id')
        with db.get_connection() as conn:
            with conn.cursor() as cursor:
                # Проверяем, что пользователь является организатором этого объявления
                cursor.execute("""
                    SELECT a.ad_id, ai.image_url 
                    FROM advertisement_images ai
                    JOIN advertisements a ON ai.ad_id = a.ad_id
                    JOIN organizers o ON a.organizer_id = o.organizer_id
                    WHERE ai.image_id = %s AND o.user_id = %s
                """, (image_id, user_id))

                result = cursor.fetchone()
                if not result:
                    return jsonify({"success": False, "error": "Недостаточно прав"}), 403

                ad_id, image_url = result

                # Удаляем файл
                image_path = os.path.join('static', image_url)
                if os.path.exists(image_path):
                    os.remove(image_path)

                # Удаляем запись из базы данных
                cursor.execute("DELETE FROM advertisement_images WHERE image_id = %s", (image_id,))
                conn.commit()

                return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/add-certificate', methods=['POST'])
@login_required
def add_certificate():
    user_id = request.cookies.get('user_id')
    try:
        title = request.form.get('title')
        description = request.form.get('description')

        # Проверяем обязательные поля
        if not title:
            flash('Название грамоты обязательно для заполнения', 'error')
            return redirect(url_for('personal_account'))

        # Проверяем наличие файла
        if 'image' not in request.files:
            flash('Необходимо загрузить файл грамоты', 'error')
            return redirect(url_for('personal_account'))

        file = request.files['image']

        if file.filename == '':
            flash('Не выбран файл', 'error')
            return redirect(url_for('personal_account'))

        if file and allowed_file(file.filename):
            # Создаем папку пользователя для грамот
            user_folder = os.path.join(app.config['UPLOAD_FOLDER'], f'user_{user_id}', 'certificates')
            if not os.path.exists(user_folder):
                os.makedirs(user_folder)

            # Генерируем уникальное имя файла
            ext = file.filename.split('.')[-1].lower()
            filename = f"cert_{uuid.uuid4().hex}.{ext}"
            file_path = os.path.join(user_folder, filename)
            file.save(file_path)

            # Сохраняем относительный путь
            file_url = f"uploads/user_{user_id}/certificates/{filename}"

            # Добавляем только ОДНУ грамоту в базу данных
            db.add_certificate(int(user_id), title, description or "", file_url)

            flash('Грамота успешно добавлена!', 'success')
            return redirect(url_for('personal_account'))
        else:
            flash('Недопустимый формат файла', 'error')
            return redirect(url_for('personal_account'))

    except Exception as e:
        app.logger.error(f"Ошибка при добавлении грамоты: {str(e)}")
        flash(f'Произошла ошибка при добавлении грамоты: {str(e)}', 'error')
        return redirect(url_for('personal_account'))


def calculate_points(category, subcategory, achievement):
    """Расчет баллов на основе категории и достижения"""
    points_map = {
        'study': {
            'performance_excellent': 2,
            'performance_good': 1,
            'olympiads_international': {'1': 6, '2': 5, '3': 3},
            'olympiads_russian': {'1': 4, '2': 3, '3': 2},
            'olympiads_university': {'1': 3, '2': 2, '3': 1},
            'additional_programs': 1
        },
        'research': {
            'science_competitions_international': {'1': 6, '2': 5, '3': 3},
            'science_competitions_russian': {'1': 4, '2': 3, '3': 2},
            'science_competitions_university': {'1': 3, '2': 2, '3': 1},
            'publications_vak': 3,
            'publications_other': 1,
            'conferences': 1
        },
        'creative': {
            'competitions_international': {'1': 6, '2': 5, '3': 3},
            'competitions_russian': {'1': 4, '2': 3, '3': 2},
            'competitions_university': {'1': 3, '2': 2, '3': 1}
        },
        'sport': {
            'msmk': 8,
            'team_russia': 8,
            'competitions_world': 8,
            'competitions_russia': 6,
            'competitions_cfo': 5,
            'competitions_region': 4,
            'sport_promo': 1
        },
        'social': {
            'starosta': 2,
            'profsoyuz': 2,
            'volunteer': 2,
            'proforientation': 2
        }
    }

    if category in points_map and subcategory in points_map[category]:
        point_value = points_map[category][subcategory]

        if isinstance(point_value, dict):
            # Для конкурсов с местами
            if achievement:
                # Извлекаем номер места из достижения
                import re
                match = re.search(r'(\d+)\s*место', achievement)
                if match:
                    place = match.group(1)
                    return point_value.get(place, 0)
            return 0
        else:
            return point_value

    return 0


@app.route('/submit-application', methods=['POST'])
@login_required
def submit_application():
    """Обработка подачи заявки на стипендию"""
    user_id = request.cookies.get('user_id')

    try:
        user = db.get_user_profile(int(user_id))
        if not user:
            abort(404, "Пользователь не найден")

        # Собираем основные данные
        form_data = {
            'study_points': int(request.form.get('study_points', 0)),
            'research_points': int(request.form.get('research_points', 0)),
            'creative_points': int(request.form.get('creative_points', 0)),
            'sport_points': int(request.form.get('sport_points', 0)),
            'social_points': int(request.form.get('social_points', 0)),
            'total_points': 0,
            'subcategories': []
        }

        # Список категорий и их подкатегорий из Excel файла
        categories_config = {
            'study': {
                'name': 'Учебная деятельность',
                'subcategories': {
                    'performance_excellent': {'name': 'Успеваемость "отлично"', 'points': 2},
                    'performance_good': {'name': 'Успеваемость "хорошо" и "отлично"', 'points': 1},
                    'olympiads_international': {'name': 'Олимпиады международные', 'points_range': {1: 6, 2: 5, 3: 3}},
                    'olympiads_russian': {'name': 'Олимпиады российские/областные', 'points_range': {1: 4, 2: 3, 3: 2}},
                    'olympiads_university': {'name': 'Олимпиады вузовские', 'points_range': {1: 3, 2: 2, 3: 1}},
                    'additional_programs': {'name': 'Дополнительные образовательные программы', 'points_per_program': 1}
                }
            },
            'research': {
                'name': 'Научно-исследовательская деятельность',
                'subcategories': {
                    'science_competitions_international': {'name': 'Научные конкурсы международные',
                                                           'points_range': {1: 6, 2: 5, 3: 3}},
                    'science_competitions_russian': {'name': 'Научные конкурсы российские/областные',
                                                     'points_range': {1: 4, 2: 3, 3: 2}},
                    'science_competitions_university': {'name': 'Научные конкурсы вузовские',
                                                        'points_range': {1: 3, 2: 2, 3: 1}},
                    'publications_vak': {'name': 'Публикации ВАК/РИНЦ', 'points': 3},
                    'publications_other': {'name': 'Публикации прочие', 'points': 1},
                    'conferences': {'name': 'Участие в научных конференциях', 'points_per_conference': 1}
                }
            },
            'creative': {
                'name': 'Творческие конкурсы',
                'subcategories': {
                    'competitions_international': {'name': 'Конкурсы международные',
                                                   'points_range': {1: 6, 2: 5, 3: 3}},
                    'competitions_russian': {'name': 'Конкурсы российские/областные',
                                             'points_range': {1: 4, 2: 3, 3: 2}},
                    'competitions_university': {'name': 'Конкурсы вузовские', 'points_range': {1: 3, 2: 2, 3: 1}}
                }
            },
            'sport': {
                'name': 'Спорт',
                'subcategories': {
                    'msmk': {'name': 'Мастер спорта международного класса', 'points': 8},
                    'team_russia': {'name': 'Член Сборной России', 'points': 8},
                    'competitions_world': {'name': 'Чемпионат мира', 'points': 8},
                    'competitions_russia': {'name': 'Чемпионат России', 'points': 6},
                    'competitions_cfo': {'name': 'Чемпионат ЦФО', 'points': 5},
                    'competitions_region': {'name': 'Чемпионат области', 'points': 4},
                    'sport_promo': {'name': 'Популяризация спорта', 'points': 1}
                }
            },
            'social': {
                'name': 'Общественная работа',
                'subcategories': {
                    'starosta': {'name': 'Староста', 'points': 2},
                    'profsoyuz': {'name': 'Профсоюзная работа/студсовет', 'points': 2},
                    'volunteer': {'name': 'Волонтерская деятельность', 'points': 2},
                    'proforientation': {'name': 'Профориентационная работа/летние лагеря', 'points': 2}
                }
            }
        }

        # Обработка файлов и данных
        files = request.files.getlist('certificates[]')
        uploaded_files = []

        # Сохраняем заявку
        with db.get_connection() as conn:
            with conn.cursor() as cursor:
                # Проверяем существование таблицы scholarship_applications
                cursor.execute("""
                    SELECT EXISTS (
                        SELECT 1 FROM information_schema.tables 
                        WHERE table_name = 'scholarship_applications'
                    )
                """)

                if not cursor.fetchone()[0]:
                    # Создаем таблицу если ее нет
                    cursor.execute("""
                        CREATE TABLE scholarship_applications (
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

                # Создаем основную заявку
                cursor.execute("""
                    INSERT INTO scholarship_applications 
                    (user_id, total_points, study_points, research_points, 
                     creative_points, sport_points, social_points, status)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, 'pending')
                    RETURNING application_id
                """, (
                    int(user_id),
                    form_data['total_points'],
                    form_data['study_points'],
                    form_data['research_points'],
                    form_data['creative_points'],
                    form_data['sport_points'],
                    form_data['social_points']
                ))

                application_id = cursor.fetchone()[0]

                # Обрабатываем файлы грамот
                for file in files:
                    if file and allowed_file(file.filename):
                        # Создаем папку для заявки
                        app_folder = os.path.join(app.config['UPLOAD_FOLDER'], f'app_{application_id}')
                        if not os.path.exists(app_folder):
                            os.makedirs(app_folder)

                        # Генерируем уникальное имя файла
                        ext = file.filename.split('.')[-1].lower()
                        filename = f"cert_{uuid.uuid4().hex}.{ext}"
                        file_path = os.path.join(app_folder, filename)
                        file.save(file_path)

                        # Сохраняем относительный путь
                        file_url = f"uploads/app_{application_id}/{filename}"

                        # Сохраняем информацию о файле
                        cursor.execute("""
                            INSERT INTO application_certificates 
                            (application_id, file_path, original_filename)
                            VALUES (%s, %s, %s)
                            RETURNING certificate_id
                        """, (application_id, file_url, file.filename))

                        certificate_id = cursor.fetchone()[0]
                        uploaded_files.append({
                            'certificate_id': certificate_id,
                            'file_url': file_url,
                            'original_name': file.filename
                        })

                # Обрабатываем подкатегории из формы
                for category_type, category_data in categories_config.items():
                    for subcat_key, subcat_config in category_data['subcategories'].items():
                        # Получаем значение из формы
                        form_value = request.form.get(f'{category_type}_{subcat_key}')

                        if form_value:
                            try:
                                # Для диапазонов очков (олимпиады, конкурсы)
                                if 'points_range' in subcat_config:
                                    place = int(form_value)
                                    if place in subcat_config['points_range']:
                                        points = subcat_config['points_range'][place]

                                        cursor.execute("""
                                            INSERT INTO application_subcategories 
                                            (application_id, category_type, subcategory_name, place, points)
                                            VALUES (%s, %s, %s, %s, %s)
                                        """, (
                                            application_id,
                                            category_type,
                                            subcat_config['name'],
                                            place,
                                            points
                                        ))
                                # Для фиксированных очков
                                elif 'points' in subcat_config:
                                    points = subcat_config['points']

                                    cursor.execute("""
                                        INSERT INTO application_subcategories 
                                        (application_id, category_type, subcategory_name, points)
                                        VALUES (%s, %s, %s, %s)
                                    """, (
                                        application_id,
                                        category_type,
                                        subcat_config['name'],
                                        points
                                    ))
                                # Для программ/конференций (за каждую)
                                elif 'points_per_program' in subcat_config or 'points_per_conference' in subcat_config:
                                    count = int(form_value)
                                    points_per = subcat_config.get('points_per_program') or subcat_config.get(
                                        'points_per_conference', 1)
                                    points = count * points_per

                                    cursor.execute("""
                                        INSERT INTO application_subcategories 
                                        (application_id, category_type, subcategory_name, description, points)
                                        VALUES (%s, %s, %s, %s, %s)
                                    """, (
                                        application_id,
                                        category_type,
                                        subcat_config['name'],
                                        f"Количество: {count}",
                                        points
                                    ))
                            except (ValueError, TypeError) as e:
                                app.logger.warning(f"Ошибка обработки подкатегории {subcat_key}: {e}")
                                continue

                conn.commit()

        # Обновляем общие баллы на основе подкатегорий
        with db.get_connection() as conn:
            with conn.cursor() as cursor:
                # Пересчитываем баллы по категориям
                cursor.execute("""
                    SELECT 
                        category_type,
                        SUM(points) as category_points
                    FROM application_subcategories
                    WHERE application_id = %s
                    GROUP BY category_type
                """, (application_id,))

                category_points = {}
                for row in cursor.fetchall():
                    category_points[row[0]] = row[1]

                # Обновляем общие баллы
                total_points = sum(category_points.values())

                cursor.execute("""
                    UPDATE scholarship_applications 
                    SET total_points = %s,
                        study_points = %s,
                        research_points = %s,
                        creative_points = %s,
                        sport_points = %s,
                        social_points = %s
                    WHERE application_id = %s
                """, (
                    total_points,
                    category_points.get('study', 0),
                    category_points.get('research', 0),
                    category_points.get('creative', 0),
                    category_points.get('sport', 0),
                    category_points.get('social', 0),
                    application_id
                ))

                conn.commit()

        flash('Заявка на стипендию успешно подана!', 'success')
        return redirect(url_for('personal_account'))

    except Exception as e:
        app.logger.error(f"Ошибка при подаче заявки на стипендию: {str(e)}")
        flash(f'Ошибка при подаче заявки: {str(e)}', 'error')
        return redirect(url_for('personal_account'))


@app.route('/admin/scholarship-applications')
@admin_required
def view_scholarship_applications():
    """Просмотр заявок на стипендию (для администраторов)"""
    user_id = request.cookies.get('user_id')
    try:
        user = db.get_user_profile(int(user_id))

        # Получаем все заявки
        with db.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        sa.*,
                        u.last_name || ' ' || u.first_name || ' ' || COALESCE(u.patronymic, '') as fio,
                        u.group_name,
                        u.institute
                    FROM scholarship_applications sa
                    JOIN users u ON sa.user_id = u.user_id
                    ORDER BY sa.application_date DESC
                """)

                columns = [desc[0] for desc in cursor.description]
                applications = [dict(zip(columns, row)) for row in cursor.fetchall()]

        return render_template(
            "admin-scholarship.html",
            user=user,
            applications=applications
        )
    except Exception as e:
        abort(500, str(e))


@app.route('/submit-scholarship-application', methods=['POST'])
@login_required
def submit_scholarship_application():
    """Обработка подачи заявки на стипендию"""
    user_id = request.cookies.get('user_id')

    try:
        # Получаем данные из формы
        form_data = {
            'study_points': int(request.form.get('study_points', 0)),
            'research_points': int(request.form.get('research_points', 0)),
            'creative_points': int(request.form.get('creative_points', 0)),
            'sport_points': int(request.form.get('sport_points', 0)),
            'social_points': int(request.form.get('social_points', 0)),
            'total_points': int(request.form.get('total_points', 0))
        }

        # Получаем детальные данные по подкатегориям
        detailed_data = {}

        # Учебная деятельность
        detailed_data['study'] = {
            'performance': request.form.get('study_performance'),
            'olympiads_international': request.form.get('olympiads_international'),
            'olympiads_russian': request.form.get('olympiads_russian'),
            'olympiads_university': request.form.get('olympiads_university'),
            'additional_programs': request.form.get('additional_programs_count')
        }

        # Научная деятельность
        detailed_data['research'] = {
            'science_competitions_international': request.form.get('science_competitions_international'),
            'science_competitions_russian': request.form.get('science_competitions_russian'),
            'science_competitions_university': request.form.get('science_competitions_university'),
            'publications_vak': request.form.get('publications_vak_count'),
            'publications_other': request.form.get('publications_other_count'),
            'conferences': request.form.get('conferences_count')
        }

        # Творческие конкурсы
        detailed_data['creative'] = {
            'competitions_international': request.form.get('creative_competitions_international'),
            'competitions_russian': request.form.get('creative_competitions_russian'),
            'competitions_university': request.form.get('creative_competitions_university')
        }

        # Спорт
        detailed_data['sport'] = {
            'msmk': request.form.get('sport_msmk'),
            'team_russia': request.form.get('sport_team_russia'),
            'world_winner': request.form.get('sport_world_winner'),
            'russia_winner': request.form.get('sport_russia_winner'),
            'cfo_winner': request.form.get('sport_cfo_winner'),
            'region_winner': request.form.get('sport_region_winner'),
            'world_prize': request.form.get('sport_world_prize'),
            'russia_prize': request.form.get('sport_russia_prize'),
            'cfo_prize': request.form.get('sport_cfo_prize'),
            'region_prize': request.form.get('sport_region_prize'),
            'promo': request.form.get('sport_promo')
        }

        # Общественная работа
        detailed_data['social'] = {
            'starosta': request.form.get('social_starosta'),
            'profsoyuz': request.form.get('social_profsoyuz'),
            'volunteer': request.form.get('social_volunteer'),
            'proforientation': request.form.get('social_proforientation')
        }

        # Создаем заявку в базе данных
        with db.get_connection() as conn:
            with conn.cursor() as cursor:
                # Создаем основную запись заявки
                cursor.execute("""
                    INSERT INTO scholarship_applications 
                    (user_id, total_points, study_points, research_points, 
                     creative_points, sport_points, social_points, status, application_date)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, 'pending', NOW())
                    RETURNING application_id
                """, (
                    int(user_id),
                    form_data['total_points'],
                    form_data['study_points'],
                    form_data['research_points'],
                    form_data['creative_points'],
                    form_data['sport_points'],
                    form_data['social_points']
                ))

                application_id = cursor.fetchone()[0]

                # Сохраняем детальные данные по подкатегориям
                for category_type, category_data in detailed_data.items():
                    for subcat_name, subcat_value in category_data.items():
                        if subcat_value:
                            cursor.execute("""
                                INSERT INTO application_subcategories 
                                (application_id, category_type, subcategory_name, value)
                                VALUES (%s, %s, %s, %s)
                            """, (application_id, category_type, subcat_name, subcat_value))

                # Сохраняем файлы грамот
                files = request.files.getlist('certificates[]')
                for file in files:
                    if file and allowed_file(file.filename):
                        # Создаем папку для заявки
                        app_folder = os.path.join(app.config['UPLOAD_FOLDER'], f'scholarship_{application_id}')
                        if not os.path.exists(app_folder):
                            os.makedirs(app_folder)

                        # Сохраняем файл
                        filename = secure_filename(f"{uuid.uuid4().hex}_{file.filename}")
                        file_path = os.path.join(app_folder, filename)
                        file.save(file_path)

                        # Сохраняем в базу данных
                        cursor.execute("""
                            INSERT INTO application_certificates 
                            (application_id, file_path, original_filename)
                            VALUES (%s, %s, %s)
                        """, (application_id, f"uploads/scholarship_{application_id}/{filename}", file.filename))

                conn.commit()

        flash('Заявка на стипендию успешно подана!', 'success')
        return redirect(url_for('personal_account'))

    except Exception as e:
        app.logger.error(f"Ошибка при подаче заявки на стипендию: {str(e)}")
        flash(f'Ошибка при подаче заявки: {str(e)}', 'error')
        return redirect(url_for('personal_account'))

def main():
    # Создаем папку для загрузок, если ее нет
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)

    db.create_tables()
    app.run(debug=True)


if __name__ == "__main__":
    main()