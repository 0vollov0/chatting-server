# 고성능 채팅 서비스

### 개요

---

본 프로젝트는 대규모 실시간 채팅 로그를 효율적으로 관리하고 안정적인 데이터 저장을 보장하기 위해 Redis 기반의 캐싱 전략과 배치 처리 방식을 결합한 고성능 채팅 서버 시스템입니다.

일반적인 실시간 채팅 시스템에서 발생하는 데이터베이스 부하 문제를 해결하기 위해, 개별 메시지를 즉시 저장하는 방식이 아닌 캐시서버를 활용한 캐싱 메커니즘을 도입하였습니다. 채팅 로그는 먼저 캐시 서버에 저장 되며, 일정 주기가 도래하면 Worker 서버의 스케줄러가 배치 방식으로 데이터베이스에 일괄 저장하는 구조를 채택하였습니다. 이를 통해 데이터베이스 I/O 부하를 최소화하고, 서버 성능을 최적화하였습니다.

### 구조 개선

---

A. DB 단일 구조

![정통_구조.png](./readme_assets/1.png)

B. 캐시서버 활용 구조

![개선_구조.drawio.png](./readme_assets/2.png)

**구조 비교표**

| **항목** | DB 단일 구조 | 캐시서버 활용 구조 |
| --- | --- | --- |
| **DB 부하** | 클라이언트 요청마다 DB에 직접 저장으로 높은 부하 발생 | 캐시 서버를 통해 DB 호출 빈도 감소로 부하 경감 |
| **응답 속도** | DB 작업에 따라 응답 지연 가능성 있음 | 캐시 서버를 활용해 빠른 응답 제공 |
| **성능** | 실시간 요청 증가 시 병목 현상 발생 가능 | 캐시 서버로 병목 현상 방지 |
| **대량 데이터 처리** | 대량 요청 처리 시 DB에 과부하 발생 | 캐시 서버가 대량 데이터 처리에 효과적  |

### 성능 테스트

테스트는 총 10초 동안 진행되며, 처음에는 초당 10명의 가상 사용자가 생성됩니다. 이후 점진적으로 증가하여 최대 초당 200명의 사용자가 접속하게 됩니다. 각 사용자는 chat 이벤트를 300번 반복해서 전송하며, 이론 상 한 명의 사용자가 총 300여개 까지 채팅 메시지를 서버로 보냅니다.

**가상 사용자 생성 및 완료율**

| 항목                | DB 단일 구조 | 캐시서버 활용 구조 | 변화  |
|---------------------|------------|-----------------|------|
| 총 생성된 vusers   | 1050       | 1050            | 동일 |
| 실패한 vusers      | 0          | 0               | 동일 |
| 완료된 vusers      | 1050       | 1050            | 동일 |
| 성공률 (%)         | 100%       | 100%            | 동일 |

**Socket.io 이벤트 처리**

| 항목             | DB 단일 구조       | 캐시서버 활용 구조 | 변화                      |
|-----------------|-----------------|-----------------|-------------------------|
| 총 이벤트 발생  | 315,000         | 315,000         | 동일                    |
| 이벤트 발생률   | 44,255 events/sec | 34,083 events/sec | 감소 (-10,172 events/sec) |
| 최대 응답 시간  | 3.1ms           | 1.4ms           | 감소 (-1.7ms)           |
| 평균 응답 시간  | 0ms             | 0ms             | 동일                    |
| 99.9% 응답 시간 | 0.1ms           | 0ms             | 감소 (-0.1ms)           |

**세션 지속 시간**

| 항목                | DB 단일 구조 | 캐시서버 활용 구조 | 변화                      |
|---------------------|------------|-----------------|-------------------------|
| 평균 세션 지속 시간 | 17.5초     | 6.9초           | 감소 (-10.6초)          |
| 최대 세션 지속 시간 | 331.9초    | 40.1초          | 감소 (-291.8초)         |
| 중앙값 (p50)       | 12.8초     | 6초             | 감소 (-6.8초)           |
| 99.9% 지속 시간    | 314.2초    | 23.8초          | 감소 (-290.4초)         |
**세션 지속 시간**


### 시스템 구성

---

![시스템 구성도](./readme_assets/3.png)

**API Server:** 사용자에게 채팅방 목록과 채팅 로그를 제공하는 역할을 수행합니다.

**Socket Server:** 클라이언트와의 Socket 연결을 통해 실시간 데이터를 주고받는 기능을 담당합니다.

**File Server:** gRPC통신으로 Buffer 형식의 데이터를 받아 특정 파일 확장자로 저장하는 기능을 담당합니다.

