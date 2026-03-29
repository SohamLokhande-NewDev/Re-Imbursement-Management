# Reimbursement Management System


A full-stack enterprise application designed to modernize and automate the expense reimbursement process. It replaces manual, error-prone workflows with an intelligent system featuring AI-powered receipt scanning, dynamic multi-level approval routing, and automated currency conversions.


## 🚀 Core Features


* **Role-Based Access Control (RBAC):** Distinct permissions and automatic dashboard routing for Admins, Managers, and Employees.

* **Multi-Tenant Architecture:** Seamlessly handles multiple companies. The first user to register under a new company name automatically becomes the Admin.

* **AI-Powered OCR:** Employees can upload receipt images, and the system uses Google's Gemini AI to instantly extract the amount, date, merchant, and category to auto-fill forms.

* **Advanced Workflow Engine:** * Supports strict **Sequential Routing** (e.g., Employee → Manager → Admin).

  * Includes **Admin Finality** logic: If an Admin approves an expense, it bypasses remaining steps and is immediately marked as fully approved.

* **Global Currency Support:** Automatically maps user countries to their local currency upon registration using the `restcountries` API, and converts pending expenses into the company's default currency for managers to review.


## 🛠️ Tech Stack


**Backend**

* **Framework:** FastAPI (Python)

* **Package Management:** `uv`

* **Data Validation:** Pydantic

* **AI Integration:** Google Generative AI (Gemini 2.5 Flash)


**Frontend**

* **Library:** React (initialized via Vite)

* **Routing:** React Router DOM

* **HTTP Client:** Axios


**Database & Authentication**

* **Platform:** Supabase (PostgreSQL)

* **Auth:** Supabase Auth (Email/Password)


## 📁 Project Structure


```text

Re-Imbursement-Management/

├── app/                      # FastAPI Backend

│   ├── api/routes/           # API Endpoints (auth, users, expenses, approvals)

│   ├── core/                 # App configuration and Database client

│   ├── schemas/              # Pydantic models for request/response validation

│   └── services/             # Core business logic (OCR, Workflow Engine)

├── frontend/                 # React Frontend

│   ├── src/

│   │   ├── pages/            # View Components (Admin, Manager, Employee, Auth)

│   │   ├── App.jsx           # Main routing logic

│   │   └── main.jsx          # React entry point

│   └── package.json

├── .env                      # Environment variables

├── main.py                   # FastAPI application entry point

└── pyproject.toml            # Python dependencies (uv)