
# Javascript client

## Install

To use the JS client, it should be made a dependency of the bower project.
Use `bower install elasticsearch` ( `bower install 'git://github.com/elastic/elasticsearch-js.git#10.0.1'` )

Three separate 'build' (js-files that can be included in the index.html)
exist, next to the native version, there exist special builds for angular and
jQuery.
https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/browser-builds.html

## Example for Elasticsearch in Angular

https://github.com/spalger/elasticsearch-angular-example


## Using the JS client

https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/quick-start.html


Query client using promises instead of callbacks.

    client.search({
      q: 'pants'
    }).then(function (body) {
      var hits = body.hits.hits;
    }, function (error) {
      console.trace(error.message);
    });


# Elasticsearch Server

## Import documents (Simple Way)

Elasticsearch terminology : there is an index (we use 'opendata') and inside
that, there are documents/items (we use 'statement')

To import a file `data/export-minimal.json` into 'opendata', and into an
index/collection 'statement':

    curl -XPOST localhost:9200/opendata/statement/_bulk?pretty --data-binary @data/export-minimal.json

To delete an index again (e.g. to start fresh import)

    curl -XDELETE 'http://localhost:9200/opendata/'

## Configuring Analyzers

Problem : default is to tokenize all input fields.
For some fields it is required to not use the default analyzer, which will
split contents into tokens!

First, to inspect the current mappings of an index (this was also used to
create the basis for the currently in-use mapping file `mapping.json` :

    GET /opendat/_mapping/statement

To *not* use a tokenizer, configure the fields like this :

    "occupation": {
                  "type": "string",
                  "index": "not_analyzed"
               },

We use this for occupation and name of speaker.

## Import documents (Complete Steps)

So, to properly import:

0) delete any old index (if you want to reload)

    curl -XDELETE 'localhost:9200/opendata?pretty'

1) create the index

    curl -XPUT 'localhost:9200/opendata?pretty'

2) create and load the mapping file

    curl -XPUT localhost:9200/opendata/statement/_mapping?pretty -d @data/mapping.json

3) load the json dataset

    curl -XPOST localhost:9200/opendata/statement/_bulk?pretty --data-binary @data/export-minimal.json



## Useful es configuring

CORS-Headers need to be configured so that the js application may issue requests
to the elasticsearch backend (which is running on different port).
For CORS, see https://www.elastic.co/guide/en/elasticsearch/reference/1.4/modules-http.html
Part of the settings below should be default.


Done in `config/elasticsearch.yml`

    # Set my own datadir (completely  optional)
    path.data: /var/elasticsearch

    # Enable cors to be able to talk directly to elasticsearch from our frontend
    http.cors.enabled: true
    http.cors.allow-origin : "*"
    http.cors.allow-methods : OPTIONS, HEAD, GET, POST, PUT, DELETE
    http.cors.allow-headers : X-Requested-With,X-Auth-Token,Content-Type, Content-Length


# JS Implementation

## Elastic search client

https://www.elastic.co/guide/en/elasticsearch/reference/1.4/_executing_searches.html

A more complex query

    "query": {
        "bool": {
            "must": [
                {"term": {"current_party":"grüne"}},
                {"term": {"text":"umweltschutz"}}
            ]
        }


Example of query with aggregations (=facets)

    {"body":{
        "aggregations":
            {"duration":{"histogram":{"field":"duration","interval":180}},
            "party":{"terms":{"field":"current_party"}}},
        "query":{
            "bool":{
                "must":[
                    {"term":{"current_party":"spö"}}
                ]}}}}
