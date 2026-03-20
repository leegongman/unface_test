# Unface Lightsail Deploy Checklist

## 1. Build 전 준비

- [ ] Lightsail 인스턴스와 Static IP 연결 완료
- [ ] Ubuntu 패키지 업데이트 완료
- [ ] Node.js LTS, npm, PM2 설치 완료
- [ ] `nginx`, `certbot`, `python3-certbot-nginx`, `coturn` 설치 완료
- [ ] 프로젝트 코드를 서버에 업로드 또는 git clone 완료
- [ ] 실제 도메인이 아직 없으면, 도메인 연동 전까지 Google OAuth / Stripe webhook / HTTPS 최종 검증은 보류할 것

## 2. env 입력

- [ ] `.env.production.example`을 `.env.production`으로 복사
- [ ] `NEXTAUTH_URL` 입력
- [ ] `NEXTAUTH_SECRET` 입력
- [ ] `NEXT_PUBLIC_APP_URL` 입력
- [ ] `NEXT_PUBLIC_SOCKET_URL` 입력
- [ ] `DATABASE_URL` 입력
- [ ] `GOOGLE_CLIENT_ID` 입력
- [ ] `GOOGLE_CLIENT_SECRET` 입력
- [ ] `STRIPE_SECRET_KEY` 입력
- [ ] `STRIPE_WEBHOOK_SECRET` 입력
- [ ] `SOCKET_HOST=127.0.0.1` 확인
- [ ] `SOCKET_PORT=3001` 확인
- [ ] `TURN_URL` 입력
- [ ] `TURN_USERNAME` 입력
- [ ] `TURN_CREDENTIAL` 입력

## 3. Prisma 관련 명령

- [ ] `npm ci`
- [ ] `npx prisma generate`
- [ ] `npx prisma migrate deploy`

## 4. Build

- [ ] `npm run build`
- [ ] build 중 `NEXT_PUBLIC_*` env 반영 여부 확인

## 5. PM2 실행

- [ ] `pm2 start ecosystem.config.cjs`
- [ ] `pm2 status`
- [ ] `pm2 save`
- [ ] `pm2 startup`

## 6. Nginx 적용 전 확인사항

- [ ] `127.0.0.1:3000`에서 Next 앱 응답 확인
- [ ] `127.0.0.1:3001`에서 Socket.IO 프로세스 정상 실행 확인
- [ ] `.env.production`의 `NEXTAUTH_URL`과 `NEXT_PUBLIC_APP_URL` 값 일치 확인
- [ ] `NEXT_PUBLIC_SOCKET_URL`이 메인 도메인 기준 값인지 확인
- [ ] socket server가 `127.0.0.1:3001`에만 바인딩되는지 확인
- [ ] coturn 설정 파일과 포트 개방 계획 확인

## 7. Nginx 적용 후 확인사항

- [ ] `/` -> `127.0.0.1:3000` reverse proxy 적용
- [ ] `/socket.io/` -> `127.0.0.1:3001` reverse proxy 적용
- [ ] websocket upgrade 헤더 설정 확인
- [ ] `nginx -t`
- [ ] `systemctl reload nginx`

## 8. 도메인 없을 때 임시 확인 가능한 것

- [ ] `npm run build` 성공 여부
- [ ] `pm2 start ecosystem.config.cjs`로 두 프로세스 정상 기동 여부
- [ ] 서버 내부에서 `curl http://127.0.0.1:3000` 확인
- [ ] 서버 내부에서 소켓 서버 프로세스 로그 확인
- [ ] Prisma migration 적용 여부 확인

## 9. 도메인 생긴 뒤 최종 확인할 것

- [ ] Certbot으로 HTTPS 발급
- [ ] Google OAuth redirect URI 설정
- [ ] Stripe webhook URL 설정
- [ ] `TURN_URL` 실제 도메인 기준으로 반영
- [ ] 브라우저 2개로 매칭 / 메시지 / 영상통화 확인
