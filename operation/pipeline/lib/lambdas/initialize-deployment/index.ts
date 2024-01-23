/*! Copyright [Amazon.com](http://amazon.com/), Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */
// import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
// import { QueryCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

/**
 * An example lambda handler which uses the generated handler wrapper to manage marshalling inputs/outputs.
 */
export const handler = async (event: any, context: any) => {
    console.log(event);

    /*
    const client = new DynamoDBClient({});
    const docClient = DynamoDBDocumentClient.from(client);

    // sortKeyName BETWEEN :sortkeyval1 AND :sortkeyval2
    const command = new QueryCommand({
        TableName: "dynamovault",
        KeyConditionExpression:
            "userid = :user_id AND created BETWEEN :start_date AND :end_date",
        ExpressionAttributeValues: {
            ":user_id": event.queryStringParameters.user_id,
            ":start_date": parseInt(event.queryStringParameters.start_date),
            ":end_date": parseInt(event.queryStringParameters.end_date)
        },
        ConsistentRead: true,
    });

    const response = await docClient.send(command);
    console.log(response);

    // ENV
    // current status
    // next status

    // update status
    // check for a certain success status
    // if success 
    // trigger action
    // move message to next status -> queue
    // log entry of success

    // check on timeout
    // enter message into error queue

    // catch error
    // enter message into error queue

    */
    try {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Headers' : 'Content-Type',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': '*'
        },
        //body: JSON.stringify(response),
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
  