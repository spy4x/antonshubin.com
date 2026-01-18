Drone CI is an open-source Continuous Integration and Continuous Deployment
(CI/CD) tool that helps organizations automate their software development
pipeline. With Drone CI, you can automate tasks such as building, testing, and
deploying your software, saving time and reducing the risk of human error.

In this article, we'll explore what Drone CI is, how to set it up using Docker
Compose, how to use it, and why it's a cool choice for your organization's CI/CD
needs.

## What is Drone CI?

Drone CI is a modern and flexible CI/CD platform that supports a wide range of
platforms and languages, making it a great choice for organizations that want to
automate their software development pipeline.

With Drone CI, you can easily define your build, test, and deployment pipelines
using simple YAML configuration files. The platform also has a vast library of
plugins and integrations, allowing you to easily extend its functionality and
integrate it with other tools and services.

## Setting up Drone CI using Docker Compose

Setting up Drone CI can be a complex process, especially if you're unfamiliar
with the platform. One way to simplify the setup process is to use Docker
Compose, which allows you to easily manage the services that make up your Drone
CI setup.

Here are the steps to set up Drone CI using Docker Compose:

1. Install Docker and Docker Compose on your system.

2. Create a `docker-compose.yml` file in a directory of your choice.

3. Add the following services to your `docker-compose.yml` file:

```yaml
version: "3.9"

volumes:
  ci-data:

services:
  ci:
    image: drone/drone:latest
    restart: always
    ports:
      - 80:80
      - 443:443
    environment:
      - DRONE_SERVER_HOST=localhost:80
      - DRONE_SERVER_PROTO=http
      - DRONE_SERVER_PROXY_HOST=${DRONE_SERVER_PROXY_HOST}
      - DRONE_SERVER_PROXY_PROTO=https
      - DRONE_RPC_SECRET=${DRONE_RPC_SECRET}
      - DRONE_COOKIE_SECRET=${DRONE_COOKIE_SECRET}
      - DRONE_COOKIE_TIMEOUT=720h
      - DRONE_GITHUB_CLIENT_ID=${DRONE_GITHUB_CLIENT_ID}
      - DRONE_GITHUB_CLIENT_SECRET=${DRONE_GITHUB_CLIENT_SECRET}
      - DRONE_LOGS_DEBUG=true
    volumes:
      - ci-data:/var/lib/drone/
  runner:
    image: drone/drone-runner-docker:latest
    restart: always
    environment:
      - DRONE_RPC_HOST=ci
      - DRONE_RPC_PROTO=http
      - DRONE_RPC_SECRET=${DRONE_RPC_SECRET}
      - DRONE_RUNNER_NAME=runner-1
      - DRONE_TMATE_ENABLED=true
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
```

4. Add `.env` file with next variables:

```bash
DRONE_SERVER_PROXY_HOST=<IP_OF_YOUR_VM>
DRONE_RPC_SECRET=<JUST_SOME_RANDOM_STRING>
DRONE_COOKIE_SECRET=<JUST_SOME_RANDOM_STRING>
DRONE_GITHUB_CLIENT_ID=<GET_FROM_GITHUB_OAUTH_APP>
DRONE_GITHUB_CLIENT_SECRET=<GET_FROM_GITHUB_OAUTH_APP>
```

- For GITHUB_CLIENT vars - follow GitHub integration instructions at
  https://docs.drone.io/server/provider/github/
- Fill .env file with your GitHub OAuth app credentials and generate other
  secret keys.

5. Start the services by running the following command in the directory where
   your `docker-compose.yml` file is located:

```bash
docker-compose up -d
```

That will start Drone CI services and you will be able to access it at
`http://localhost:80`

## Using Drone CI

Once you have set up Drone CI using Docker Compose, you're ready to start using
it to automate your software development pipeline.

To use Drone CI, you need to define your build, test, and deployment pipelines
using simple YAML configuration files. The configuration files specify the steps
that Drone CI should take to build, test, and deploy your software, as well as
any environment variables and secrets that your pipelines need.

Here's an example of a basic Drone CI pipeline configuration file:

```yaml
kind: pipeline
type: docker
name: default

steps:
  - name: Build
    image: node:lts-slim
    commands:
      - npm install
      - npm test

services:
  - name: database
    image: mysql
    ports:
      - 3306
```

It uses LTS version of Node.js (slim linux image) to install dependencies and
test the project that relies on MySQL database.

You can trigger a build by clicking "+ NEW BUILD" button or by committing code
to your GitHub repo and pushing it to your repository. Drone CI will
automatically detect the new code and run the pipeline defined in your
configuration file.

## Why Drone CI is cool

There are several reasons why Drone CI is a cool choice for your organization's
CI/CD needs:

1. Open-source: Drone CI is open-source, meaning that you have access to the
   source code and can modify it to meet your specific needs.

2. Flexibility: Drone CI supports a wide range of platforms and languages,
   making it a great choice for organizations that use multiple platforms and
   languages.

3. Easy to use: Drone CI has a simple and intuitive user interface that makes it
   easy to set up and manage your pipelines.

4. Scalable: Drone CI can scale to meet the needs of large organizations, with
   the ability to allocate multiple servers for large projects.

## Comparison with GitHub CI

Drone CI and GitHub CI both have their pros and cons, and the choice between the
two will depend on your specific needs.

Pros of Drone CI:

- Open-source
- Flexibility
- Easy to use
- Scalable

Cons of Drone CI:

- Less well known than GitHub CI
- Fewer third-party integrations

Pros of GitHub CI:

- Well known and widely used
- Lots of third-party integrations

Cons of GitHub CI:

- Proprietary and closed-source
- Limited flexibility compared to Drone CI

## Allocating a single server for multiple projects

You can allocate a single server for Drone CI and use it for multiple projects,
because in most cases projects don't run many jobs at the same time. By using a
single Drone CI server for multiple projects, you can better utilize its
resources.

This is particularly useful for organizations with a large number of small
projects, as it allows them to make better use of their resources and reduce
costs.

In conclusion, Drone CI is a powerful, flexible, and easy-to-use CI/CD platform
that can help your organization automate its software development process.
Whether you're a small startup or a large enterprise, Drone CI is a great choice
for your CI/CD needs.
