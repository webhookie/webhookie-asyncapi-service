/*
 * webhookie - webhook infrastructure that can be incorporated into any microservice or integration architecture.
 * Copyright (C) 2021 Hookie Solutions AB, info@hookiesolutions.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 * If your software can interact with users remotely through a computer network, you should also make sure that it provides a way for users to get its source. For example, if your program is a web application, its interface could display a "Source" link that leads users to an archive of the code. There are many ways you could offer source, and different solutions will be better for different programs; see section 13 for the specific requirements.
 *
 * You should also get your employer (if you work as a programmer) or school, if any, to sign a "copyright disclaimer" for the program, if necessary. For more information on this, and how to apply and follow the GNU AGPL, see <https://www.gnu.org/licenses/>.
 */

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
