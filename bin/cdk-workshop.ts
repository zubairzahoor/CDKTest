#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { RootStack } from '../lib/cdk-workshop-stack';

const app = new cdk.App();
new RootStack(new cdk.App());
