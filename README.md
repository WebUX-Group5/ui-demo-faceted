# Faceted Search with Elasticsearch, Angular.js and D3.js
### Authors:

* Mathias Blum
* Matthias Frey
* Daniel Lamprecht
* Nelson Silva

> This project was created in the course of the lecture
**Information Architecture and Web Usability**, held by
**Prof. Keith Andrews**, at TU Graz,
Austria ([IAWEB](http://www.iicm.tugraz.at/keith "IAWEB")).

To reference our work, please use:

  Initial Survey

    @Electronic{Blum2015survey,
      Title                    = {Faceted User Interfaces Survey},
      Author                   = {Mathias Blum and Matthias Frey and Daniel Lamprecht and Nelson Silva},
      Month                    = {12},
      Url                      = {https://goo.gl/28wK5P},
      Year                     = {2015},
      Date                     = {2015-12-15},
      Doi                      = {10.13140/RG.2.1.4996.0720},
      Owner                    = {nsilva},
      Timestamp                = {2016.02.18}
    }

    - survey.pdf DOI: 10.13140/RG.2.1.4996.0720


  Final Report

    @Electronic{Blum2016faceted,
      Title                    = {Faceted Navigation for Open Data: Using Elasticsearch for offenesparlament.at},
      Author                   = {Mathias Blum and Matthias Frey and Daniel Lamprecht and Nelson Silva},
      Url                      = {https://goo.gl/28wK5P},
      Date                     = {2016-01-22},
      Doi                      = {10.13140/RG.2.1.1594.3447},
      Owner                    = {nsilva},
      Timestamp                = {2016.02.18}
    }

    - report.pdf DOI: 10.13140/RG.2.1.1594.3447


# Web Project

In `/src`, a generic web-project with bower and npm is set up.
[![DOI](https://zenodo.org/badge/20295/njss/ui-demo-faceted.svg)](https://zenodo.org/badge/latestdoi/20295/njss/ui-demo-faceted)

## Installation

NodeJS and NPM are needed to install the rest, so first install

 - nodejs https://nodejs.org/en/download/
 - npm https://docs.npmjs.com/cli/install

Then, install node packages for gulp and bower with something like
`npm install --global gulp bower` (it might be necessary to run this as
superuser).

Then, change into poject folder and start npm and bower to fetch dependencies:

    $ cd src
    $ npm install
    $ bower install

This will install the project dependencies, after which you should be
able to start the developmend server with

    $ gulp serve

## Elasticsearch Server

Elasticsearch binaries are available at the Elasticsearch website:
[https://www.elastic.co/products/elasticsearch](https://www.elastic.co/products/elasticsearch "Elasticsearch Server Download")

Find the executables in `elasticsearch-2.1.0/bin` .

### Elasticsearch Server - Windows
exectue the file `elasticsearch-2.1.0\bin\elasticsearch.bat`


# Project Screenshots:
<img src="/screenshots/application_native.png" width="358" height="532">
<img src="/screenshots/application_elasticui.png" width="358" height="532">
<img src="/screenshots/histogram_diagram.png" width="587" height="532">
<img src="/screenshots/top_words.png" width="244" height="532">
