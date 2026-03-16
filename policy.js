(function initPolicy() {
  const POLICY_VERSION = "2026-03-16";
  const MAX_VIOLATIONS = 1;
  const LOCAL_ACK_KEY = "kite_policy_ack_version";

  const POLICY_RULES = [
    "No hate speech, harassment, threats, or slurs.",
    "No sexual exploitation, violent threats, or encouragement of self-harm.",
    "No posting blacklisted abusive language in winds, replies, or profile text.",
    "Severe or repeated violations can result in account termination."
  ];

  function sessionCookieName() {
    return "kite_session";
  }

  function setSessionCookie(value, days) {
    const maxAge = Math.max(1, Number(days) || 30) * 24 * 60 * 60;
    document.cookie = `${sessionCookieName()}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax`;
  }

  function clearSessionCookie() {
    document.cookie = `${sessionCookieName()}=; path=/; max-age=0; samesite=lax`;
  }

  function hasSessionCookie() {
    return document.cookie.split(";").some((c) => c.trim().startsWith(`${sessionCookieName()}=`));
  }

  function hasLocalPolicyAck() {
    try {
      return localStorage.getItem(LOCAL_ACK_KEY) === POLICY_VERSION;
    } catch (error) {
      return false;
    }
  }

  function setLocalPolicyAck() {
    try {
      localStorage.setItem(LOCAL_ACK_KEY, POLICY_VERSION);
    } catch (error) {
      // ignore storage issues
    }
  }

  function removeExistingOverlay() {
    const existing = document.getElementById("kitePolicyOverlay");
    if (existing) existing.remove();
  }

  function presentPolicyOverlay(options = {}) {
    removeExistingOverlay();

    const {
      title = "Kite Policy Update",
      subtitle = "You must accept the policy to continue using Kite.",
      acceptText = "Accept Policy",
      rejectText = "Sign Out",
      allowReject = false
    } = options;

    const overlay = document.createElement("div");
    overlay.id = "kitePolicyOverlay";
    overlay.style.cssText = [
      "position:fixed",
      "inset:0",
      "z-index:99999",
      "background:rgba(2,6,23,0.9)",
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "padding:20px"
    ].join(";");

    const panel = document.createElement("div");
    panel.style.cssText = [
      "width:min(680px,95vw)",
      "max-height:90vh",
      "overflow:auto",
      "background:#0f172a",
      "border:1px solid #334155",
      "border-radius:14px",
      "padding:20px",
      "box-shadow:0 20px 80px rgba(0,0,0,0.5)",
      "color:#e2e8f0",
      "font-family:Inter,Arial,sans-serif"
    ].join(";");

    panel.innerHTML = `
      <h2 style="margin:0 0 8px">${title}</h2>
      <p style="margin:0 0 14px;color:#94a3b8">Policy version: ${POLICY_VERSION}</p>
      <p style="margin:0 0 14px">${subtitle}</p>
      <ul style="margin:0 0 16px;padding-left:20px;display:grid;gap:8px">${POLICY_RULES.map((r) => `<li>${r}</li>`).join("")}</ul>
      <p style="margin:0 0 16px;color:#fca5a5;font-weight:600">Breaking policy can lead to immediate account termination.</p>
      <label style="display:flex;gap:8px;align-items:flex-start;margin:0 0 16px">
        <input id="policyAckCheckbox" type="checkbox" />
        <span>I have read and accept Kite policy.</span>
      </label>
      <div style="display:flex;gap:10px;justify-content:flex-end">
        ${allowReject ? `<button id="policyRejectBtn" type="button" style="border:none;border-radius:10px;padding:10px 14px;background:#475569;color:white;cursor:pointer">${rejectText}</button>` : ""}
        <button id="policyAcceptBtn" type="button" style="border:none;border-radius:10px;padding:10px 14px;background:#4f46e5;color:white;cursor:pointer">${acceptText}</button>
      </div>
    `;

    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    const checkbox = panel.querySelector("#policyAckCheckbox");
    const acceptBtn = panel.querySelector("#policyAcceptBtn");
    const rejectBtn = panel.querySelector("#policyRejectBtn");

    return new Promise((resolve) => {
      acceptBtn.addEventListener("click", () => {
        if (!checkbox.checked) return;
        overlay.remove();
        resolve(true);
      });

      if (rejectBtn) {
        rejectBtn.addEventListener("click", () => {
          overlay.remove();
          resolve(false);
        });
      }
    });
  }

  async function requireLocalPolicyAcceptance(options = {}) {
    if (hasLocalPolicyAck()) return true;
    const accepted = await presentPolicyOverlay({
      title: options.title || "Kite Policy",
      subtitle: options.subtitle || "Before continuing, you must accept Kite policy.",
      acceptText: options.acceptText || "I Accept",
      allowReject: false
    });
    if (accepted) setLocalPolicyAck();
    return accepted;
  }

  async function enforcePolicyForUser(user) {
    if (!user || typeof firebase === "undefined") return { allowed: false, reason: "no-user" };

    const doc = await firebase.firestore().collection("users").doc(user.uid).get();
    const data = doc.exists ? doc.data() : {};

    if (data.terminated) {
      await firebase.auth().signOut();
      clearSessionCookie();
      return { allowed: false, reason: "terminated", message: "Your account was terminated for policy violations." };
    }

    if (data.acceptedPolicyVersion !== POLICY_VERSION) {
      return { allowed: false, reason: "policy-not-accepted", message: "Please accept the updated policy to continue." };
    }

    return { allowed: true };
  }

  async function registerPolicyAcceptance(uid, email) {
    if (typeof firebase === "undefined") return;
    await firebase.firestore().collection("users").doc(uid).set({
      email: email || "",
      acceptedPolicyVersion: POLICY_VERSION,
      policyAcceptedAt: firebase.firestore.FieldValue.serverTimestamp(),
      policyViolations: 0,
      terminated: false
    }, { merge: true });
    setLocalPolicyAck();
  }

  async function promptAndAcceptPolicyForUser(user, options = {}) {
    const accepted = await presentPolicyOverlay({
      title: options.title || "Policy Updated",
      subtitle: options.subtitle || "Kite policy was updated while you were away. Accept to continue.",
      acceptText: options.acceptText || "Accept Update",
      allowReject: true,
      rejectText: options.rejectText || "Sign Out"
    });

    if (!accepted) return false;

    await registerPolicyAcceptance(user.uid, user.email || "");
    return true;
  }

  async function registerPolicyViolation(user, reason, context) {
    if (!user || typeof firebase === "undefined") return { terminated: false };

    const userRef = firebase.firestore().collection("users").doc(user.uid);
    const snap = await userRef.get();
    const data = snap.exists ? snap.data() : {};
    const nextViolations = (Number(data.policyViolations) || 0) + 1;
    const shouldTerminate = nextViolations >= MAX_VIOLATIONS;

    await userRef.set({
      policyViolations: nextViolations,
      lastPolicyViolationReason: reason || "unknown",
      lastPolicyViolationContext: context || "",
      lastPolicyViolationAt: firebase.firestore.FieldValue.serverTimestamp(),
      terminated: shouldTerminate,
      terminatedAt: shouldTerminate ? firebase.firestore.FieldValue.serverTimestamp() : null
    }, { merge: true });

    if (shouldTerminate) {
      await firebase.auth().signOut();
      clearSessionCookie();
    }

    return { terminated: shouldTerminate, violations: nextViolations };
  }

  window.KITE_POLICY = {
    version: POLICY_VERSION,
    rules: POLICY_RULES,
    setSessionCookie,
    clearSessionCookie,
    hasSessionCookie,
    requireLocalPolicyAcceptance,
    enforcePolicyForUser,
    registerPolicyAcceptance,
    promptAndAcceptPolicyForUser,
    registerPolicyViolation
  };
})();
