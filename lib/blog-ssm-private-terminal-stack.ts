import cdk = require('@aws-cdk/core');
import ec2 = require('@aws-cdk/aws-ec2');
import iam = require('@aws-cdk/aws-iam');
import { InterfaceVpcEndpointAwsService, InstanceType, MachineImage } from '@aws-cdk/aws-ec2';
import { ManagedPolicy } from '@aws-cdk/aws-iam';

export class BlogSsmPrivateTerminalStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'blog-vpc', {
      maxAzs: 1,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      cidr: '10.16.0.0/23',        
      subnetConfiguration: [
        {
          cidrMask: 26,
          name: 'isolated',
          subnetType: ec2.SubnetType.ISOLATED            
        }
      ]
    });
    
    vpc.addS3Endpoint('s3-gateway');
    const vpcEndpointSecurityGroup = new ec2.SecurityGroup(this, 'endpoint-security-group', {
      allowAllOutbound: true,
      vpc
    });

    vpc.addInterfaceEndpoint('ssm-messages', {
      open: true,
      privateDnsEnabled: true,
      service: InterfaceVpcEndpointAwsService.SSM_MESSAGES,
      subnets: vpc.selectSubnets(),
      securityGroups: [vpcEndpointSecurityGroup]
    });

    vpc.addInterfaceEndpoint('ec2-messages', {
      open: true,
      privateDnsEnabled: true,
      service: InterfaceVpcEndpointAwsService.EC2_MESSAGES,
      subnets: vpc.selectSubnets(),
      securityGroups: [vpcEndpointSecurityGroup]
    });

    vpc.addInterfaceEndpoint('ssm', {
      open: true,
      privateDnsEnabled: true,
      service: InterfaceVpcEndpointAwsService.SSM,
      subnets: vpc.selectSubnets(),
      securityGroups: [vpcEndpointSecurityGroup]
    });


    const ec2Role = new iam.Role(this,'ec2-role', {
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal('ec2.amazonaws.com'),
        new iam.ServicePrincipal('ssm.amazonaws.com')
      ),
      managedPolicies: [
        ManagedPolicy.fromManagedPolicyArn(this, 'ssmManaged', 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore')
      ]
    });
    
    
    const ec2Instance = new ec2.Instance(this, 'private-terminal', {
      vpc,
      machineImage: MachineImage.latestAmazonLinux(),
      instanceType: new InstanceType('t3.micro'),
      role: ec2Role,
      securityGroup: vpcEndpointSecurityGroup
    });    

  }
}
