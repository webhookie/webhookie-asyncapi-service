// Uncomment these imports to begin using these cool features!

// import {inject} from '@loopback/core';


const parser = require('@asyncapi/parser');

import {post, Request, Response, requestBody, response, ResponseObject, RestBindings, del} from "@loopback/rest";
import {inject} from "@loopback/core";
import {AsyncAPIDocument, Channel} from "@asyncapi/parser";

const PARSE_RESPONSE: ResponseObject = {
  description: 'Parse Response',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        title: 'ParseResponse',
        properties: {
          name: {type: 'string'},
          version: {type: 'string'},
          topics: {
            type: "array"
          }
        },
      },
    },
  },
};

const PARSE_ERROR_RESPONSE: ResponseObject = {
  description: 'Parse Error Response',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        title: 'ParseResponse',
        properties: {
          message: {type: 'string'},
        },
      },
    },
  },
};

export class ParserController {
  constructor(
      @inject(RestBindings.Http.REQUEST) private req: Request,
      @inject(RestBindings.Http.RESPONSE) private response: Response
  ) {}

  @post("/parse")
  @response(200, PARSE_RESPONSE)
  @response(400, PARSE_ERROR_RESPONSE)
  async parse(
      @requestBody({
        content: {
          'text/yaml': {}
        }
      }) spec: string
  ): Promise<Response> {
    try {
      console.info("Parsing spec...." + spec.substr(0, 100))
      const doc: AsyncAPIDocument = await parser.parse(spec)
      const topics = Object.keys(doc.channels())
          .map((key: string) => {
            const value: Channel = doc.channel(key)
            return {
              name: key,
              description: value.description()
            }
          })

      let title = doc.info().title();
      let version = doc.info().version();

      console.info(`Spec parsed: '${title}, ${version}, ${topics.map(it => it.name)}'`)
      const res = {
        name: title,
        description: doc.info().description(),
        version: version,
        topics: topics
      }

      this.response.status(200).send(res);
      // Return the HTTP response object so that LoopBack framework skips the
      // generation of HTTP response
    } catch (error) {
      delete error.parsedJSON
      console.log(`Caught by try/catch ${error.message}`);
      this.response.status(400).send(error);
    }
    return this.response;
  }
}
