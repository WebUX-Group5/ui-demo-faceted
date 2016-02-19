## Elasticsearch Quick Reference commands
Currently you can just open a git bash and execute these commands in the command line.
Format: curl -X<REST Verb> <Node>:<Port>/<Index>/<Type>/<ID>

Please note: for running a analyzer, e.g., Language analyzer, please see:
https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-lang-analyzer.html
We can use this to return keywords in text for German language!!!
We can also use the similarity module to decide how matching documents are scored/ranked.
Maybe the LM Jelinek Mercer similarity is what we need!


##Examples on How to import a dataset
1) create an index
curl -XPUT 'localhost:9200/opendata?pretty'

2) create and load the mapping file
curl -XPUT localhost:9200/opendata/2015_1/_mapping?pretty -d @preview_mapping.json

3) load the json dataset
curl -XPOST localhost:9200/opendata/2015_1/_bulk?pretty --data-binary @preview.json


### Indexes
1) Create a new `opendata` index. The `?pretty` pretifies the return result as json
curl -XPUT 'localhost:9200/opendata?pretty'

2) List all indexes
curl 'localhost:9200/_cat/indices?v'

3) Delete an index
curl -XDELETE 'localhost:9200/opendata?pretty'

### Documents (Json)

Note: If the index does not exist yet, it will be automatically created by Elasticsearch
4) index a single document (or update an old document)
curl -XPUT 'localhost:9200/opendata?pretty' -d '
{
  "name": "John Doe"
}'

5) Retrieve a document
curl -XGET 'localhost:9200/opendata/external/1?pretty'

6) update a document
curl -XPOST 'localhost:9200/customer/external/1/_update?pretty' -d '
{
  "doc": { "name": "Jane Doe", "age": 20 }
}'

7) Delete a document
curl -XDELETE 'localhost:9200/customer/external/2?pretty'

8) Batch Processing
curl -XPOST 'localhost:9200/customer/external/_bulk?pretty' -d '
{"index":{"_id":"1"}}
{"name": "John Doe" }
{"index":{"_id":"2"}}
{"name": "Jane Doe" }
'
9)List all documents
curl -XPOST 'localhost:9200/opendata/2015_1/_search?pretty' -d '
{
  "query": { "match_all": {} }
}'

### Load a complete json Dataset
curl -XPOST 'localhost:9200/opendata/_bulk?pretty' --data-binary "@accounts.json"

### Search API
1) Return all document in 'opendta' index
curl 'localhost:9200/opendata/_search?q=*&pretty'

2) Return only the first document
curl -XPOST 'localhost:9200/opendata/_search?pretty' -d '
{
  "query": { "match_all": {} },
  "size": 1
}'

3) Return documents from 11 to 20
curl -XPOST 'localhost:9200/opendata/_search?pretty' -d '
{
  "query": { "match_all": {} },
  "from": 10,
  "size": 10
}'

4) Return top 10 results by descent order
curl -XPOST 'localhost:9200/opendata/_search?pretty' -d '
{
  "query": { "match_all": {} },
  "sort": { "balance": { "order": "desc" } }
}'

5) Return two fields
curl -XPOST 'localhost:9200/opendata/_search?pretty' -d '
{
  "query": { "match_all": {} },
  "_source": ["account_number", "balance"]
}'

6) Returns account numbered 20
curl -XPOST 'localhost:9200/opendata/_search?pretty' -d '
{
  "query": { "match": { "account_number": 20 } }
}'


7) Return mill or lane
curl -XPOST 'localhost:9200/opendata/_search?pretty' -d '
{
  "query": { "match": { "address": "mill lane" } }
}'

8) return mill lane
curl -XPOST 'localhost:9200/bank/_search?pretty' -d '
{
  "query": { "match_phrase": { "address": "mill lane" } }
}'

8) return mill and lane
curl -XPOST 'localhost:9200/bank/_search?pretty' -d '
{
  "query": {
    "bool": {
      "must": [
        { "match": { "address": "mill" } },
        { "match": { "address": "lane" } }
      ]
    }
  }
}'

9) return neither mill nor lane
curl -XPOST 'localhost:9200/bank/_search?pretty' -d '
{
  "query": {
    "bool": {
      "must_not": [
        { "match": { "address": "mill" } },
        { "match": { "address": "lane" } }
      ]
    }
  }
}'

10) This example returns all accounts of anybody who is 40 years old but don’t live in ID(aho):
curl -XPOST 'localhost:9200/bank/_search?pretty' -d '
{
  "query": {
    "bool": {
      "must": [
        { "match": { "age": "40" } }
      ],
      "must_not": [
        { "match": { "state": "ID" } }
      ]
    }
  }
}'

### Aggregations

1) groups all the accounts by state, and then returns the top 10 (default) states sorted by count descending (also default) 
curl -XPOST 'localhost:9200/bank/_search?pretty' -d '
{
  "size": 0,
  "aggs": {
    "group_by_state": {
      "terms": {
        "field": "state"
      }
    }
  }
}'

1.1) the response will be:
 "hits" : {
    "total" : 1000,
    "max_score" : 0.0,
    "hits" : [ ]
  },
  "aggregations" : {
    "group_by_state" : {
      "buckets" : [ {
        "key" : "al",
        "doc_count" : 21
      }, {
        "key" : "tx",
        "doc_count" : 17
      }, {
        "key" : "id",
        "doc_count" : 15
      }, {
        "key" : "ma",
        "doc_count" : 15
      }, {
        "key" : "md",
        "doc_count" : 15
      }, {
        "key" : "pa",
        "doc_count" : 15
      }, {
        "key" : "dc",
        "doc_count" : 14
      }, {
        "key" : "me",
        "doc_count" : 14
      }, {
        "key" : "mo",
        "doc_count" : 14
      }, {
        "key" : "nd",
        "doc_count" : 14
      } ]
    }
  }
}

2) Building on the previous aggregation, let’s now sort on the average balance in descending order:

curl -XPOST 'localhost:9200/bank/_search?pretty' -d '
{
  "size": 0,
  "aggs": {
    "group_by_state": {
      "terms": {
        "field": "state",
        "order": {
          "average_balance": "desc"
        }
      },
      "aggs": {
        "average_balance": {
          "avg": {
            "field": "balance"
          }
        }
      }
    }
  }
}'



curator delete indices --index bank


//for term vector analysis put this after german analyzer in mapping file
//this slows down the search
,
    "analyzer":"german"
//, "term_vector":"with_positions_offsets_payloads"


//Standard way of configuring a standard language anlyzer
curl -XPOST 'localhost:9200/opendata/_close'

curl -XPUT 'localhost:9200/opendata/_settings' -d '{
  "settings": {
    "analysis": {
      "filter": {
        "german_stop": {
          "type":       "stop",
          "stopwords":  "_german_" 
        }      
      },
      "analyzer": {
        "german": {
          "filter": [            
            "german_stop"          
          ]
        }
      }
    }
  }
}'

curl -XPOST 'localhost:9200/opendata/_open'