**Worker Server:** 일정 주기마다 캐시된 채팅 데이터를 DB에 저장 하거나 기간 만료된 파일 또는 채팅 데이터를 제거하는 기능을 수행합니다.

### **사용 기술**

---

| **구분**          | **기술**                  |
|----------------------|--------------------------------|
| **Back-End**        | Nest.js(Express), Socket.io, gRPC |
| **Database**        | MongoDB                         |
| **Cache** | Redis                          |
| **Project Management** | MonoRepo, MSA                   |
| **Test Tool**        | Artillery                       |
| **Open API**        | Swagger                         |

### 주요 기능

---

| **구분**                |       **설명**  |
| :---               |:---        |
| 사용자 등록 및 로그인   | 사용자 인증을 위한 강력한 등록 및 로그인 시스템을 구현하여, 사용자 데이터의 안전한 관리와 접근을 보장합니다.     |
| JWT 토큰을 이용한 보안 통신   | 사용자 인증과 세션 관리를 위해 JWT(Json Web Token) 토큰을 활용하여, 통신 과정에서의 데이터 보안을 강화했습니다.     |
| 채팅방 관리   | 다양한 채팅방을 생성하고 관리할 수 있는 기능을 제공하여, 사용자 간의 원활한 상호작용을 지원합니다. 채팅방 내에서의 권한 관리와 사용자 제어 기능도 포함되어 있습니다.     |
| 텍스트 및 파일 저장   | 사용자가 주고받는 텍스트 메시지와 파일을 서버에 저장하여 데이터의 일관성과 무결성을 유지합니다.     |
| 채팅 로그 캐싱   | Redis 을 활용하여 실시간 채팅 로그를 스트리밍 방식으로 캐시 처리하여, 데이터베이스에 대한 I/O 부하를 획기적으로 완화하고 초저지연 데이터 접근을 보장합니다.     |
| 동시성 문제 해결을 통한 캐시 데이터 저장   | Redis XStream을 활용하여 채팅 로그를 스트림 단위로 처리하고, 워커 프로세스를 통해 일정 주기마다 일괄적으로 데이터베이스에 저장하는 메커니즘을 구현하여, 동시성 문제를 방지하고 데이터 무결성을 유지할 수 있도록 설계하였습니다.     |
| 만료된 파일 및 오래된 채팅 로그 삭제   | 일정 시간마다 만료된 파일과 오래된 채팅 로그를 자동으로 정리하여, 시스템의 성능을 유지하고 불필요한 리소스 낭비를 방지합니다.     |
| 채팅 로그 일괄 저장   | 일정 시간 동안 캐시된 채팅 로그를 일괄적으로 데이터베이스에 저장함으로써, 대규모 데이터를 효율적으로 처리하고 관리할 수 있는 기능을 제공했습니다.     |
| 테스트 코드   | 단위 테스트 및 e2e(End-to-End) 테스트를 포함한 일부 테스트 코드를 작성하여, 시스템의 안정성과 신뢰성을 검증하고 유지보수성을 높였습니다.     |

### 주요 순서도

---
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

  front ->> socket: send chat with file from 'room'
  activate socket
  activate front
  activate file
  socket ->> file: send file buffer
  file ->> file: save a file on the storage
  alt file save success
    file -->> socket: file url
    socket ->> redis: XADD chat-stream IDempotentKey chatData
    alt save success
      socket -->> front: chat with file URL to all connections
    else save failed
      socket -->> front: error saving chat
    end
  else file save failed
    file -->> socket: error response
    socket -->> front: file upload failed
  end
  deactivate file
  deactivate front
  deactivate socket
```



```mermaid
sequenceDiagram
  participant worker as Worker (Scheduler)
  participant redis as Redis
  participant db as Database
  
  autonumber
  
  worker ->> redis: XRANGE chat-stream (Retrieve batch messages)
  alt Messages exist
    worker ->> worker: Process chat messages
    worker ->> db: Bulk Insert chat messages
    alt DB Insert Success
      worker ->> redis: XDEL chat-stream (Delete processed messages)
    else DB Insert Failed
      worker ->> redis: XACK chat-stream (Mark messages as pending)
    end
  else No messages
    worker -->> worker: Wait for next scheduled execution
  end
```

```mermaid
sequenceDiagram
  participant front as Front
  participant api as API
  participant db as DB
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

  api ->> redis: request recent chat logs (XREAD)
  activate redis
  redis -->> api: recent chat logs
  deactivate redis

  api ->> db: request historical chat logs (pagination)
  activate db
  db -->> api: historical chat logs
  deactivate db

  api ->> api: merge XStream logs with DB logs
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