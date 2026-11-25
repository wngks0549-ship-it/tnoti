# TNoti 웹

Next.js 16(App Router) + Supabase. 휴대폰 화면 기준이다. 디자인 값은 저장소 루트의 `theme.md`를 따른다.

## 실행

```bash
cd web
npm install
cp .env.example .env.local
npm run dev
```

브라우저에서 http://localhost:3000 을 연다.

## 지금 있는 화면

| 주소 | 화면 | 요구사항 | 로그인 |
| --- | --- | --- | --- |
| `/` | S1 랜딩 | FR-01 | 불필요 |
| `/login` | S2 가입·로그인 | FR-02 | 불필요 |
| `/notices/{번호}` | S5 공지 상세 | FR-13 | 불필요 |
| `/subscribe` | S3 구독 설정(저장까지. 알림 허용은 푸시를 만들 때) | FR-03 | 필요 |
| `/notices` | S4 맞춤 공지 목록 | FR-12 | 필요 |
| `/alerts` | S6 알림 내역(발송을 만들기 전에는 비어 있다) | FR-14 | 필요 |
| `/settings` | S7 설정(알림 켜기·끄기, 주기, 로그아웃, 탈퇴) | FR-05, FR-06 | 필요 |

## 시안 (로그인 없이 보는 화면)

`/preview`에서 화면 7개를 한 번에 열 수 있다. 공지는 실제 데이터이고 계정·구독·알림 기록은 예시다. 눌러도 저장되지 않는다.

| 주소 | 화면 | 쓰는 조각 |
| --- | --- | --- |
| `/preview/subscribe` | S3 구독 설정, 알림 허용 | `components/subscribe-form.tsx` |
| `/preview/notices` | S4 맞춤 공지 목록 | `components/notice-list.tsx` |
| `/preview/alerts` | S6 알림 내역 | `components/alert-list.tsx` |
| `/preview/settings` | S7 설정 | `components/settings-form.tsx` |

진짜 화면(`/subscribe`, `/notices`, `/alerts`, `/settings`)은 같은 조각에 로그인한 회원의 데이터를 넣은 것이다.

## 로그인이 되려면 (Supabase 대시보드에서 한 번)

1. **Authentication → URL Configuration:** Site URL에 실제 주소를 넣고, Redirect URLs에 `http://localhost:3000/**`와 배포 주소를 더한다.
2. **Authentication → Email Templates → Magic Link:** 링크를 아래로 바꾼다. 메일을 연 기기가 달라도 로그인된다.

   ```html
   <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">TNoti 로그인</a>
   ```

3. **Authentication → Providers → Email:** Email OTP Expiration을 900초(15분)로 맞춘다(FR-02).
4. Supabase 기본 메일은 조직 팀원 주소로만 간다. 다른 사람도 가입하게 하려면 **Authentication → SMTP Settings**에 메일 발송 계정을 연결한다.

## 구조

```
app/                 화면과 라우트
  login/             S2. actions.ts 가 로그인 링크를 보낸다
  auth/confirm       메일의 링크가 도착하는 곳(token_hash 방식)
  auth/callback      기본 메일 문구를 쓸 때 도착하는 곳(code 방식)
  notices/[id]/      S5
components/          여러 화면이 같이 쓰는 조각
lib/supabase/        Supabase 클라이언트(브라우저, 서버, 프록시). 공식 문서의 코드다
lib/notices.ts       공지 읽기
proxy.ts             요청마다 세션을 갱신하고 로그인이 필요한 화면을 막는다
```

학교 메일(`@tukorea.ac.kr`) 제한은 두 곳에서 한다: `app/login/actions.ts`(안내 문구)와 DB 트리거(`supabase/migrations/20261125051159_member_on_signup.sql`, 실제 차단).
