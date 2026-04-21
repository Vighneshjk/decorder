import time
import base64
import hashlib
from flask import Flask, request, jsonify, render_template
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_OAEP

app = Flask(__name__)

def measure_time(func):
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        end = time.perf_counter()
        ms = (end - start) * 1000
        return result, ms
    return wrapper

# --- A1Z26 ---
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

# --- CAESAR CIPHER ---
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

# --- MORSE CODE ---
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

# --- ROT13 ---
@measure_time
def rot13_convert(text: str) -> str:
    return caesar_encrypt.__wrapped__(text, 13)

# --- BINARY ---
@measure_time
def binary_encode(text: str) -> str:
    return " ".join(format(b, '08b') for b in text.encode('utf-8'))

@measure_time
def binary_decode(binary_str: str) -> str:
    parts = binary_str.replace(" ", "").strip()
    if not parts or not all(c in "01" for c in parts) or len(parts) % 8 != 0:
        return None
    try:
        byte_array = bytearray(int(parts[i:i+8], 2) for i in range(0, len(parts), 8))
        return byte_array.decode('utf-8')
    except Exception:
        return None

# --- BASE64 ---
@measure_time
def base64_encode(text: str) -> str:
    return base64.b64encode(text.encode('utf-8')).decode('utf-8')

@measure_time
def base64_decode(b64_str: str) -> str:
    try:
        b64_str = b64_str.strip()
        pad = len(b64_str) % 4
        if pad == 1: return None
        if pad > 0: b64_str += "=" * (4 - pad)
        return base64.b64decode(b64_str).decode('utf-8')
    except Exception:
        return None

# --- HEXADECIMAL ---
@measure_time
def hex_encode(text: str, upper: bool = True) -> str:
    hex_str = text.encode('utf-8').hex()
    formatted = " ".join(hex_str[i:i+2] for i in range(0, len(hex_str), 2))
    return formatted.upper() if upper else formatted.lower()

@measure_time
def hex_decode(hex_str: str) -> str:
    clean_hex = hex_str.replace(" ", "").strip()
    try:
        return bytes.fromhex(clean_hex).decode('utf-8')
    except Exception:
        return None

# --- AES ---
@measure_time
def aes_encrypt(text: str, key: str) -> str:
    key_bytes = key.encode('utf-8')
    if len(key_bytes) < 16:
        key_bytes = key_bytes.ljust(16, b'\0')
    elif len(key_bytes) > 16:
        key_bytes = key_bytes[:16]
    cipher = AES.new(key_bytes, AES.MODE_CBC)
    ct_bytes = cipher.encrypt(pad(text.encode('utf-8'), AES.block_size))
    return (cipher.iv + ct_bytes).hex()

@measure_time
def aes_decrypt(hex_cipher: str, key: str) -> str:
    key_bytes = key.encode('utf-8')
    if len(key_bytes) < 16:
        key_bytes = key_bytes.ljust(16, b'\0')
    elif len(key_bytes) > 16:
        key_bytes = key_bytes[:16]
    try:
        cipher_bytes = bytes.fromhex(hex_cipher)
        iv = cipher_bytes[:16]
        ct = cipher_bytes[16:]
        cipher = AES.new(key_bytes, AES.MODE_CBC, iv)
        pt = unpad(cipher.decrypt(ct), AES.block_size)
        return pt.decode('utf-8')
    except Exception:
        return None

# --- RSA ---
@measure_time
def rsa_generate_keys():
    key = RSA.generate(2048)
    private_key = key.export_key().decode('utf-8')
    public_key = key.publickey().export_key().decode('utf-8')
    return private_key, public_key

@measure_time
def rsa_encrypt(text: str, public_key_str: str) -> str:
    try:
        recipient_key = RSA.import_key(public_key_str)
        cipher_rsa = PKCS1_OAEP.new(recipient_key)
        enc_data = cipher_rsa.encrypt(text.encode('utf-8'))
        return enc_data.hex()
    except Exception:
        return None

@measure_time
def rsa_decrypt(hex_cipher: str, private_key_str: str) -> str:
    try:
        private_key = RSA.import_key(private_key_str)
        cipher_rsa = PKCS1_OAEP.new(private_key)
        dec_data = cipher_rsa.decrypt(bytes.fromhex(hex_cipher))
        return dec_data.decode('utf-8')
    except Exception:
        return None


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

