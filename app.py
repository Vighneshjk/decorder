from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

# A1Z26 cipher mappings
ENCODE_MAP = {chr(65 + i): str(i + 1) for i in range(26)}   # A->1 ... Z->26
DECODE_MAP = {str(i + 1): chr(65 + i) for i in range(26)}   # 1->A ... 26->Z


def encode_text(text: str) -> str:
    """Convert plain text to A1Z26 cipher (numbers separated by dashes, words by slashes)."""
    text = text.upper().strip()
    words = text.split()
    encoded_words = []
    for word in words:
        encoded_letters = []
        for char in word:
            if char in ENCODE_MAP:
                encoded_letters.append(ENCODE_MAP[char])
            # Ignore non-alphabetic characters silently
        if encoded_letters:
            encoded_words.append("-".join(encoded_letters))
    return " / ".join(encoded_words)


def decode_text(cipher: str) -> str:
    """Convert A1Z26 cipher back to plain text."""
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


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/encode", methods=["POST"])
def api_encode():
    data = request.get_json()
    text = data.get("text", "").strip()
    if not text:
        return jsonify({"error": "Input text cannot be empty."}), 400
    if not any(c.isalpha() for c in text):
        return jsonify({"error": "Input must contain at least one letter."}), 400
    result = encode_text(text)
    return jsonify({"result": result})


@app.route("/api/decode", methods=["POST"])
def api_decode():
    data = request.get_json()
    cipher = data.get("cipher", "").strip()
    if not cipher:
        return jsonify({"error": "Input cipher cannot be empty."}), 400
    result = decode_text(cipher)
    if result is None:
        return jsonify({"error": "Invalid cipher. Numbers must be between 1 and 26."}), 400
    return jsonify({"result": result})


if __name__ == "__main__":
    app.run(debug=True, port=5000)    
