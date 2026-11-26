// 브라우저에서 푸시 알림을 켠다(FR-04). 뼈대는 Next.js 공식 가이드(Progressive Web Apps)다.
// 허용하면 푸시 구독을 만들어 서버에 저장하고, 거부했거나 지원하지 않으면 그 사실을 돌려준다.

export type PushSubscriptionData = { endpoint: string; p256dh: string; auth: string };

export type PushOutcome =
  | { status: "push" }
  | { status: "denied" } // 브라우저에서 알림을 막았다
  | { status: "unsupported" } // 웹 푸시를 못 쓰는 기기·브라우저(아이폰은 홈 화면에 추가해야 한다)
  | { status: "error"; message: string };

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export async function enablePush(
  save: (sub: PushSubscriptionData) => Promise<{ error?: string }>,
): Promise<PushOutcome> {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (
    !publicKey ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window)
  ) {
    return { status: "unsupported" };
  }

  let step = "알림 권한 묻기";
  try {
    const permission = await Notification.requestPermission();
    // "default" 는 묻는 창을 그냥 닫은 경우다. 막은 것이 아니라서 다시 누르면 또 물어본다.
    if (permission === "default") {
      return { status: "error", message: "알림을 허용할지 고르지 않았어요. 다시 눌러서 허용을 골라 주세요." };
    }
    if (permission !== "granted") return { status: "denied" };

    step = "서비스 워커 등록";
    await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
    const registration = await withTimeout(navigator.serviceWorker.ready, 10_000);

    step = "푸시 구독 만들기";
    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await withTimeout(
        registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }),
        20_000,
      ));

    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
      return { status: "error", message: "알림 구독 정보를 받지 못했어요." };
    }

    const result = await save({ endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth });
    if (result.error) return { status: "error", message: result.error };
    return { status: "push" };
  } catch (e) {
    console.error("푸시 구독 실패:", step, e);
    // 어느 단계에서 왜 멈췄는지 화면에 남긴다. 브라우저마다 실패하는 자리가 달라서 이 정보가 있어야 고친다.
    const reason = e instanceof Error ? e.name : "알 수 없는 오류";
    return { status: "error", message: `알림을 켜지 못했어요. (${step} 단계, ${reason})` };
  }
}

/** 브라우저가 답을 주지 않고 멈추는 경우에 버튼이 계속 잠겨 있지 않게 한다. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      const e = new Error("시간 초과");
      e.name = "시간 초과";
      reject(e);
    }, ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}
