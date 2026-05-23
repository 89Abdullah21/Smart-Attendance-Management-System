from faker import Faker
import random
import bcrypt
import mysql.connector
from datetime import datetime, timedelta

fake = Faker()

# ==============================
# DATABASE CONNECTION
# ==============================
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="82118191818@nonymou$",  # Put your MySQL password here
    database="smart_attendance"
)

cursor = conn.cursor()

# ==============================
# PASSWORD HASH
# ==============================
plain_password = "password"
hashed_password = bcrypt.hashpw(
    plain_password.encode('utf-8'),
    bcrypt.gensalt()
).decode('utf-8')

# ==============================
# GENERATE TEACHERS
# ==============================
teacher_ids = []

departments = [
    "Computer Science",
    "Software Engineering",
    "AI",
    "Cyber Security"
]

for i in range(10):
    full_name = fake.name()
    email = fake.unique.email()

    query = """
    INSERT INTO users
    (full_name, email, password_hash, role, department)
    VALUES (%s, %s, %s, %s, %s)
    """

    values = (
        full_name,
        email,
        hashed_password,
        "teacher",
        random.choice(departments)
    )

    cursor.execute(query, values)
    teacher_ids.append(cursor.lastrowid)

# ==============================
# GENERATE STUDENTS
# ==============================
fake.unique.clear()

student_ids = []

sections = ['A', 'B', 'C']

for i in range(100):
    full_name = fake.name()
    email = fake.unique.email()

    roll_number = fake.unique.bothify(text='2021-CS-###')

    query = """
    INSERT INTO users
    (full_name, email, password_hash, role,
     roll_number, section, semester)
    VALUES (%s, %s, %s, %s, %s, %s, %s)
    """

    values = (
        full_name,
        email,
        hashed_password,
        "student",
        roll_number,
        random.choice(sections),
        random.randint(1, 8)
    )

    cursor.execute(query, values)
    student_ids.append(cursor.lastrowid)

# ==============================
# GENERATE COURSES
# ==============================
course_ids = []

course_names = [
    "Database Systems",
    "Operating Systems",
    "Artificial Intelligence",
    "Computer Networks",
    "Data Structures",
    "Machine Learning",
    "Compiler Construction",
    "Software Engineering"
]

for course in course_names:

    query = """
    INSERT INTO courses
    (course_name, credit_hours, teacher_id)
    VALUES (%s, %s, %s)
    """

    values = (
        course,
        random.randint(2, 4),
        random.choice(teacher_ids)
    )

    cursor.execute(query, values)
    course_ids.append(cursor.lastrowid)

# ==============================
# GENERATE ENROLLMENTS
# ==============================
for student_id in student_ids:

    selected_courses = random.sample(course_ids, random.randint(2, 5))

    for course_id in selected_courses:

        query = """
        INSERT IGNORE INTO enrollments
        (student_id, course_id)
        VALUES (%s, %s)
        """

        cursor.execute(query, (student_id, course_id))

# ==============================
# GENERATE TIMETABLE
# ==============================
days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

slot_ids = []

for course_id in course_ids:

    teacher_id = random.choice(teacher_ids)

    start_hour = random.randint(8, 15)

    start_time = f"{start_hour}:00:00"
    end_time = f"{start_hour + 1}:30:00"

    query = """
    INSERT INTO timetable
    (course_id, teacher_id, day_of_week,
     start_time, end_time, room_location,
     latitude, longitude)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """

    values = (
        course_id,
        teacher_id,
        random.choice(days),
        start_time,
        end_time,
        f"Room {random.randint(100, 500)}",
        33.738045 + random.uniform(-0.01, 0.01),
        72.814522 + random.uniform(-0.01, 0.01)
    )

    cursor.execute(query, values)
    slot_ids.append((cursor.lastrowid, course_id))

# ==============================
# GENERATE ATTENDANCE
# ==============================
for student_id in student_ids:

    for slot_id, course_id in random.sample(slot_ids, min(5, len(slot_ids))):

        query = """
        INSERT IGNORE INTO attendance
        (student_id, slot_id, course_id,
         latitude_marked, longitude_marked,
         is_location_valid, status, class_date)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """

        values = (
            student_id,
            slot_id,
            course_id,
            33.738045 + random.uniform(-0.005, 0.005),
            72.814522 + random.uniform(-0.005, 0.005),
            random.choice([0, 1]),
            random.choice(['Present', 'Absent']),
            fake.date_between(start_date='-30d', end_date='today')
        )

        cursor.execute(query, values)

# ==============================
# COMMIT & CLOSE
# ==============================
conn.commit()

print("✅ Fake data generated successfully!")

cursor.close()
conn.close()