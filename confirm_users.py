import psycopg2

DATABASE_URL = "postgresql://postgres.jyopodrizwbsccalocse:skwua2xQq5cH2KCn@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"

def confirm_users():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        cur.execute("UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL;")
        rowcount = cur.rowcount
        conn.commit()
        print(f"Success! Confirmed {rowcount} pending users in the database.")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    confirm_users()
