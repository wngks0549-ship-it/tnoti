// 서비스 워커: 브라우저가 화면을 닫아 둔 동안에도 푸시를 받아 알림으로 띄운다.
// 뼈대는 Next.js 공식 가이드(Progressive Web Apps)의 service worker 다.

self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon-192.png",
      tag: data.tag, // 같은 공지의 알림이 두 번 뜨지 않게 한다
      data: { url: data.url },
    }),
  );
});

// 알림을 누르면 공지 상세(S5)를 연다. 로그인 여부와 상관없이 열린다.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL((event.notification.data && event.notification.data.url) || "/", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url === target && "focus" in client) return client.focus();
      }
      return self.clients.openWindow(target);
    }),
  );
});
