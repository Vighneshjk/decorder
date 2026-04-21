# CipherX — A1Z26 Secret Number Cipher

A clean, modern web app that lets you **encode** plain text into secret number codes and **decode** them back, using the classic **A1Z26 cipher** (A=1, B=2 … Z=26).

Built with **Python / Flask** on the backend and **HTML + CSS + Vanilla JS** on the frontend.

---

## 📸 Features

| Feature | Details |
|---|---|
| **Encode mode** | Converts letters → dash-separated numbers; words separated by ` / ` |
| **Decode mode** | Converts number cipher back to plain text |
| **Cipher Table** | Full A–Z reference grid on the page; click any cell to insert into input |
| **Quick Examples** | One-click examples for HELLO WORLD, SECRET, and more |
| **Copy to clipboard** | One-click copy button on the result |
| **Keyboard shortcut** | `Ctrl+Enter` / `Cmd+Enter` triggers conversion |
| **Premium dark UI** | Animated glassmorphism design with purple gradients |

---

## 🔐 Cipher Specification

| Rule | Detail |
|---|---|
| Letter → number | `A=1, B=2, C=3, … Z=26` |
| Letters within a word | Separated by **dashes** `-` |
| Word separator | **Slash** ` / ` |
| Case | Input is case-insensitive (converted to uppercase internally) |
| Non-letters | Ignored during encoding |

**Examples:**

```
HELLO WORLD  →  8-5-12-12-15 / 23-15-18-12-4
SECRET       →  19-5-3-18-5-20
```

---

## 🛠 Setup & Run

### Prerequisites

- Python 3.9 or higher
- pip

### 1. Clone / navigate to the project

```bash
cd "d:/my fav projects/code reader"
```

### 2. (Optional) Create a virtual environment

```bash
python -m venv venv
# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Run the Flask server

```bash
python app.py
```

### 5. Open in browser

```
http://localhost:5000
```

---

## 📁 Project Structure

```
code reader/
├── app.py                  # Flask backend (encode/decode API)
├── requirements.txt        # Python dependencies
├── README.md               # This file
├── templates/
│   └── index.html          # Frontend HTML template
└── static/
    ├── style.css           # Premium dark UI styles
    └── script.js           # Frontend logic
```

---

## 🔌 API Reference

### `POST /api/encode`

**Request body:**
```json
{ "text": "HELLO WORLD" }
```

**Response:**
```json
{ "result": "8-5-12-12-15 / 23-15-18-12-4" }
```

---

### `POST /api/decode`

**Request body:**
```json
{ "cipher": "8-5-12-12-15 / 23-15-18-12-4" }
```

**Response:**
```json
{ "result": "HELLO WORLD" }
```

---

**Error response (400):**
```json
{ "error": "Invalid cipher. Numbers must be between 1 and 26." }
```

---

## 📝 License

MIT — free to use and modify.
