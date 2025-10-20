import json
from pathlib import Path
from flask import Flask, jsonify, request
from flask_cors import CORS
import yaml

app = Flask(__name__)

CORS(app)

root = Path(__file__).resolve().parent.parent
config_file_path = Path("config.yaml")

try:
    with config_file_path.open() as config_file:
        config = yaml.safe_load(config_file)
        data_path: str = config["data_folder"]
        data_folder = root / data_path
except IOError as exc:
    if exc.errno == 2:
        config = {}
        data_folder = None
    else:
        raise


@app.route("/process_example", methods=["POST"])
def process_example():
    payload = request.json
    if "example" not in payload:
        return jsonify({"error": "example field is required"}), 400
    example = payload["example"]

    try:
        if not config:
            raise ValueError("config file not found")
        title = config["data"][example]["title"]
        if not data_folder:
            raise ValueError("data folder not found")
        filename: str = config["data"][example]["filename"]
        with (data_folder / filename).open() as structure_file:
            data = json.load(structure_file)
    except (KeyError, ValueError) as exc:
        return jsonify({"error": str(exc)}), 400
    return jsonify({"title": title, **data})


if __name__ == "__main__":
    app.run(debug=True)
