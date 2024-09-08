import { bookApiFunction } from "./function/api-function/resource";
import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { Stack } from "aws-cdk-lib";
import {
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  Cors,
  LambdaIntegration,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { Policy, PolicyStatement } from "aws-cdk-lib/aws-iam";

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  bookApiFunction,
});

const apiStack = backend.createStack("api-stack");

const bookRestApi = new RestApi(apiStack, "RestApi", {
  restApiName: "bookRestApi",
  deploy: true,
  deployOptions: {
    stageName: "dev",
  },
  defaultCorsPreflightOptions: {
    allowOrigins: Cors.ALL_ORIGINS, // Restrict this to domains you trust
    allowMethods: Cors.ALL_METHODS, // Specify only the methods you need to allow
    allowHeaders: Cors.DEFAULT_HEADERS, // Specify only the headers you need to allow
  },
});

// create a new Lambda integration
const lambdaIntegration = new LambdaIntegration(
  backend.bookApiFunction.resources.lambda
);

// create a new resource path with IAM authorization
const itemsPath = bookRestApi.root.addResource("items", {
  defaultMethodOptions: {
    authorizationType: AuthorizationType.IAM,
  },
});

itemsPath.addMethod("GET", lambdaIntegration);
itemsPath.addMethod("POST", lambdaIntegration);
itemsPath.addMethod("DELETE", lambdaIntegration);
itemsPath.addMethod("PUT", lambdaIntegration);

// add a proxy resource path to the API
itemsPath.addProxy({
  anyMethod: true,
  defaultIntegration: lambdaIntegration,
});

// create a new Cognito User Pools authorizer
const cognitoAuth = new CognitoUserPoolsAuthorizer(apiStack, "CognitoAuth", {
  cognitoUserPools: [backend.auth.resources.userPool],
});

// create a new resource path with Cognito authorization
const booksPath = bookRestApi.root.addResource("cognito-auth-path");
booksPath.addMethod("GET", lambdaIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer: cognitoAuth,
});

// create a new IAM policy to allow Invoke access to the API
const apiRestPolicy = new Policy(apiStack, "RestApiPolicy", {
  statements: [
    new PolicyStatement({
      actions: ["execute-api:Invoke"],
      resources: [
        `${bookRestApi.arnForExecuteApi("*", "/items", "dev")}`,
        `${bookRestApi.arnForExecuteApi("*", "/items/*", "dev")}`,
        `${bookRestApi.arnForExecuteApi("*", "/cognito-auth-path", "dev")}`,
      ],
    }),
  ],
});

// attach the policy to the authenticated and unauthenticated IAM roles
backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(
  apiRestPolicy
);
backend.auth.resources.unauthenticatedUserIamRole.attachInlinePolicy(
  apiRestPolicy
);

// add outputs to the configuration file
backend.addOutput({
  custom: {
    API: {
      [bookRestApi.restApiName]: {
        endpoint: bookRestApi.url,
        region: Stack.of(bookRestApi).region,
        apiName: bookRestApi.restApiName,
      },
    },
  },
});