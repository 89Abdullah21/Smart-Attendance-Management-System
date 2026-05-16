from faker import Faker
import pandas as pd
import random
from datetime import datetime, timedelta

fake = Faker()

# -----------------------------
# CONFIGURATION
# -----------------------------
NUM_ADMINS = 2
NUM_TEACHERS = 10
NUM_STUDENTS = 50
NUM_COURSES = 8
NUM_TIMETABLE_SLOTS = 15
NUM_ATTENDANCE = 200

# -----------------------------
# ADMINS TABLE
# -----------------------------
admins = []

for i in range(1, NUM_ADMINS + 1):
    admins.append({
        "admin_id": i,
        "full_name": fake.name(),
        "email": fake.unique.email(),
        "password_hash": fake.sha256(),
        "created_at": fake.date_time_this_year()
    })

admins_df = pd.DataFrame(admins)

# -----------------------------
# TEACHERS TABLE
# -----------------------------
departments = [
    "Computer Science",
    "Software Engineering",
    "AI",
    "Cyber Security"
]

teachers = []

for i in range(1, NUM_TEACHERS + 1):
    teachers.append({
        "teacher_id": i,
        "full_name": fake.name(),
        "email": fake.unique.email(),
        "password_hash": fake.sha256(),
        "department": random.choice(departments),
        "created_at": fake.date_time_this_year()
    })

teachers_df = pd.DataFrame(teachers)

# -----------------------------
# STUDENTS TABLE
# -----------------------------
sections = ["BSSE-A", "BSSE-B", "BSCS-A"]

students = []

for i in range(1, NUM_STUDENTS + 1):
    students.append({
        "student_id": i,
        "full_name": fake.name(),
        "email": fake.unique.email(),
        "password_hash": fake.sha256(),
        "roll_number": f"2022-SE-{1000+i}",
        "section": random.choice(sections),
        "semester": random.randint(1, 8),
        "created_at": fake.date_time_this_year()
    })

students_df = pd.DataFrame(students)

# -----------------------------
# COURSES TABLE
# -----------------------------
course_names = [
    "Database Systems",
    "Operating Systems",
    "AI Fundamentals",
    "Web Engineering",
    "Cyber Security",
    "Data Structures",
    "Machine Learning",
    "Software Design"
]

courses = []

for i in range(1, NUM_COURSES + 1):
    courses.append({
        "course_id": i,
        "course_name": course_names[i - 1],
        "credit_hours": random.choice([2, 3]),
        "teacher_id": random.randint(1, NUM_TEACHERS)
    })

courses_df = pd.DataFrame(courses)

# -----------------------------
# ENROLLMENTS TABLE
# -----------------------------
enrollments = []
enrollment_id = 1

for student_id in range(1, NUM_STUDENTS + 1):
    selected_courses = random.sample(range(1, NUM_COURSES + 1), 4)

    for course_id in selected_courses:
        enrollments.append({
            "enrollment_id": enrollment_id,
            "student_id": student_id,
            "course_id": course_id
        })

        enrollment_id += 1

enrollments_df = pd.DataFrame(enrollments)

# -----------------------------
# TIMETABLE TABLE
# -----------------------------
days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

timetable = []

for i in range(1, NUM_TIMETABLE_SLOTS + 1):
    start_hour = random.randint(8, 14)

    timetable.append({
        "slot_id": i,
        "course_id": random.randint(1, NUM_COURSES),
        "day_of_week": random.choice(days),
        "start_time": f"{start_hour}:00:00",
        "end_time": f"{start_hour+1}:30:00",
        "room_location": f"Room-{random.randint(100, 500)}",
        "latitude": round(random.uniform(33.5, 34.5), 6),
        "longitude": round(random.uniform(71.0, 72.0), 6)
    })

timetable_df = pd.DataFrame(timetable)

# -----------------------------
# ATTENDANCE TABLE
# -----------------------------
attendance_status = ["Present", "Absent"]

attendance = []

for i in range(1, NUM_ATTENDANCE + 1):

    slot = random.randint(1, NUM_TIMETABLE_SLOTS)
    student = random.randint(1, NUM_STUDENTS)

    attendance.append({
        "attendance_id": i,
        "student_id": student,
        "slot_id": slot,
        "course_id": random.randint(1, NUM_COURSES),
        "class_date": fake.date_this_year(),
        "marked_at": fake.date_time_this_year(),
        "status": random.choice(attendance_status),
        "latitude_marked": round(random.uniform(33.5, 34.5), 6),
        "longitude_marked": round(random.uniform(71.0, 72.0), 6),
        "is_location_valid": random.choice([True, False])
    })

attendance_df = pd.DataFrame(attendance)

# -----------------------------
# EXPORT CSV FILES
# -----------------------------
admins_df.to_csv("admins.csv", index=False)
teachers_df.to_csv("teachers.csv", index=False)
students_df.to_csv("students.csv", index=False)
courses_df.to_csv("courses.csv", index=False)
enrollments_df.to_csv("enrollments.csv", index=False)
timetable_df.to_csv("timetable.csv", index=False)
attendance_df.to_csv("attendance.csv", index=False)

print("CSV files generated successfully!")