@app.route("/binary/encode", methods=["POST"])
def api_binary_enc():
    res, ms = binary_encode(request.json.get("text", ""))
    return jsonify({"result": res, "time_ms": round(ms, 2)})

@app.route("/binary/decode", methods=["POST"])
def api_binary_dec():
    res, ms = binary_decode(request.json.get("cipher", ""))
    if res is None: return jsonify({"error": "Invalid binary format. Must only contain 0 and 1, and be a multiple of 8 bits."}), 400
    return jsonify({"result": res, "time_ms": round(ms, 2)})

@app.route("/base64/encode", methods=["POST"])
def api_base64_enc():
    res, ms = base64_encode(request.json.get("text", ""))
    return jsonify({"result": res, "time_ms": round(ms, 2)})

@app.route("/base64/decode", methods=["POST"])
def api_base64_dec():
    res, ms = base64_decode(request.json.get("cipher", ""))
    if res is None: return jsonify({"error": "Invalid Base64 format."}), 400
    return jsonify({"result": res, "time_ms": round(ms, 2)})

@app.route("/hex/encode", methods=["POST"])
def api_hex_enc():
    upper = request.json.get("upper", True)
    res, ms = hex_encode(request.json.get("text", ""), upper)
    return jsonify({"result": res, "time_ms": round(ms, 2)})

@app.route("/hex/decode", methods=["POST"])
def api_hex_dec():
    res, ms = hex_decode(request.json.get("cipher", ""))
    if res is None: return jsonify({"error": "Invalid hexadecimal format."}), 400
    return jsonify({"result": res, "time_ms": round(ms, 2)})

@app.route("/aes/encrypt", methods=["POST"])
def api_aes_enc():
    key = request.json.get("key", "")
    if not key: return jsonify({"error": "A secret key is required."}), 400
    res, ms = aes_encrypt(request.json.get("text", ""), key)
    return jsonify({"result": res, "time_ms": round(ms, 2)})

@app.route("/aes/decrypt", methods=["POST"])
def api_aes_dec():
    key = request.json.get("key", "")
    if not key: return jsonify({"error": "A secret key is required."}), 400
    res, ms = aes_decrypt(request.json.get("cipher", ""), key)
    if res is None: return jsonify({"error": "Decryption failed. Incorrect key or manipulated ciphertext."}), 400
    return jsonify({"result": res, "time_ms": round(ms, 2)})

@app.route("/rsa/generate-keys", methods=["POST"])
def api_rsa_gen():
    (priv, pub), ms = rsa_generate_keys()
    return jsonify({"private_key": priv, "public_key": pub, "time_ms": round(ms, 2)})

@app.route("/rsa/encrypt", methods=["POST"])
def api_rsa_enc():
    res, ms = rsa_encrypt(request.json.get("text", ""), request.json.get("public_key", ""))
    if res is None: return jsonify({"error": "Encryption failed. Invalid Public Key format."}), 400
    return jsonify({"result": res, "time_ms": round(ms, 2)})

@app.route("/rsa/decrypt", methods=["POST"])
def api_rsa_dec():
    res, ms = rsa_decrypt(request.json.get("cipher", ""), request.json.get("private_key", ""))
    if res is None: return jsonify({"error": "Decryption failed. Invalid Private Key or manipulated ciphertext."}), 400
    return jsonify({"result": res, "time_ms": round(ms, 2)})

@app.route("/sha256/hash", methods=["POST"])
def api_sha_hash():
    text = request.json.get("text", "").encode('utf-8')
    t0 = time.perf_counter()
    sha256 = hashlib.sha256(text).hexdigest()
    md5 = hashlib.md5(text).hexdigest()
    sha1 = hashlib.sha1(text).hexdigest()
    ms = (time.perf_counter() - t0) * 1000
    res = {"sha256": sha256, "md5": md5, "sha1": sha1}
    return jsonify({"result": res, "time_ms": round(ms, 2)})

@app.route("/sha256/verify", methods=["POST"])
def api_sha_verify():
    text = request.json.get("text", "").encode('utf-8')
    hash_expected = request.json.get("hash", "").strip().lower()
    t0 = time.perf_counter()
    actual = hashlib.sha256(text).hexdigest()
    match = (actual == hash_expected)
    ms = (time.perf_counter() - t0) * 1000
    return jsonify({"match": match, "hash": actual, "time_ms": round(ms, 2)})

if __name__ == "__main__":
    app.run(debug=True, port=5000)
