from flask import Flask, request, jsonify
from elasticsearch import Elasticsearch
import json

app = Flask(__name__)
client = Elasticsearch()

@app.route('/search', methods=['POST'])
def es():
    data = request.get_json(force=True)
    body = dict([(k, data[k]) for k in ['query', 'aggregations'] if k in data])
    result = client.search(body=data)
    return jsonify(result)

if __name__ == '__main__':
    app.run()
