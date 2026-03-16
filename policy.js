(function initPolicy() {
  const POLICY_VERSION = "2026-03-15";
  const MAX_VIOLATIONS = 1;

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

  async function enforcePolicyForUser(user) {
    if (!user) return { allowed: false, reason: "no-user" };

    const doc = await firebase.firestore().collection("users").doc(user.uid).get();
    const data = doc.exists ? doc.data() : {};

    if (data.terminated) {
      await firebase.auth().signOut();
      clearSessionCookie();
      return { allowed: false, reason: "terminated", message: "Your account was terminated for policy violations." };
    }

    if (data.acceptedPolicyVersion !== POLICY_VERSION) {
      return { allowed: false, reason: "policy-not-accepted", message: "Please re-accept the updated policy." };
    }

    return { allowed: true };
  }

  async function registerPolicyAcceptance(uid, email) {
    await firebase.firestore().collection("users").doc(uid).set({
      email: email || "",
      acceptedPolicyVersion: POLICY_VERSION,
      policyAcceptedAt: firebase.firestore.FieldValue.serverTimestamp(),
      policyViolations: 0,
      terminated: false
    }, { merge: true });
  }

  async function registerPolicyViolation(user, reason, context) {
    if (!user) return { terminated: false };

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
    enforcePolicyForUser,
    registerPolicyAcceptance,
    registerPolicyViolation
  };
})();
