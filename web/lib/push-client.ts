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

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return { status: "denied" };

    await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
    const registration = await navigator.serviceWorker.ready;
    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      }));

    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
      return { status: "error", message: "알림 구독 정보를 받지 못했어요." };
    }

    const result = await save({ endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth });
    if (result.error) return { status: "error", message: result.error };
    return { status: "push" };
  } catch (e) {
    console.error("푸시 구독 실패:", e);
    return { status: "error", message: "알림을 켜지 못했어요. 잠시 뒤에 다시 해 주세요." };
  }
}
