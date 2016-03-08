from flask import Flask, request, jsonify
from flask.ext.cors import CORS
from elasticsearch import Elasticsearch
import json

app = Flask(__name__)
app.debug=True
CORS(app)

client = Elasticsearch()

@app.route('/test', methods=['GET'])
def test():
    return "Test!"

@app.route('/search', methods=['POST'])
def es():
    data = request.get_json(force=True)
    body = dict([(k, data['body'][k]) for k in ['query', 'aggregations']\
                 if k in data['body']])
    result = client.search(body=data['body'])
    return jsonify(result)

if __name__ == '__main__':
    app.run()
