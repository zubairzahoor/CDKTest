# CDKTest
When we try to use the imported RestApi Gateway to define resources across stacks, it is not allowing to add new LambdaIntegration on the imported Gateway. However it work with MockIntegration as expected.
The following error is thrown on synth or deployment:

``` RestApi is not available on Resource not connected to an instance of RestApi. Use api instead ```

This works:

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

This doesn't:

const api = RestApi.fromRestApiAttributes(this, 'RestApi', {
      restApiId: props.restApiId,
      rootResourceId: props.rootResourceId
    });

    const method = api.root.addResource('pets').addMethod(
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

PS: From the repo code it is clear that "restApi throws an error on imported while api returns correctly". But I don't see how that is called. What am I missing here?
