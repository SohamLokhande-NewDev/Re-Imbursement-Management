import sys
import psycopg2

import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

def create_user(email, password, full_name, company_name):
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    try:
        # 1. Insert securely into Supabase's core auth.users table (bypassing the API Rate Limit)
        cur.execute("""
            INSERT INTO auth.users (
                id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at
            ) VALUES (
                gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
                %s, crypt(%s, gen_salt('bf')), NOW(), NOW(), NOW()
            ) RETURNING id;
        """, (email, password))
        
        user_id = cur.fetchone()[0]
        
        # 2. Check if company exists to determine if Admin or Employee
        cur.execute("SELECT id FROM public.companies WHERE name = %s;", (company_name,))
        company = cur.fetchone()
        
        if company:
            company_id = company[0]
            role = 'employee'
        else:
            cur.execute("INSERT INTO public.companies (name, currency) VALUES (%s, 'USD') RETURNING id;", (company_name,))
            company_id = cur.fetchone()[0]
            role = 'admin'
            
        # 3. Create the public user profile mapping
        cur.execute("""
            INSERT INTO public.users (id, email, full_name, company_id, role)
            VALUES (%s, %s, %s, %s, %s);
        """, (user_id, email, full_name, company_id, role))
        
        conn.commit()
        print(f"Success! Bypassed Rate Limit & created user: {email} | Role: {role} | Company: {company_name}")
        
    except Exception as e:
        conn.rollback()
        print(f"Error creating user directly in DB: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    if len(sys.argv) < 5:
        print("Usage: python create_test_user.py <email> <password> <full_name> <company_name>")
        sys.exit(1)
    
    create_user(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4])
