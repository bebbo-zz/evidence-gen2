/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */

export const handler = async (event: any, context: any) => {
    console.log(event);
  
    try {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Headers' : 'Content-Type',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': '*'
        },
        body: JSON.stringify([
          {todoId: 1, text: 'walk the dog 🐕'},
          {todoId: 2, text: 'cook dinner 🥗'},
        ]),
      };
    } catch (err: any) {
      return error(err.message);
    }
  };
  
  const error = (errMessage?: string) => {
    return {
      statusCode: 400 as const,
      headers: {
        'Access-Control-Allow-Headers' : 'Content-Type',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': '*'
      },
      body: {
        errorMessage: `Error fetching Device models: ${errMessage}`,
      },
    };
  };
