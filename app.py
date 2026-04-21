import time
import hashlib
from flask import Flask, request, jsonify, render_template
from Crypto.Cipher import AES, PKCS1_OAEP
from Crypto.PublicKey import RSA
from Crypto.Random import get_random_bytes
from Crypto.Util.Padding import pad, unpad
import binascii

app = Flask(__name__)

# A1Z26 cipher mappings
ENCODE_MAP = {chr(65 + i): str(i + 1) for i in range(26)}   # A->1 ... Z->26
DECODE_MAP = {str(i + 1): chr(65 + i) for i in range(26)}   # 1->A ... 26->Z

def measure_time(func):
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        end = time.perf_counter()
        ms = (end - start) * 1000
        return result, ms
    return wrapper

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
            elif num:  # non-empty but invalid number
                return None  # signal error
        if decoded_letters:
            decoded_words.append("".join(decoded_letters))
    return " ".join(decoded_words)

def get_aes_key(key_str: str) -> bytes:
    return hashlib.sha256(key_str.encode('utf-8')).digest()[:16]

@measure_time
def aes_encrypt_text(text: str, key_str: str) -> str:
    key = get_aes_key(key_str)
    cipher = AES.new(key, AES.MODE_CBC)
    ct_bytes = cipher.encrypt(pad(text.encode('utf-8'), AES.block_size))
    iv_and_ct = cipher.iv + ct_bytes
    return binascii.hexlify(iv_and_ct).decode('utf-8')

@measure_time
def aes_decrypt_text(hex_cipher: str, key_str: str) -> str:
    try:
        iv_and_ct = binascii.unhexlify(hex_cipher)
        iv = iv_and_ct[:16]
        ct = iv_and_ct[16:]
        key = get_aes_key(key_str)
        cipher = AES.new(key, AES.MODE_CBC, iv)
        pt = unpad(cipher.decrypt(ct), AES.block_size)
        return pt.decode('utf-8')
    except Exception:
        return None

@measure_time
def rsa_generate():
    key = RSA.generate(2048)
    private_key = key.export_key().decode('utf-8')
    public_key = key.publickey().export_key().decode('utf-8')
    return private_key, public_key

@measure_time
def rsa_encrypt_text(text: str, pub_key_str: str) -> str:
    try:
        pub_key = RSA.import_key(pub_key_str)
        cipher = PKCS1_OAEP.new(pub_key)
        ct_bytes = cipher.encrypt(text.encode('utf-8'))
        return binascii.hexlify(ct_bytes).decode('utf-8')
    except Exception:
        return None

@measure_time
def rsa_decrypt_text(hex_cipher: str, priv_key_str: str) -> str:
    try:
        priv_key = RSA.import_key(priv_key_str)
        cipher = PKCS1_OAEP.new(priv_key)
        ct_bytes = binascii.unhexlify(hex_cipher)
        pt = cipher.decrypt(ct_bytes)
        return pt.decode('utf-8')
    except Exception:
        return None

@measure_time
def sha256_hash_text(text: str) -> str:
    return hashlib.sha256(text.encode('utf-8')).hexdigest()

@measure_time
def sha256_verify_text(text: str, hash_str: str) -> bool:
    computed = hashlib.sha256(text.encode('utf-8')).hexdigest()
    return computed.lower() == hash_str.lower().strip()

@app.route("/")
def index():
    return render_template("index.html")

# Existing A1Z26 API
@app.route("/api/encode", methods=["POST"])
def api_encode():
    data = request.get_json()
    text = data.get("text", "").strip()
    if not text:
        return jsonify({"error": "Input text cannot be empty."}), 400
    if not any(c.isalpha() for c in text):
        return jsonify({"error": "Input must contain at least one letter."}), 400
    result, ms = encode_text_a1z26(text)
    return jsonify({"result": result, "time_ms": round(ms, 2)})

@app.route("/api/decode", methods=["POST"])
def api_decode():
    data = request.get_json()
    cipher = data.get("cipher", "").strip()
    if not cipher:
        return jsonify({"error": "Input cipher cannot be empty."}), 400
    result, ms = decode_text_a1z26(cipher)
    if result is None:
        return jsonify({"error": "Invalid cipher. Numbers must be between 1 and 26."}), 400
    return jsonify({"result": result, "time_ms": round(ms, 2)})

# AES API
@app.route("/aes/encrypt", methods=["POST"])
def api_aes_enc():
    data = request.get_json()
    text = data.get("text", "")
    key = data.get("key", "")
    if not text or not key:
        return jsonify({"error": "Message and key required."}), 400
    result, ms = aes_encrypt_text(text, key)
    return jsonify({"result": result, "time_ms": round(ms, 2)})

@app.route("/aes/decrypt", methods=["POST"])
def api_aes_dec():
    data = request.get_json()
    cipher = data.get("cipher", "").strip()
    key = data.get("key", "")
    if not cipher or not key:
        return jsonify({"error": "Cipher and key required."}), 400
    result, ms = aes_decrypt_text(cipher, key)
    if result is None:
        return jsonify({"error": "Decryption failed. Check key or ciphertext format."}), 400
    return jsonify({"result": result, "time_ms": round(ms, 2)})

# RSA API
@app.route("/rsa/generate-keys", methods=["POST"])
def api_rsa_gen():
    (priv, pub), ms = rsa_generate()
    return jsonify({"private_key": priv, "public_key": pub, "time_ms": round(ms, 2)})

@app.route("/rsa/encrypt", methods=["POST"])
def api_rsa_enc():
    data = request.get_json()
    text = data.get("text", "")
    pub_key = data.get("public_key", "")
    if not text or not pub_key:
        return jsonify({"error": "Message and public key required."}), 400
    result, ms = rsa_encrypt_text(text, pub_key)
    if result is None:
        return jsonify({"error": "Encryption failed. Invalid public key or message too long."}), 400
    return jsonify({"result": result, "time_ms": round(ms, 2)})

@app.route("/rsa/decrypt", methods=["POST"])
def api_rsa_dec():
    data = request.get_json()
    cipher = data.get("cipher", "").strip()
    priv_key = data.get("private_key", "")
    if not cipher or not priv_key:
        return jsonify({"error": "Cipher and private key required."}), 400
    result, ms = rsa_decrypt_text(cipher, priv_key)
    if result is None:
        return jsonify({"error": "Decryption failed. Check private key or ciphertext."}), 400
    return jsonify({"result": result, "time_ms": round(ms, 2)})

# SHA256 API
@app.route("/sha256/hash", methods=["POST"])
def api_sha256_hash():
    data = request.get_json()
    text = data.get("text", "")
    if not text:
        return jsonify({"error": "Message required."}), 400
    result, ms = sha256_hash_text(text)
    return jsonify({"result": result, "time_ms": round(ms, 2)})

@app.route("/sha256/verify", methods=["POST"])
def api_sha256_verify():
    data = request.get_json()
    text = data.get("text", "")
    hash_str = data.get("hash", "")
    if not text or not hash_str:
        return jsonify({"error": "Message and hash required."}), 400
    result, ms = sha256_verify_text(text, hash_str)
    return jsonify({"match": result, "time_ms": round(ms, 2)})

if __name__ == "__main__":
    app.run(debug=True, port=5000)
