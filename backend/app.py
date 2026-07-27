import os
import tempfile

from flask import Flask, request, jsonify
from flask_cors import CORS
from markitdown import MarkItDown

app = Flask(__name__)
CORS(app)

converter = MarkItDown()


@app.route("/convert", methods=["POST"])
def convert():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    suffix = os.path.splitext(file.filename or "")[1]
    try:
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            file.save(tmp.name)
            tmp_path = tmp.name

        result = converter.convert(tmp_path)
        return jsonify(
            {
                "markdown": result.text_content,
                "filename": file.filename,
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


if __name__ == "__main__":
    print("Backend running on http://localhost:8000")
    app.run(host="127.0.0.1", port=8000, debug=True)
