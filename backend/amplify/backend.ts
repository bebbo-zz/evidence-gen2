import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource.js';
import { data } from './data/resource.js';
import { Duration, Stack } from 'aws-cdk-lib';

import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { DynamoEventSource, SqsDlq } from 'aws-cdk-lib/aws-lambda-event-sources';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { CfnLedger } from 'aws-cdk-lib/aws-qldb';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
//import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backend = defineBackend({
  auth,
  data,
});

// create the bucket and its stack
const bucketStack = backend.createStack('BucketStack');
const bucket = new s3.Bucket(bucketStack, 'Bucket', {
  blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL
});
// have to add more fine-grained access control
// allow any authenticated user to read and write to the bucket
const authRole = backend.resources.auth.resources.authenticatedUserIamRole;
bucket.grantReadWrite(authRole);

// using CfnTable (L3)
backend.resources.data.resources.amplifyDynamoDbTables['Evidence'].billingMode = dynamodb.BillingMode.PAY_PER_REQUEST;

// add new stack for custom resources
const customResourceStack = backend.createStack('CustomResourceStack');

// add a lambda function into the custom resource stack using NodeJsFunction construct
const streamReceiverFunctionRole = new iam.Role(customResourceStack, 'triggeredByEntry', {
  assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),   // required
});
streamReceiverFunctionRole.addToPolicy(new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  resources: ['*'],
  actions: ['dynamodb:PutItem'],
}));
streamReceiverFunctionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'));
const streamReceiverFunction = new NodejsFunction(customResourceStack, 'StreamReceiverFunctio', {
  runtime: lambda.Runtime.NODEJS_18_X,
  timeout: Duration.seconds(30),
  handler: 'index.handler',
  depsLockFilePath: path.join(__dirname, 'lambdas', 'receiver', 'package-lock.json'),
  entry: path.join(__dirname, 'lambdas', 'receiver', 'index.ts'),
  role: streamReceiverFunctionRole
});


const dataResources = backend.resources.data.resources;
Object.values(dataResources.cfnResources.cfnTables).forEach((item) => {
  console.log(item.tableName);
});

console.log(backend.resources.data.resources.tables);
console.log(backend.resources.data.resources.cfnResources.cfnTables);
console.log(backend.resources.data.resources.amplifyDynamoDbTables);
console.log(backend.resources.data.resources.amplifyDynamoDbTables['Evidence']);

// L2 DynamoDB
//const tableArn = dataResources.tables["Evidence"].tableArn;

//const table = backend.resources.data.resources.amplifyDynamoDbTables['Evidence'];
const deadLetterQueue = new sqs.Queue(customResourceStack, 'deadLetterQueue');
/*streamReceiverFunction.addEventSource({
  startingPosition: lambda.StartingPosition.TRIM_HORIZON,
  batchSize: 1,
  bisectBatchOnError: true,
  onFailure: new SqsDlq(deadLetterQueue),
  retryAttempts: 10,
});

new lambda.CfnEventSourceMapping(customResourceStack, 'eventSourceMapping', {
    eventSourceArn: tableStreamArn,
    functionName: streamReceiverFunction.functionArn,
    startingPosition: 'TRIM_HORIZON',
});
*/

// QLDB
const ledger = new CfnLedger(customResourceStack, 'MyQldb', {
  permissionsMode: 'STANDARD'
});

var putQldbJson = {
  Type: 'Task',
  Resource: 'arn:aws:states:::aws-sdk:qldbsession:sendCommand',
  Parameters: {},
  ResultPath: '$.ledger',
};

const putQldbState = new sfn.CustomState(customResourceStack, 'putQldbState', {
  stateJson: putQldbJson
});

var putDynamodbJson = {
  Type: 'Task',
  Resource: 'arn:aws:states:::aws-sdk:qldbsession:sendCommand',
  Parameters: {},
  ResultPath: null,
};

const putDynamodbState = new sfn.CustomState(customResourceStack, 'putDynamodbState', {
  stateJson: putDynamodbJson
});

const chain = sfn.Chain.start(putQldbState)
  .next(putDynamodbState);

// create role for state machine which has permission to write to the ledger and table
const stateMachineRole = new iam.Role(customResourceStack, 'PutInQldbStateMachineRole', {
  assumedBy: new iam.ServicePrincipal('states.amazonaws.com'),
}
);
stateMachineRole.addToPolicy(new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    resources: ["*"],
    actions: ['qldb:SendCommand']
}));

const sm = new sfn.StateMachine(customResourceStack, 'PutInQldbStateMachine', {
  definitionBody: sfn.DefinitionBody.fromChainable(chain),
  timeout: Duration.seconds(30),
  comment: 'a super cool state machine',
  role: stateMachineRole,
});

//table.grantWriteData(sm);
