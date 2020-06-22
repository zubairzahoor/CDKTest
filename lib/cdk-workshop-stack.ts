import cdk = require('@aws-cdk/core');
import apigateway = require('@aws-cdk/aws-apigateway');
import cfn = require('@aws-cdk/aws-cloudformation');
import {
  RestApi,
  Method,
  MockIntegration,
  PassthroughBehavior,
  Deployment,
  Stage,
  LambdaIntegration
} from '@aws-cdk/aws-apigateway';
import lambda = require('@aws-cdk/aws-lambda');
export interface Env {
  region: string;
  account: string;
}

interface StackProps extends cdk.StackProps {
  stage: string; // dev/prod
  env: Env;
}

export class RootStack extends cdk.Stack {
  constructor(scope: cdk.Construct) {
    super(scope, 'integ-restapi-import-RootStack');

    const restApi = new RestApi(this, 'RestApi', {
      deploy: false
    });
    restApi.root.addMethod('ANY');

   
    const petsStack = new PetsStack(this, {
      restApiId: restApi.restApiId,
      rootResourceId: restApi.restApiRootResourceId
    });
    const booksStack = new BooksStack(this, {
      restApiId: restApi.restApiId,
      rootResourceId: restApi.restApiRootResourceId
    });
    new DeployStack(this, {
      restApiId: restApi.restApiId,
      methods: [...petsStack.methods, ...booksStack.methods]
    });
  }
}

interface ResourceNestedStackProps extends cfn.NestedStackProps {
  readonly restApiId: string;

  readonly rootResourceId: string;
}

class PetsStack extends cfn.NestedStack {
  public readonly methods: Method[] = [];

  constructor(scope: cdk.Construct, props: ResourceNestedStackProps) {
    super(scope, 'integ-restapi-import-PetsStack', props);

    const api = RestApi.fromRestApiAttributes(this, 'RestApi', {
      restApiId: props.restApiId,
      rootResourceId: props.rootResourceId
    });

    const method = api.root.addResource('pets').addMethod(
      'GET',
      new MockIntegration({
        integrationResponses: [
          {
            statusCode: '200'
          }
        ],
        passthroughBehavior: PassthroughBehavior.NEVER,
        requestTemplates: {
          'application/json': '{ "statusCode": 200 }'
        }
      }),
      {
        methodResponses: [{ statusCode: '200' }]
      }
    );

    this.methods.push(method);
  }
}

class BooksStack extends cfn.NestedStack {
  public readonly methods: Method[] = [];

  constructor(scope: cdk.Construct, props: ResourceNestedStackProps) {
    super(scope, 'integ-restapi-import-BooksStack', props);

    const api = RestApi.fromRestApiAttributes(this, 'RestApi', {
      restApiId: props.restApiId,
      rootResourceId: props.rootResourceId
    });

    const method = api.root.addResource('books').addMethod(
      'GET',
      new LambdaIntegration(
        new lambda.Function(this, 'MyLambda', {
          code: new lambda.AssetCode('src'),

          handler: 'index.main',
          runtime: lambda.Runtime.PYTHON_3_6
        })
      ),
      {
        methodResponses: [{ statusCode: '200' }]
      }
    );

    this.methods.push(method);
  }
}

interface DeployStackProps extends cfn.NestedStackProps {
  readonly restApiId: string;

  readonly methods?: Method[];
}

class DeployStack extends cfn.NestedStack {
  constructor(scope: cdk.Construct, props: DeployStackProps) {
    super(scope, 'integ-restapi-import-DeployStack', props);

    const deployment = new Deployment(this, 'Deployment', {
      api: RestApi.fromRestApiId(this, 'RestApi', props.restApiId)
    });
    props.methods!.forEach((method) => deployment.node.addDependency(method));
    new Stage(this, 'Stage', { deployment });
  }
}

  
