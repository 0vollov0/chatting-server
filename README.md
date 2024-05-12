## Description

This project is chatting service that is server side with a socket.

This project has a monorepo architecture, and the applications are architecture as bellow.

## Apps

- api 
- file
- socket
- worker

## Features

- User registration and login function
- Security communication feature utilizing JWT token
- Connecting and disconnecting sockets
- Chatting room management function
- Text and file relay and storage function
- A feature that makes cache with a chat log
- A feature that save a chat log that has cached with out concurrency problem
- A feature that delete expired file and old chat log every specific time
- A function that save chat logs as batch
- Some test codes including unit and e2e

## System architecture
![SYSTEM_ARCHITECTURE](./readme_assets/system_architecture.png)

## Sequence diagram

### 1. Send chat

```mermaid
sequenceDiagram
  participant front as Front
  participant api as API
  participant socket as Socket
  participant file as File
  participant redis as Redis
  
  autonumber
  
  front ->>+ api: login
  activate front
  api -->>- front: token
  deactivate front

  activate socket
  front ->>+ socket: connect
  activate front
  alt validate token
    socket -->> front: allow connection
  else invalidate token
    socket -->> front: reject connection
  end
  deactivate front
  deactivate socket

  front ->> socket: send chat with file
  activate socket
  activate front
  activate file
  socket ->> file: send file buffer
  file ->> file: save file on the storage
  file -->> socket: file url
  deactivate file
  socket ->> redis: save chat with file url
  activate redis
  redis ->> redis: save
  deactivate redis
  socket -->> front: chat with file url to all connection
  deactivate front
  deactivate socket
```

### 2. Load chat

```mermaid
sequenceDiagram
  participant front as Front
  participant api as API
  participant mongodb as MongoDB
  participant file as File
  participant redis as Redis
  
  autonumber
  
  front ->>+ api: login
  activate front
  api -->>- front: token
  deactivate front

  front ->> api: request chat logs
  activate front
  activate api
  api ->> redis: request cached chat logs
  activate redis
  activate api
  api ->> mongodb: request chat logs
  activate mongodb
  redis -->> api: cached chat logs
  deactivate redis
  mongodb -->> api: chat logs
  deactivate mongodb
  api ->> api: merge chat logs
  deactivate api
  api -->> front: chat logs with pagination
  deactivate api
  deactivate front

  front ->>+ file: request file
  activate front
  file -->>- front: buffer
  deactivate front

```

## Before to run

You need to update .env.local file to run this project.

Please follow the comment on the that file.

## Installation

```bash
$ yarn install
```

## Running the app

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Test

```bash
# unit tests
$ yarn run test
```

## Docker
```bash
# you can use docker-compose.yml for this
$ docker compose up -d
```