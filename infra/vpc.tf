module "vpc" {
  source = "git::https://github.com/Ayub3/aws_terraform_modules.git//terraform/vpc?ref=main"
  aws_vpc = {
    name                 = "${var.project}-${var.env}-vpc"
    cidr_block           = "10.0.0.0/16"
    enable_dns_hostnames = true
    enable_dns_support   = true

    tags = {
      env     = var.env
      project = "${var.project}-vpc"
    }
  }

  public_cidr_block = ["10.0.0.0/24"]
}
