# 내 카드

React + Vite로 만든 개인용 모바일 PWA입니다. 서버·계정·DB 없이 localStorage에 저장합니다.

## 실행

```sh
npm install
npm run dev
```

## 정적 빌드 및 확인

```sh
npm run build
npm run preview
npm test
```

`dist/` 전체를 HTTPS 정적 호스팅에 올리면 스마트폰에서 설치할 수 있습니다. iPhone은 Safari 공유 → 홈 화면에 추가, Android는 브라우저 메뉴 → 앱 설치를 사용합니다. localhost는 PWA 검증이 가능하지만 스마트폰의 일반 HTTP LAN 주소에서는 설치와 서비스 워커가 제한됩니다.

초기 목표는 카드당 30만원으로 설정되어 있으며 실제 카드 조건을 뜻하지 않습니다. 초기 실적은 0원, 자동결제와 즐겨찾기는 비어 있습니다. 혜택·Edition·목표는 카드 상세의 편집에서 수정하세요.

## 구조

- `src/data/cards.js`: 초기 카드 데이터
- `src/utils/finance.js`: 추천 및 실적 계산
- `src/utils/storage.js`: 백업 검증, 월 기록 이월
- `src/hooks/useCardStore.js`: localStorage 저장 및 월 변경 확인
- `src/components/`: 카드와 접근 가능한 바텀시트
- `public/manifest.json`, `public/sw.js`: 설치 및 오프라인 지원
- `scripts/precache.js`: 빌드 결과를 서비스 워커 사전 캐시에 추가

실적은 현재까지의 직접 입력 금액입니다. 예상 실적은 실적 포함으로 지정한 자동결제 월 금액을 더한 참고값으로, 이미 입력한 결제와 중복될 수 있습니다. 짧은 달의 29~31일 실제 결제일은 카드사에 따라 달라집니다.

브라우저/기기별로 데이터는 별개입니다. 내 카드 → 데이터 백업에서 JSON을 내려받고 다른 기기에서 복원하세요. 복원 전 검증과 교체 확인을 거칩니다. 저장값이 손상되면 원본을 보존하고 복원을 안내합니다.
