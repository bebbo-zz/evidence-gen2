import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Duration } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { SqsDestination } from 'aws-cdk-lib/aws-lambda-destinations';
// import types!!!
import * as path from 'path';
import { Action, Step } from './config/model';

// SDK
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // failure handling
    const failureQueue = new sqs.Queue(this, 'FailureQueue');
    const failureFunction = new NodejsFunction(this, 'FailureFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      depsLockFilePath: path.join(__dirname, 'lambdas', 'failure-handler', 'package-lock.json'),
      entry: path.join(__dirname, 'lambdas', 'failure-handler', 'index.ts'),
      timeout: Duration.seconds(30),
    });

    var actions: Map<string, Action> = new Map<string, Action>([
      ['initialize', {type: 'lambda', name: 'initializeFn', code: path.join(__dirname, 'lambdas', 'initialize-deployment'), function: failureFunction}],
      ['checkBackendTriggerCodeReview', {type: 'lambda', name: 'checkBackendFn', code: path.join(__dirname, 'lambdas', 'check-backend-trigger-codereview'), function: failureFunction}],
      ['success', {type: 'none', name: 'success', code: '', function: failureFunction}],
    ]);
    console.log(actions.get('initialize'));

    // order is order of steps
    var pipeline: Step[] = [
      {status: 'INITIALIZATION', action: actions.get('initialize'), queueFlag: false, queue: failureQueue },
      {status: 'BACKEND_DEPLOYMENT', action: actions.get('checkBackendTriggerCodeReview'), queueFlag: true, delay: Duration.minutes(5), invisible: Duration.seconds(30), queue: failureQueue },
   //   {status: 'STATIC_CODE_ANALYSIS', action: actions.get('checkCodeReviewTriggerBuild'), queueFlag: true, delay: Duration.minutes(5), invisible: Duration.seconds(30), queue: failureQueue },
   //   {status: 'BUILD', action: actions.get('checkBuildTriggerBundleTest'), queueFlag: true, delay: Duration.minutes(5), invisible: Duration.seconds(30), queue: failureQueue },
   //   {status: 'BUNDLE_TEST', action: actions.get('checkBundleTestTriggerTestflight'), queueFlag: true, delay: Duration.minutes(5), invisible: Duration.seconds(30), queue: failureQueue },
   //   {status: 'TESTFLIGHT', action: actions.get('checkTestFlightTriggerProdBuild'), queueFlag: true, delay: Duration.minutes(5), invisible: Duration.seconds(30), queue: failureQueue },
   //   {status: 'PROD_BACKEND', action: actions.get('checkManualApprovalTriggerProdBuild'), queueFlag: true, delay: Duration.minutes(5), invisible: Duration.seconds(30), queue: failureQueue },
   //   {status: 'PROD_BUILD', action: actions.get('checkManualApprovalTriggerProdBuild'), queueFlag: true, delay: Duration.minutes(5), invisible: Duration.seconds(30), queue: failureQueue },
   //   {status: 'SMOKE_TEST', action: actions.get('checkManualApprovalTriggerProdBuild'), queueFlag: true, delay: Duration.minutes(5), invisible: Duration.seconds(30), queue: failureQueue },
   //   {status: 'PROD_DEPLOYMENT', action: actions.get('checkManualApprovalTriggerProdBuild'), queueFlag: true, delay: Duration.minutes(5), invisible: Duration.seconds(30), queue: failureQueue },
      {status: 'SUCCESS', action: actions.get('success'), queueFlag: false, queue: failureQueue}, 
    ]

    // create loop through pipeline using for and i as the variable to count
    for (let i = 0; i < pipeline.length; i++) {
       const item = pipeline[i];
       if(item.action === undefined) continue;
       if (item.action.type === 'lambda') {
        item.action.function = new NodejsFunction(this, item.action.name, {
          runtime: lambda.Runtime.NODEJS_20_X,
          handler: 'index.handler',
          depsLockFilePath: path.join(item.action.code, 'package-lock.json'),
          entry: path.join(item.action.code, 'index.ts'),
          timeout: Duration.seconds(30),
          onFailure: new SqsDestination(failureQueue),
          environment: {
            "currentStep": item.status, // event source
            "nextStep": pipeline[i+1].status, // putting message there
          }
        });
      }
      if(item.queueFlag) {
        pipeline[i].queue = new sqs.Queue(this, item.status+'_queue', {
          visibilityTimeout: item.invisible,
          deliveryDelay: item.delay,
        });
        pipeline[i].queue.grantConsumeMessages(item.action.function);
        item.action.function.addEventSource(new SqsEventSource(pipeline[i].queue));
        console.log(pipeline[i].queue.queueUrl);

        var putCommand = new PutCommand({
          TableName: "pipelinevault",
          Item: {
            "type": "queue",
            "id": item.status,
            "url": pipeline[i].queue.queueUrl
          },
          ConditionExpression: "type = :ty and id = :i",
          ExpressionAttributeValues: {
            ":ty":"queue",
            ":i":item.status
          }
        });
        docClient.send(putCommand);
      }
    }
  }
}
