import time
from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

def measure_time(func):
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        end = time.perf_counter()
        ms = (end - start) * 1000
        return result, ms
    return wrapper

# A1Z26
ENCODE_MAP = {chr(65 + i): str(i + 1) for i in range(26)}
DECODE_MAP = {str(i + 1): chr(65 + i) for i in range(26)}

@measure_time
def encode_text_a1z26(text: str) -> str:
    text = text.upper().strip()
    words = text.split()
    encoded_words = []
    for word in words:
        encoded_letters = []
        for char in word:
            if char in ENCODE_MAP:
                encoded_letters.append(ENCODE_MAP[char])
        if encoded_letters:
            encoded_words.append("-".join(encoded_letters))
    return " / ".join(encoded_words)

@measure_time
def decode_text_a1z26(cipher: str) -> str:
    cipher = cipher.strip()
    word_groups = cipher.split("/")
    decoded_words = []
    for group in word_groups:
        group = group.strip()
        numbers = group.split("-")
        decoded_letters = []
        for num in numbers:
            num = num.strip()
            if num in DECODE_MAP:
                decoded_letters.append(DECODE_MAP[num])
            elif num: return None
        if decoded_letters:
            decoded_words.append("".join(decoded_letters))
    return " ".join(decoded_words)


# CAESAR CIPHER
@measure_time
def caesar_encrypt(text: str, shift: int) -> str:
    res = []
    for char in text:
        if char.isalpha():
            ascii_offset = 65 if char.isupper() else 97
            res.append(chr((ord(char) - ascii_offset + shift) % 26 + ascii_offset))
        else:
            res.append(char)
    return "".join(res)

@measure_time
def caesar_decrypt(text: str, shift: int) -> str:
    return caesar_encrypt.__wrapped__(text, -shift)


# MORSE CODE
MORSE_DICT = { 'A':'.-', 'B':'-...', 'C':'-.-.', 'D':'-..', 'E':'.', 'F':'..-.', 'G':'--.', 'H':'....', 'I':'..', 'J':'.---', 'K':'-.-', 'L':'.-..', 'M':'--', 'N':'-.', 'O':'---', 'P':'.--.', 'Q':'--.-', 'R':'.-.', 'S':'...', 'T':'-', 'U':'..-', 'V':'...-', 'W':'.--', 'X':'-..-', 'Y':'-.--', 'Z':'--..', '1':'.----', '2':'..---', '3':'...--', '4':'....-', '5':'.....', '6':'-....', '7':'--...', '8':'---..', '9':'----.', '0':'-----', ',':'--..--', '.':'.-.-.-', '?':'..--..', '-':'-....-', '(':'-.--.', ')':'-.--.-'}
MORSE_DECODE_DICT = {v: k for k, v in MORSE_DICT.items()}

@measure_time
def morse_encode(text: str) -> str:
    words = text.upper().split()
    morse_words = []
    for word in words:
        morse_chars = []
        for char in word:
            if char in MORSE_DICT:
                morse_chars.append(MORSE_DICT[char])
        if morse_chars:
            morse_words.append(" ".join(morse_chars))
    return " / ".join(morse_words)

@measure_time
def morse_decode(cipher: str) -> str:
    words = cipher.split("/")
    decoded_words = []
    for word in words:
        chars = word.strip().split()
        dec_chars = []
        for ch in chars:
            if ch in MORSE_DECODE_DICT:
                dec_chars.append(MORSE_DECODE_DICT[ch])
            else:
                return None
        if dec_chars:
            decoded_words.append("".join(dec_chars))
    return " ".join(decoded_words)


# ROT13
@measure_time
def rot13_convert(text: str) -> str:
    return caesar_encrypt.__wrapped__(text, 13)


# --- ROUTES ---
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/encode", methods=["POST"])
def api_encode():
    text = request.json.get("text", "")
    res, ms = encode_text_a1z26(text)
    return jsonify({"result": res, "time_ms": round(ms, 2)})

@app.route("/api/decode", methods=["POST"])
def api_decode():
    cipher = request.json.get("cipher", "")
    res, ms = decode_text_a1z26(cipher)
    if res is None: return jsonify({"error": "Invalid format"}), 400
    return jsonify({"result": res, "time_ms": round(ms, 2)})

@app.route("/caesar/encode", methods=["POST"])
def api_caesar_enc():
    data = request.json
    try: shift = int(data.get("shift", 0))
    except (ValueError, TypeError): return jsonify({"error": "Shift must be a number."}), 400
    res, ms = caesar_encrypt(data.get("text", ""), shift)
    return jsonify({"result": res, "time_ms": round(ms, 2)})

@app.route("/caesar/decode", methods=["POST"])
def api_caesar_dec():
    data = request.json
    try: shift = int(data.get("shift", 0))
    except (ValueError, TypeError): return jsonify({"error": "Shift must be a number."}), 400
    res, ms = caesar_decrypt(data.get("cipher", ""), shift)
    return jsonify({"result": res, "time_ms": round(ms, 2)})

@app.route("/morse/encode", methods=["POST"])
def api_morse_enc():
    res, ms = morse_encode(request.json.get("text", ""))
    return jsonify({"result": res, "time_ms": round(ms, 2)})

@app.route("/morse/decode", methods=["POST"])
def api_morse_dec():
    res, ms = morse_decode(request.json.get("cipher", ""))
    if res is None: return jsonify({"error": "Invalid Morse code."}), 400
    return jsonify({"result": res, "time_ms": round(ms, 2)})

@app.route("/rot13/convert", methods=["POST"])
def api_rot13():
    res, ms = rot13_convert(request.json.get("text", ""))
    return jsonify({"result": res, "time_ms": round(ms, 2)})

if __name__ == "__main__":
    app.run(debug=True, port=5000)
