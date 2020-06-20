#!/usr/bin/env node
import cdk = require('@aws-cdk/core');
import { BlogSsmPrivateTerminalStack } from '../lib/blog-ssm-private-terminal-stack';

const app = new cdk.App();
new BlogSsmPrivateTerminalStack(app, 'BlogSsmPrivateTerminalStack');