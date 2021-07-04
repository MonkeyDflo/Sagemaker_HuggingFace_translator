from flask import Flask, request
from transformers import pipeline

app = Flask(__name__)

@app.route("/invocations", methods=["POST"])
def invoke():
    try :
        text : str = request.get_json(force=True)['text']
    except :
        return { "translation" : 'Error' }
    if not query:
        return { "translation" : 'No text !' }
    # Translate text
    translated_text = translator(text)
    return { "translation" : translated_text }

@app.route("/ping")
def ping():
    return 'ping'

if __name__ == '__main__':
    # Init translator
    translator = pipeline("translation_en_to_fr")
    app.run(debug=True, host='0.0.0.0', port=8080)